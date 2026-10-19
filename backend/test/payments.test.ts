import 'reflect-metadata';
import { afterEach, expect, spyOn, test } from 'bun:test';
import { createHmac } from 'node:crypto';
import { DatabaseService } from '../dist/database/database.service.js';
import {
  checkoutAmountCents,
  MoonpayClient,
} from '../dist/payments/moonpay.client.js';
import { PaymentsService } from '../dist/payments/payments.service.js';
import { PaymentsReconciler } from '../dist/payments/payments-reconciler.service.js';
import { DeviceCatalogService } from '../dist/devices/device-catalog.service.js';
import { DeviceLedgerService } from '../dist/devices/device-ledger.service.js';
import { VictronService } from '../dist/victron/victron.service.js';
import { testDatabase } from './database.fixture';
import { Keypair } from '@solana/web3.js';
import { eq } from 'drizzle-orm';
import { demoPayments, demoWallets } from '../dist/database/schema.js';

const wallet = '11111111111111111111111111111111';
const cleanup: (() => void | Promise<void>)[] = [];
afterEach(async () => {
  for (const dispose of cleanup.splice(0).reverse()) await dispose();
});

function client() {
  const previous = {
    public: process.env.MOONPAY_PUBLIC_KEY,
    secret: process.env.MOONPAY_SECRET_KEY,
  };
  process.env.MOONPAY_PUBLIC_KEY = 'pk_test_fixture';
  process.env.MOONPAY_SECRET_KEY = 'sk_test_fixture';
  const result = new MoonpayClient();
  if (previous.public === undefined) delete process.env.MOONPAY_PUBLIC_KEY;
  else process.env.MOONPAY_PUBLIC_KEY = previous.public;
  if (previous.secret === undefined) delete process.env.MOONPAY_SECRET_KEY;
  else process.env.MOONPAY_SECRET_KEY = previous.secret;
  return result;
}

async function fixture() {
  const database = await testDatabase();
  cleanup.push(() => database.cleanup());
  const db = await DatabaseService.create(database.config);
  cleanup.push(() => db.onApplicationShutdown());
  const moonpay = client();
  const catalog = new DeviceCatalogService(db, new VictronService());
  await catalog.seed();
  const ledger = new DeviceLedgerService(db, catalog);
  const service = new PaymentsService(db, moonpay, ledger);
  const order = await service.create({ wallet, siteId: 219742, amount: 500 });
  return { service, moonpay, order, db, ledger };
}

function transaction(order: { id: string }) {
  return {
    id: crypto.randomUUID(),
    externalTransactionId: order.id,
    walletAddress: wallet,
    baseCurrencyAmount: 500,
    feeAmount: 0,
    networkFeeAmount: 0,
    extraFeeAmount: 0,
    areFeesIncluded: false,
    baseCurrency: { code: 'usd' },
    currency: { code: 'sol' },
    status: 'completed',
  };
}

async function chargingFixture() {
  const f = await fixture();
  const alice = Keypair.generate().publicKey.toBase58(),
    bob = Keypair.generate().publicKey.toBase58();
  await f.ledger.invest(alice, 374891, {
    id: crypto.randomUUID(),
    amount: '100',
  });
  await f.ledger.invest(bob, 374891, {
    id: crypto.randomUUID(),
    amount: '300',
  });
  let now = Date.now();
  const clock = spyOn(Date, 'now').mockImplementation(() => now);
  cleanup.push(() => clock.mockRestore());
  const session = await f.ledger.start(wallet, 374891, {
    id: crypto.randomUUID(),
    kwh: '1',
  });
  now += 4000;
  await f.ledger.stop(wallet, session.id);
  const quote = spyOn(f.moonpay, 'quote').mockImplementation(async (cents) => ({
    amountPaid: cents / 100,
    moonpayFee: 3.99,
    networkFee: 0.29,
    extraFee: 0,
    totalFees: 4.28,
    netInvested: (cents - 428) / 100,
  }));
  const provider = spyOn(f.moonpay, 'transactions').mockResolvedValue([]);
  cleanup.push(
    () => quote.mockRestore(),
    () => provider.mockRestore(),
  );
  const paidTransaction = (id: string) => ({
    ...transaction({ id }),
    baseCurrencyAmount: 15.72,
    feeAmount: 3.99,
    networkFeeAmount: 0.29,
    areFeesIncluded: true,
  });
  return {
    ...f,
    session,
    alice,
    bob,
    provider,
    quote,
    paidTransaction,
    advance: (ms: number) => {
      now += ms;
    },
  };
}

