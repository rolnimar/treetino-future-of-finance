import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';
import type { DemoPaymentAmounts } from '../database/schema';

export interface MoonpayTransaction {
  id: string;
  status: string;
  externalTransactionId: string;
  baseCurrencyAmount: number;
  feeAmount: number;
  networkFeeAmount: number;
  extraFeeAmount: number;
  areFeesIncluded: boolean;
  baseCurrency: { code: string };
  currency: { code: string };
  walletAddress: string;
}

// MoonPay returns the net fiat principal in baseCurrencyAmount. With inclusive
// checkout pricing, the amount entered in our widget is principal plus fees.
type MoneyFields = Pick<
  MoonpayTransaction,
  | 'baseCurrencyAmount'
  | 'feeAmount'
  | 'networkFeeAmount'
  | 'extraFeeAmount'
  | 'areFeesIncluded'
>;

export function normalizePaymentAmounts(
  tx: MoneyFields,
): DemoPaymentAmounts | null {
  const amounts = [
    tx.baseCurrencyAmount,
    tx.feeAmount,
    tx.networkFeeAmount,
    tx.extraFeeAmount,
  ];
  if (
    typeof tx.areFeesIncluded !== 'boolean' ||
    amounts.some(
      (amount) =>
        typeof amount !== 'number' ||
        !Number.isFinite(amount) ||
        amount < 0 ||
        !Number.isSafeInteger(Math.round(amount * 100)) ||
        Math.abs(amount * 100 - Math.round(amount * 100)) > 0.000001,
    ) ||
    tx.baseCurrencyAmount <= 0
  )
    return null;
  const [principalCents, moonpayFeeCents, networkFeeCents, extraFeeCents] =
    amounts.map((amount) => Math.round(amount * 100));
  const totalPaidCents =
    principalCents + moonpayFeeCents + networkFeeCents + extraFeeCents;
  if (!Number.isSafeInteger(totalPaidCents)) return null;
  return {
    principalCents,
    moonpayFeeCents,
    networkFeeCents,
    extraFeeCents,
    totalPaidCents,
    checkoutCents: tx.areFeesIncluded ? totalPaidCents : principalCents,
  };
}

export function checkoutAmountCents(tx: MoneyFields): number | null {
  return normalizePaymentAmounts(tx)?.checkoutCents ?? null;
}

export function presentPaymentAmounts(amounts: DemoPaymentAmounts) {
  return {
    amountPaid: amounts.totalPaidCents / 100,
    moonpayFee: amounts.moonpayFeeCents / 100,
    networkFee: amounts.networkFeeCents / 100,
    extraFee: amounts.extraFeeCents / 100,
    totalFees:
      (amounts.moonpayFeeCents +
        amounts.networkFeeCents +
        amounts.extraFeeCents) /
      100,
    netInvested: amounts.principalCents / 100,
  };
}

@Injectable()
export class MoonpayClient {
  readonly publicKey = process.env.MOONPAY_PUBLIC_KEY ?? '';
  private readonly secretKey = process.env.MOONPAY_SECRET_KEY ?? '';

  async allocation(principalCents: number, currency: 'USD', at: number) {
    return {
      amountUsdc: principalCents / 100,
      rate: 1,
      rateDate: new Date(at).toISOString().slice(0, 10),
      source: currency,
    };
  }

  assertConfigured() {
    // This integration intentionally cannot accept real payments.
    if (
      !this.publicKey.startsWith('pk_test_') ||
      !this.secretKey.startsWith('sk_test_')
    ) {
      throw new ServiceUnavailableException(
        'MoonPay sandbox is not configured on the backend.',
      );
    }
  }

  sign(query: string) {
    this.assertConfigured();
    return createHmac('sha256', this.secretKey).update(query).digest('base64');
  }

  async quote(amountCents: number) {
    this.assertConfigured();
    const url = new URL('https://api.moonpay.com/v3/currencies/sol/buy_quote');
    url.search = new URLSearchParams({
      apiKey: this.publicKey,
      baseCurrencyCode: 'usd',
      baseCurrencyAmount: String(amountCents / 100),
      areFeesIncluded: 'true',
      paymentMethod: 'credit_debit_card',
    }).toString();
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10_000),
      });
      const data = await response.json();
      const amounts =
        response.ok && data && typeof data === 'object'
          ? normalizePaymentAmounts({ ...data, areFeesIncluded: true })
          : null;
      if (
        !amounts ||
        amounts.checkoutCents !== amountCents ||
        data.baseCurrencyCode !== 'usd' ||
        data.quoteCurrencyCode !== 'sol'
      )
        throw new Error();
      return presentPaymentAmounts(amounts);
    } catch {
      throw new BadGatewayException(
        'Fee estimate is unavailable. MoonPay will show final fees before payment.',
      );
    }
  }

  async ipHash(rawIp: string) {
    this.assertConfigured();
    let ip = rawIp.replace(/^::ffff:/i, '');
    // Local development reaches the backend on loopback. MoonPay observes this
    // machine's public egress address instead. Never use this fallback remotely.
    if (
      (ip === '::1' || ip === '127.0.0.1') &&
      process.env.NODE_ENV !== 'production'
    ) {
      try {
        const response = await fetch(
          `https://api.moonpay.com/v3/ip_address?apiKey=${encodeURIComponent(this.publicKey)}`,
          { signal: AbortSignal.timeout(10_000) },
        );
        const data = await response.json();
        ip =
          response.ok && typeof data.ipAddress === 'string'
            ? data.ipAddress
            : '';
      } catch {
        ip = '';
      }
    }
    const family = isIP(ip);
    if (!family)
      throw new ServiceUnavailableException(
        'Could not determine your public IP for MoonPay. Please retry.',
      );
    if (family === 6) ip = new URL(`http://[${ip}]/`).hostname.slice(1, -1);
    return this.sign(ip);
  }

  async transactions(orderId: string): Promise<MoonpayTransaction[]> {
    this.assertConfigured();
    let response: Response;
    try {
      response = await fetch(
        `https://api.moonpay.com/v1/transactions/ext/${encodeURIComponent(orderId)}?apiKey=${encodeURIComponent(this.publicKey)}`,
        { signal: AbortSignal.timeout(15_000) },
      );
    } catch {
      throw new BadGatewayException(
        'MoonPay is unavailable. Retry payment verification.',
      );
    }
    if (response.status === 404) return [];
    if (!response.ok)
      throw new BadGatewayException(
        'MoonPay could not verify this payment. Please retry.',
      );
    const data: unknown = await response.json().catch(() => null);
    if (!Array.isArray(data))
      throw new BadGatewayException('Unexpected MoonPay response.');
    return data;
  }
}
