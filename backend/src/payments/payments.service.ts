import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PublicKey } from '@solana/web3.js';
import { and, eq, isNull } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { demoPayments } from '../database/schema';
import {
  checkoutAmountCents,
  MoonpayClient,
  normalizePaymentAmounts,
  presentPaymentAmounts,
} from './moonpay.client';

type Order = typeof demoPayments.$inferSelect;

export function validateWallet(value: unknown): string {
  try {
    if (typeof value !== 'string') throw new Error();
    return new PublicKey(value).toBase58();
  } catch {
    throw new BadRequestException('A valid Solana wallet is required.');
  }
}

export function paymentReceipt(order: Order) {
  return {
    id: order.id,
    wallet: order.wallet,
    siteId: order.siteId,
    amount: (order.paymentAmounts?.principalCents ?? order.amountCents) / 100,
    checkoutAmount: order.amountCents / 100,
    paymentAmounts: order.paymentAmounts
      ? presentPaymentAmounts(order.paymentAmounts)
      : null,
    currency: order.fiatCurrency,
    usdcAllocation: order.usdcAllocation,
    status:
      order.status === 'pending' && order.cancelledAt
        ? 'cancelled'
        : order.status,
    transactionId: order.transactionId,
    completedAt: order.completedAt,
    simulated: true as const,
  };
}

@Injectable()
export class PaymentsService {
  constructor(
    private readonly database: DatabaseService,
    private readonly moonpay: MoonpayClient,
  ) {}

  quote(amount: unknown) {
    return this.moonpay.quote(this.validateAmount(amount));
  }

  private validateAmount(amount: unknown) {
    if (
      typeof amount !== 'number' ||
      !Number.isFinite(amount) ||
      amount < 20 ||
      amount > 5000 ||
      Math.abs(amount * 100 - Math.round(amount * 100)) > 0.000001
    ) {
      throw new BadRequestException(
        'Enter an amount between USD 20 and USD 5,000 with at most two decimal places.',
      );
    }
    return Math.round(amount * 100);
  }

  async create(body: { wallet?: unknown; siteId?: unknown; amount?: unknown }) {
    this.moonpay.assertConfigured();
    const wallet = validateWallet(body?.wallet);
    const { siteId, amount } = body;
    if (
      typeof siteId !== 'number' ||
      !Number.isSafeInteger(siteId) ||
      siteId <= 0 ||
      siteId > 2147483647
    ) {
      throw new BadRequestException('Invalid project.');
    }
    const amountCents = this.validateAmount(amount);
    const [order] = await this.database.db
      .insert(demoPayments)
      .values({
        wallet,
        siteId,
        amountCents,
        fiatCurrency: 'USD',
        createdAt: Date.now(),
      })
      .returning();
    return {
      ...paymentReceipt(order),
      publicKey: this.moonpay.publicKey,
    };
  }