test('MoonPay charging checkout resumes, pays the immutable bill, credits excess funds and distributes exactly once', async () => {
  const {
    service,
    ledger,
    session,
    provider,
    paidTransaction,
    alice,
    bob,
    db,
    moonpay,
  } = await chargingFixture();
  expect(await service.chargingOrder(wallet, session.id)).toEqual({
    order: null,
  });
  await expect(service.createCharging(alice, session.id)).rejects.toThrow(
    'another wallet',
  );
  const orders = await Promise.all(
    Array.from({ length: 4 }, () => service.createCharging(wallet, session.id)),
  );
  const order = orders[0];
  expect(new Set(orders.map((o) => o.id)).size).toBe(1);
  expect(order).toMatchObject({
    chargingSessionId: session.id,
    checkoutAmount: 20,
    status: 'pending',
  });
  expect((await service.chargingOrder(wallet, session.id)).order?.id).toBe(
    order.id,
  );
  await expect(ledger.pay(wallet, session.id, undefined)).rejects.toThrow(
    'current card checkout',
  );
  await expect(ledger.cancelSession(wallet, session.id)).rejects.toThrow(
    'current card checkout',
  );
  expect((await ledger.portfolio(alice)).totals.earnedUsdc).toBe(0);
  const tx = paidTransaction(order.id);
  provider.mockResolvedValue([tx]);
  const results = await Promise.all(
    Array.from({ length: 5 }, () => service.verify(order.id)),
  );
  expect(new Set(results.map((r) => r.settledAt)).size).toBe(1);
  expect(await ledger.getSession(session.id)).toMatchObject({
    status: 'paid',
    amountUnits: '2920000',
    paymentMethod: 'card',
    memoReference: tx.id,
  });
  expect((await ledger.balance(wallet)).balance).toBe('10012800000');
  expect((await ledger.portfolio(alice)).totals.earnedUsdc).toBe(0.73);
  expect((await ledger.portfolio(bob)).totals.earnedUsdc).toBe(2.19);
  expect(
    (await ledger.catalogResponse()).demos.find((d) => d.siteId === 374891)
      ?.financials.fundedUsdc,
  ).toBe(400);
  expect((await ledger.portfolio(wallet)).totals.investedUsdc).toBe(0);
  expect(await service.list(wallet)).toEqual([]);
  const reopened = new PaymentsService(db, moonpay, ledger);
  provider.mockRejectedValue(new Error('offline'));
  await reopened.verify(order.id);
  await ledger.pay(wallet, session.id, undefined);
  expect((await ledger.balance(wallet)).balance).toBe('10012800000');
  expect((await ledger.portfolio(alice)).totals.earnedUsdc).toBe(0.73);
});

test('cancelling an unsubmitted charging checkout unlocks USDC; late card completion credits funds without double revenue', async () => {
  const { service, ledger, session, provider, paidTransaction, alice } =
    await chargingFixture();
  const order = await service.createCharging(wallet, session.id);
  expect((await service.cancel(order.id)).status).toBe('cancelled');
  provider.mockRejectedValue(new Error('MoonPay temporarily unavailable'));
  expect((await service.chargingOrder(wallet, session.id)).order?.status).toBe(
    'cancelled',
  );
  expect((await ledger.getSession(session.id)).status).toBe('awaiting_payment');
  await ledger.pay(wallet, session.id, 'direct-usdc');
  expect((await ledger.balance(wallet)).balance).toBe('9997080000');
  provider.mockResolvedValue([paidTransaction(order.id)]);
  await service.verify(order.id);
  expect((await ledger.balance(wallet)).balance).toBe('10012800000');
  expect((await ledger.getSession(session.id)).paymentMethod).toBe('usdc');
  expect((await ledger.portfolio(alice)).totals.earnedUsdc).toBe(0.73);
});

