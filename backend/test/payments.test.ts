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
import { testDatabase } from './database.fixture';

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
  const service = new PaymentsService(db, moonpay);
  const order = await service.create({ wallet, siteId: 219742, amount: 500 });
  return { service, moonpay, order, db };
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

test('only completed provider payments allocate, with concurrent and repeated verification idempotent', async () => {
  const { service, moonpay, order, db } = await fixture();
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
  const reopened = new PaymentsService(db, client());
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