  private async order(id: string) {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id,
      )
    )
      throw new BadRequestException('Invalid payment ID.');
    const [order] = await this.database.db
      .select()
      .from(demoPayments)
      .where(eq(demoPayments.id, id));
    if (!order) throw new NotFoundException('Payment not found.');
    return order;
  }

  async checkout(id: string, ip: string) {
    this.assertOpen(await this.order(id));
    return { allowedIpAddress: await this.moonpay.ipHash(ip) };
  }

  private assertOpen(order: Order) {
    if (order.status !== 'pending' || order.cancelledAt)
      throw new ConflictException(
        'This checkout is closed. Start a new payment.',
      );
  }

  async cancel(id: string) {
    // Never discard a paid or processing provider transaction when leaving checkout.
    const receipt = await this.verify(id);
    if (receipt.status === 'completed') return receipt;
    if (receipt.transactionId)
      throw new ConflictException(
        'MoonPay is already processing this payment. Check its status before making another investment. Closing checkout does not cancel a submitted payment.',
      );
    const [cancelled] = await this.database.db
      .update(demoPayments)
      .set({ cancelledAt: Date.now() })
      .where(and(eq(demoPayments.id, id), eq(demoPayments.status, 'pending')))
      .returning();
    return paymentReceipt(cancelled ?? (await this.order(id)));
  }

  async sign(id: string, rawUrl: unknown, ip: string) {
    const order = await this.order(id);
    this.assertOpen(order);
    if (typeof rawUrl !== 'string' || rawUrl.length > 4096)
      throw new BadRequestException('Invalid checkout URL.');
    let url: URL;
    try {
      url = new URL(rawUrl);
    } catch {
      throw new BadRequestException('Invalid checkout URL.');
    }
    const expected: Record<string, string> = {
      apiKey: this.moonpay.publicKey,
      walletAddress: order.wallet,
      externalTransactionId: order.id,
      currencyCode: 'sol',
      baseCurrencyCode: order.fiatCurrency.toLowerCase(),
      baseCurrencyAmount: String(order.amountCents / 100),
      lockAmount: 'true',
      allowedIpAddress: await this.moonpay.ipHash(ip),
    };
    const allowed = new Set([
      ...Object.keys(expected),
      'sdkVersion',
      'sdkName',
      'sdkPlatform',
      'platform',
      'theme',
      'colorCode',
      'language',
      'mpSdk',
    ]);
    if (
      !(
        (url.origin === 'https://buy-sandbox.moonpay.com' &&
          url.pathname === '/') ||
        (url.origin === 'https://buy.moonpay.com' && url.pathname === '/v2/buy')
      ) ||
      url.hash ||
      url.username ||
      url.password ||
      [...url.searchParams].some(
        ([key]) =>
          !allowed.has(key) || url.searchParams.getAll(key).length !== 1,
      ) ||
      Object.entries(expected).some(
        ([key, value]) => url.searchParams.get(key) !== value,
      )
    ) {
      throw new BadRequestException(
        'Checkout parameters do not match this payment.',
      );
    }
    if (url.searchParams.has('mpSdk')) {
      let sdk: Record<string, unknown>;
      try {
        sdk = JSON.parse(url.searchParams.get('mpSdk')!);
      } catch {
        throw new BadRequestException('Invalid checkout SDK metadata.');
      }
      if (
        !sdk ||
        sdk.environment !== 'sandbox' ||
        sdk.flow !== 'buy' ||
        sdk.platform !== 'web' ||
        sdk.variant !== 'embedded'
      ) {
        throw new BadRequestException('Only sandbox checkout is supported.');
      }
    }
    return { signature: this.moonpay.sign(url.search) };
  }

  async verify(id: string) {
    const order = await this.order(id);
    if (order.status === 'completed')
      return paymentReceipt(await this.withAllocation(order));
    // Browser callbacks are hints only. Fetch authoritative status using our own API key.
    const transactions = await this.moonpay.transactions(id);
    const linked = transactions.filter(
      (tx) =>
        tx &&
        typeof tx === 'object' &&
        tx.externalTransactionId === order.id &&
        tx.walletAddress === order.wallet &&
        tx.baseCurrency?.code === order.fiatCurrency.toLowerCase() &&
        tx.currency?.code === 'sol' &&
        typeof tx.id === 'string' &&
        tx.id.length > 0,
    );
    const matches = linked.filter(
      (tx) => checkoutAmountCents(tx) === order.amountCents,
    );
    const paid = matches.find((tx) => tx.status === 'completed');
    if (!paid) {
      if (linked.some((tx) => tx.status === 'completed')) {
        throw new ConflictException(
          'MoonPay completed your payment, but its amount does not match this order. Do not pay again; the payment needs review.',
        );
      }
      const processing = matches.find((tx) =>
        ['pending', 'waitingAuthorization', 'waitingPayment'].includes(
          tx.status,
        ),
      );
      return {
        ...paymentReceipt(order),
        transactionId: processing?.id ?? null,
        status:
          !processing && matches.some((tx) => tx.status === 'failed')
            ? 'failed'
            : processing
              ? 'pending'
              : order.cancelledAt
                ? 'cancelled'
                : 'pending',
      };
    }
    const [completed] = await this.database.db
      .update(demoPayments)
      .set({
        status: 'completed',
        transactionId: paid.id,
        completedAt: Date.now(),
        paymentAmounts: normalizePaymentAmounts(paid),
      })
      .where(and(eq(demoPayments.id, id), eq(demoPayments.status, 'pending')))
      .returning();
    return paymentReceipt(
      await this.withAllocation(completed ?? (await this.order(id))),
    );
  }

  private async withAllocation(order: Order): Promise<Order> {
    if (order.usdcAllocation || order.status !== 'completed') return order;
    const usdcAllocation = await this.moonpay.allocation(
      order.paymentAmounts?.principalCents ?? order.amountCents,
      order.fiatCurrency,
      order.completedAt ?? order.createdAt,
    );
    const [updated] = await this.database.db
      .update(demoPayments)
      .set({ usdcAllocation })
      .where(
        and(eq(demoPayments.id, order.id), isNull(demoPayments.usdcAllocation)),
      )
      .returning();
    return updated ?? (await this.order(order.id));
  }

  async list(wallet: unknown) {
    const orders = await this.database.db
      .select()
      .from(demoPayments)
      .where(
        and(
          eq(demoPayments.wallet, validateWallet(wallet)),
          eq(demoPayments.status, 'completed'),
        ),
      );
    return Promise.all(
      orders.map(async (order) =>
        paymentReceipt(await this.withAllocation(order)),
      ),
    );
  }
}