test('processing card orders cannot be cancelled; a fee-adjusted checkout covers larger charging bills', async () => {
  const {
    service,
    ledger,
    session,
    provider,
    paidTransaction,
    quote,
    advance,
  } = await chargingFixture();
  const order = await service.createCharging(wallet, session.id);
  provider.mockResolvedValue([
    { ...paidTransaction(order.id), status: 'waitingPayment' },
  ]);
  await expect(service.cancel(order.id)).rejects.toThrow('already processing');
  await expect(ledger.pay(wallet, session.id, undefined)).rejects.toThrow(
    'current card checkout',
  );
  provider.mockResolvedValue([]);
  await service.cancel(order.id);
  await ledger.cancelSession(wallet, session.id);
  await expect(service.createCharging(wallet, session.id)).rejects.toThrow(
    'Stop charging',
  );
  // A larger saved bill requires fees on top of its USD principal.
  const large = await ledger.start(wallet, 374891, {
    id: crypto.randomUUID(),
    kwh: '200',
  });
  advance(600000);
  expect((await ledger.stop(wallet, large.id)).amountUsdc).toBe(86.5);
  expect((await service.createCharging(wallet, large.id)).checkoutAmount).toBe(
    91.78,
  );
  expect(quote.mock.calls.map((args) => args[0])).toEqual([2000, 8650, 9178]);
});

test('a completed card payment interrupted before settlement is reconciled without an open browser', async () => {
  const { service, ledger, session, provider, paidTransaction, db, moonpay } =
    await chargingFixture();
  const order = await service.createCharging(wallet, session.id);
  provider.mockResolvedValue([paidTransaction(order.id)]);
  const settle = spyOn(ledger, 'settleChargingCardOrder').mockRejectedValueOnce(
    new Error('database temporarily unavailable'),
  );
  await expect(service.verify(order.id)).rejects.toThrow(
    'temporarily unavailable',
  );
  settle.mockRestore();
  expect(
    (
      await db.db
        .select()
        .from(demoPayments)
        .where(eq(demoPayments.id, order.id))
    )[0],
  ).toMatchObject({ status: 'completed', settledAt: null });
  const previous = process.env.PAYMENTS_RECONCILE_ENABLED;
  process.env.PAYMENTS_RECONCILE_ENABLED = 'true';
  try {
    await new PaymentsReconciler(db, service, moonpay).reconcile();
  } finally {
    if (previous === undefined) delete process.env.PAYMENTS_RECONCILE_ENABLED;
    else process.env.PAYMENTS_RECONCILE_ENABLED = previous;
  }
  expect((await ledger.getSession(session.id)).status).toBe('paid');
  expect((await ledger.balance(wallet)).balance).toBe('10012800000');
});

test('unexpectedly insufficient net card funds remain in the wallet without marking a charging bill paid', async () => {
  const { service, ledger, session, provider, paidTransaction, db, alice } =
    await chargingFixture();
  const order = await service.createCharging(wallet, session.id);
  await ledger.balance(wallet);
  await db.db
    .update(demoWallets)
    .set({ balanceUnits: '0' })
    .where(eq(demoWallets.wallet, wallet));
  provider.mockResolvedValue([
    { ...paidTransaction(order.id), baseCurrencyAmount: 1, feeAmount: 18.71 },
  ]);
  await service.verify(order.id);
  expect((await ledger.getSession(session.id)).status).toBe('awaiting_payment');
  expect((await ledger.balance(wallet)).balance).toBe('1000000');
  expect((await ledger.portfolio(alice)).totals.earnedUsdc).toBe(0);
});

test('only completed provider payments allocate, with concurrent and repeated verification idempotent', async () => {
  const { service, moonpay, order, db, ledger } = await fixture();
  const tx = transaction(order);
  const fetch = spyOn(moonpay, 'transactions').mockResolvedValue([
    { ...tx, status: 'pending' },
  ]);
  cleanup.push(() => fetch.mockRestore());
  expect((await service.verify(order.id)).status).toBe('pending');
  expect(await service.list(wallet)).toEqual([]);
  fetch.mockResolvedValue([{ ...tx, status: 'failed' }]);
  expect((await service.verify(order.id)).status).toBe('failed');
  expect(await service.list(wallet)).toEqual([]);
  fetch.mockResolvedValue([tx]);
  const completed = await Promise.all([
    service.verify(order.id),
    service.verify(order.id),
  ]);
  expect(completed[0]).toEqual(completed[1]);
  expect(completed[0]).toMatchObject({
    status: 'completed',
    transactionId: tx.id,
    simulated: true,
    amount: 500,
    currency: 'USD',
  });
  fetch.mockRejectedValue(new Error('Provider temporarily unavailable'));
  expect(await service.verify(order.id)).toEqual(completed[0]);
  const reopened = new PaymentsService(db, client(), ledger);
  expect(await reopened.list(wallet)).toEqual([completed[0]]);
  expect(
    await reopened.list('So11111111111111111111111111111111111111112'),
  ).toEqual([]);
});

test('wrong order, amount, currency, destination or crypto cannot fulfill payment', async () => {
  const { service, moonpay, order } = await fixture();
  const tx = transaction(order);
  const fetch = spyOn(moonpay, 'transactions');
  cleanup.push(() => fetch.mockRestore());
  for (const mismatch of [
    { externalTransactionId: crypto.randomUUID() },
    { baseCurrency: { code: 'eur' } },
    { currency: { code: 'eth' } },
    { walletAddress: 'So11111111111111111111111111111111111111112' },
  ]) {
    fetch.mockResolvedValue([{ ...tx, ...mismatch }]);
    expect((await service.verify(order.id)).status).toBe('pending');
    expect(await service.list(wallet)).toEqual([]);
  }
});

test('completed fee-inclusive checkout matches gross amount and recovers once after retries', async () => {
  const { service, moonpay } = await fixture();
  const order = await service.create({ wallet, siteId: 219742, amount: 100 });
  // Sanitized amounts from the completed fee-inclusive sandbox payment.
  const tx = {
    ...transaction(order),
    baseCurrencyAmount: 95.72,
    feeAmount: 3.99,
    networkFeeAmount: 0.29,
    extraFeeAmount: 0,
    areFeesIncluded: true,
  };
  const fetch = spyOn(moonpay, 'transactions').mockResolvedValue([
    tx,
    { ...tx, id: crypto.randomUUID() },
  ]);
  cleanup.push(() => fetch.mockRestore());
  expect(checkoutAmountCents(tx)).toBe(10000);
  const recovered = await service.verify(order.id);
  expect(recovered).toMatchObject({
    status: 'completed',
    amount: 95.72,
    checkoutAmount: 100,
    paymentAmounts: {
      amountPaid: 100,
      totalFees: 4.28,
      netInvested: 95.72,
      moonpayFee: 3.99,
      networkFee: 0.29,
      extraFee: 0,
    },
    transactionId: tx.id,
  });
  expect(await service.verify(order.id)).toEqual(recovered);
  expect(await service.list(wallet)).toEqual([recovered]);
});

test('fee-exclusive checkout keeps fees separate and rejects wrong totals or malformed fee data', async () => {
  const { service, moonpay, order } = await fixture();
  const tx = {
    ...transaction(order),
    feeAmount: 3.99,
    networkFeeAmount: 0.29,
    extraFeeAmount: 0.1,
  };
  expect(checkoutAmountCents(tx)).toBe(50000);
  expect(checkoutAmountCents({ ...tx, areFeesIncluded: true })).toBe(50438);
  const fetch = spyOn(moonpay, 'transactions');
  cleanup.push(() => fetch.mockRestore());
  for (const change of [
    { baseCurrencyAmount: 499.99 },
    { areFeesIncluded: true },
    { feeAmount: -1 },
    { feeAmount: NaN },
    { networkFeeAmount: 0.001 },
    { feeAmount: undefined },
  ]) {
    fetch.mockResolvedValue([{ ...tx, ...change } as typeof tx]);
    await expect(service.verify(order.id)).rejects.toThrow('Do not pay again');
    expect(await service.list(wallet)).toEqual([]);
  }
  fetch.mockResolvedValue([tx]);
  expect((await service.verify(order.id)).status).toBe('completed');
});

test('checkout signing binds all payment fields and rejects URL tampering', async () => {
  const { service, moonpay, order } = await fixture();
  const url = new URL('https://buy.moonpay.com/v2/buy');
  url.search = new URLSearchParams({
    apiKey: moonpay.publicKey,
    walletAddress: wallet,
    externalTransactionId: order.id,
    currencyCode: 'sol',
    baseCurrencyCode: 'usd',
    baseCurrencyAmount: '500',
    lockAmount: 'true',
    allowedIpAddress: await moonpay.ipHash('203.0.113.42'),
    mpSdk: JSON.stringify({
      environment: 'sandbox',
      flow: 'buy',
      platform: 'web',
      variant: 'embedded',
      version: '1.10.10',
    }),
  }).toString();
  expect(await service.sign(order.id, url.toString(), '203.0.113.42')).toEqual({
    signature: createHmac('sha256', 'sk_test_fixture')
      .update(url.search)
      .digest('base64'),
  });
  for (const [key, value] of [
    ['walletAddress', 'another-wallet'],
    ['baseCurrencyAmount', '1'],
    ['externalTransactionId', crypto.randomUUID()],
    ['currencyCode', 'eth'],
    ['apiKey', 'pk_live_real'],
    ['lockAmount', 'false'],
    ['allowedIpAddress', 'forged-ip-hash'],
    ['redirectURL', 'https://example.com'],
    ['mpSdk', '{"environment":"production"}'],
  ]) {
    const altered = new URL(url);
    altered.searchParams.set(key, value);
    await expect(
      service.sign(order.id, altered.toString(), '203.0.113.42'),
    ).rejects.toThrow();
  }
  const duplicated = new URL(url);
  duplicated.searchParams.append('walletAddress', wallet);
  await expect(
    service.sign(order.id, duplicated.toString(), '203.0.113.42'),
  ).rejects.toThrow();
  await expect(
    service.sign(
      order.id,
      url.toString().replace('buy.moonpay.com', 'evil.example'),
      '203.0.113.42',
    ),
  ).rejects.toThrow();
});

test('order validation rejects malformed identities and out-of-range or fractional amounts', async () => {
  const { service } = await fixture();
  for (const amount of [0, -1, 19.99, 5001, NaN, Infinity, 20.001, '500']) {
    await expect(
      service.create({ wallet, siteId: 1, amount }),
    ).rejects.toThrow();
  }
  await expect(
    service.create({ wallet: 'bad', siteId: 1, amount: 100 }),
  ).rejects.toThrow();
  await expect(
    service.create({ wallet, siteId: 1.5, amount: 100 }),
  ).rejects.toThrow();
  expect(
    (await service.create({ wallet, siteId: 1, amount: 20.01 })).amount,
  ).toBe(20.01);
});

test('provider failures cannot fabricate a receipt', async () => {
  const { service, moonpay, order } = await fixture();
  const fetch = spyOn(moonpay, 'transactions').mockRejectedValue(
    new Error('Provider timeout'),
  );
  cleanup.push(() => fetch.mockRestore());
  await expect(service.verify(order.id)).rejects.toThrow('Provider timeout');
  expect(await service.list(wallet)).toEqual([]);
});

test('unpaid checkout can be cancelled and cannot be reopened, while a late provider payment is still recovered', async () => {
  const { service, moonpay, order, db } = await fixture();
  const fetch = spyOn(moonpay, 'transactions').mockResolvedValue([]);
  cleanup.push(() => fetch.mockRestore());
  expect((await service.cancel(order.id)).status).toBe('cancelled');
  expect((await service.verify(order.id)).status).toBe('cancelled');
  await expect(service.checkout(order.id, '203.0.113.42')).rejects.toThrow(
    'checkout is closed',
  );
  await expect(
    service.sign(order.id, 'https://buy.moonpay.com/v2/buy', '203.0.113.42'),
  ).rejects.toThrow('checkout is closed');
  expect(await service.list(wallet)).toEqual([]);
  const replacement = await service.create({
    wallet,
    siteId: 219742,
    amount: 100,
  });
  expect(replacement.id).not.toBe(order.id);
  expect(replacement.amount).toBe(100);
  const tx = transaction(order);
  fetch.mockImplementation(async (id) => (id === order.id ? [tx] : []));
  // A previously signed MoonPay URL could settle after cancellation. Keep checking it.
  await new PaymentsReconciler(db, service, moonpay).reconcile();
  const receipts = await service.list(wallet);
  expect(receipts).toHaveLength(1);
  expect(receipts[0]).toMatchObject({
    id: order.id,
    status: 'completed',
    transactionId: tx.id,
  });
  expect((await service.cancel(order.id)).status).toBe('completed');
});

test('processing, paid and unverifiable provider payments cannot be silently discarded', async () => {
  const { service, moonpay, order } = await fixture();
  const tx = transaction(order);
  const fetch = spyOn(moonpay, 'transactions').mockResolvedValue([
    { ...tx, status: 'pending' },
  ]);
  cleanup.push(() => fetch.mockRestore());
  await expect(service.cancel(order.id)).rejects.toThrow('already processing');
  expect((await service.verify(order.id)).status).toBe('pending');
  await expect(
    service.checkout(order.id, '203.0.113.42'),
  ).resolves.toBeDefined();
  fetch.mockRejectedValue(new Error('Provider timeout'));
  await expect(service.cancel(order.id)).rejects.toThrow('Provider timeout');
  fetch.mockResolvedValue([tx]);
  expect((await service.cancel(order.id)).status).toBe('completed');
  expect(await service.list(wallet)).toHaveLength(1);
});

test('fee quotes validate amounts and preserve the provider fee breakdown', async () => {
  const { service } = await fixture();
  const fetch = spyOn(globalThis, 'fetch').mockResolvedValue(
    Response.json({
      baseCurrencyCode: 'usd',
      quoteCurrencyCode: 'sol',
      baseCurrencyAmount: 95.72,
      feeAmount: 3.99,
      networkFeeAmount: 0.29,
      extraFeeAmount: 0,
      totalAmount: 100,
    }),
  );
  cleanup.push(() => fetch.mockRestore());
  expect(() => service.quote(-1)).toThrow('Enter an amount');
  expect(fetch).not.toHaveBeenCalled();
  expect(await service.quote(100)).toEqual({
    amountPaid: 100,
    netInvested: 95.72,
    totalFees: 4.28,
    moonpayFee: 3.99,
    networkFee: 0.29,
    extraFee: 0,
  });
  const url = new URL(String(fetch.mock.calls[0][0]));
  expect(url.searchParams.get('areFeesIncluded')).toBe('true');
  expect(url.searchParams.get('baseCurrencyAmount')).toBe('100');
  expect(url.searchParams.get('baseCurrencyCode')).toBe('usd');
  fetch.mockResolvedValue(Response.json({ baseCurrencyAmount: 100 }));
  await expect(service.quote(100)).rejects.toThrow(
    'Fee estimate is unavailable',
  );
});

test('background reconciliation completes paid orders without browser requests and safely retries failures', async () => {
  const { service, moonpay, order, db } = await fixture();
  const other = await service.create({ wallet, siteId: 219742, amount: 100 });
  const unavailable = await service.create({
    wallet,
    siteId: 219742,
    amount: 200,
  });
  const fetch = spyOn(moonpay, 'transactions').mockImplementation(
    async (id) => {
      if (id === unavailable.id) throw new Error('Temporary provider failure');
      return [
        {
          ...transaction({ id }),
          ...(id === other.id
            ? {
                baseCurrencyAmount: 95.72,
                feeAmount: 3.99,
                networkFeeAmount: 0.29,
                areFeesIncluded: true,
              }
            : {}),
        },
      ];
    },
  );
  cleanup.push(() => fetch.mockRestore());
  const worker = new PaymentsReconciler(db, service, moonpay);
  await Promise.all([worker.reconcile(), worker.reconcile()]);
  expect(fetch).toHaveBeenCalledTimes(3);
  expect((await service.list(wallet)).map((row) => row.id).sort()).toEqual(
    [order.id, other.id].sort(),
  );
  // A wrap through the cursor retries unfinished orders, without crediting paid ones again.
  await worker.reconcile();
  await worker.reconcile();
  expect((await service.list(wallet)).length).toBe(2);
});
