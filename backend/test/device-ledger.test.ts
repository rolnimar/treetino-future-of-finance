import 'reflect-metadata';
import { afterEach, expect, spyOn, test } from 'bun:test';
import { Keypair } from '@solana/web3.js';
import { eq } from 'drizzle-orm';
import { DatabaseService } from '../dist/database/database.service.js';
import { DeviceCatalogService } from '../dist/devices/device-catalog.service.js';
import { DeviceLedgerService } from '../dist/devices/device-ledger.service.js';
import { splitRevenue, units } from '../dist/devices/device-math.js';
import { VictronService } from '../dist/victron/victron.service.js';
import {
  devices,
  demoPayments,
  indexedTrees,
  indexedTransactions,
  indexerState,
  campaigns,
} from '../dist/database/schema.js';
import { testDatabase } from './database.fixture';

const disposers: (() => void | Promise<void>)[] = [];
afterEach(async () => {
  for (const dispose of disposers.splice(0).reverse()) await dispose();
});
const wallet = () => Keypair.generate().publicKey.toBase58();
async function fixture() {
  const database = await testDatabase();
  disposers.push(() => database.cleanup());
  const db = await DatabaseService.create(database.config);
  disposers.push(() => db.onApplicationShutdown());
  const catalog = new DeviceCatalogService(db, new VictronService());
  await catalog.seed();
  return {
    db,
    catalog,
    ledger: new DeviceLedgerService(db, catalog),
    database,
  };
}

test('catalog is persisted for every device and restart preserves operator data', async () => {
  const { db, catalog } = await fixture();
  expect((await catalog.list()).map((d) => d.kind).sort()).toEqual([
    'ess',
    'ev',
    'offgrid',
    'treetino-v1',
  ]);
  const device = await catalog.get(374891);
  await db.db
    .update(devices)
    .set({
      tariffUnitsPerKwh: '500000',
      catalog: { ...device.catalog, title: 'Persisted operator title' },
    })
    .where(eq(devices.siteId, 374891));
  await new DeviceCatalogService(db, new VictronService()).seed();
  expect(await catalog.get(374891)).toMatchObject({
    tariffUnitsPerKwh: '500000',
    catalog: { title: 'Persisted operator title' },
  });
});

test('custom devices get durable distinct catalog IDs without frontend templates', async () => {
  const { db, catalog } = await fixture();
  for (const category of ['EV charging', 'Battery storage'])
    await db.db.insert(campaigns).values({
      treeAddress: wallet(),
      treeId: '18446744073709551615',
      title: category,
      narrative: 'A custom registered device',
      category,
      categoryBadge: category,
      city: 'Prague',
      country: 'Czech Republic',
      projectedApy: '12.5%',
      tariffRate: 'USDC 0.42/kWh',
      offTakerName: 'Demo operator',
      targetUsdc: '1000',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  await catalog.seed();
  const rows = await catalog.list();
  expect(rows).toHaveLength(6);
  expect(new Set(rows.map((d) => d.siteId)).size).toBe(6);
  expect(rows.find((d) => d.catalog.title === 'EV charging')?.kind).toBe('ev');
  expect(rows.find((d) => d.catalog.title === 'Battery storage')?.kind).toBe(
    'ess',
  );
  await catalog.seed();
  expect(await catalog.list()).toHaveLength(6);
});

test('charging payments credit only the session-start contributors, exactly once, with durable claims and no time-based yield', async () => {
  const { db, catalog, ledger } = await fixture();
  const alice = wallet(),
    bob = wallet(),
    driver = wallet(),
    late = wallet();
  let now = Date.now();
  const clock = spyOn(Date, 'now').mockImplementation(() => now);
  disposers.push(() => clock.mockRestore());
  await ledger.invest(alice, 374891, {
    id: crypto.randomUUID(),
    amount: '100',
  });
  await ledger.invest(bob, 374891, { id: crypto.randomUUID(), amount: '300' });
  expect(
    (await ledger.portfolio(alice)).investments[374891].claimableUsdc,
  ).toBe(0);
  const session = await ledger.start(driver, 374891, {
    id: crypto.randomUUID(),
    kwh: '10',
  });
  await ledger.invest(late, 374891, { id: crypto.randomUUID(), amount: '100' });
  now += 6000;
  const bill = await ledger.stop(driver, session.id);
  expect(bill).toMatchObject({
    deliveredWh: 2200,
    status: 'awaiting_payment',
    amountUnits: '3424000',
    amountUsdc: 3.424,
  });
  expect(
    (await ledger.portfolio(alice)).investments[374891].claimableUsdc,
  ).toBe(0);
  await Promise.all(
    Array.from({ length: 5 }, () =>
      ledger.pay(driver, session.id, 'demo-memo'),
    ),
  );
  expect((await ledger.balance(driver)).balance).toBe('9996576000');
  const first = await ledger.portfolio(alice),
    second = await ledger.portfolio(bob);
  expect(first.investments[374891]).toMatchObject({
    claimableUsdc: 0.856,
    earnedUsdc: 0.856,
  });
  expect(second.investments[374891].claimableUsdc).toBe(2.568);
  expect((await ledger.portfolio(late)).investments[374891].claimableUsdc).toBe(
    0,
  );
  now += 10 * 365 * 86400000;
  expect(
    (await ledger.portfolio(alice)).investments[374891].claimableUsdc,
  ).toBe(0.856);
  const restored = new DeviceLedgerService(
    db,
    new DeviceCatalogService(db, new VictronService()),
  );
  const claimId = crypto.randomUUID();
  const payouts = await Promise.all(
    Array.from({ length: 4 }, () =>
      restored.claim(alice, 374891, {
        id: claimId,
        memoReference: 'claim-memo',
      }),
    ),
  );
  expect(payouts.map((c) => c.amountUsdc)).toEqual([
    0.856, 0.856, 0.856, 0.856,
  ]);
  expect((await restored.balance(alice)).balance).toBe('9900856000');
  expect((await restored.portfolio(alice)).investments[374891]).toMatchObject({
    claimableUsdc: 0,
    totalClaimedUsdc: 0.856,
    earnedUsdc: 0.856,
  });
  await expect(
    restored.claim(alice, 374891, { id: crypto.randomUUID() }),
  ).rejects.toThrow('No paid device revenue');
});

test('sessions resume from backend state, quote tariff snapshots, and reject another wallet or unpaid earnings', async () => {
  const { ledger, db } = await fixture();
  const customer = wallet(),
    other = wallet();
  let now = Date.now();
  const clock = spyOn(Date, 'now').mockImplementation(() => now);
  disposers.push(() => clock.mockRestore());
  const session = await ledger.start(customer, 374891, {
    id: crypto.randomUUID(),
    kwh: '1',
  });
  await db.db
    .update(devices)
    .set({ tariffUnitsPerKwh: '99000000' })
    .where(eq(devices.siteId, 374891));
  now += 4000;
  expect(await ledger.getSession(session.id)).toMatchObject({
    status: 'awaiting_payment',
    deliveredWh: 1000,
    amountUnits: '2920000',
  });
  expect((await ledger.latestSession(customer, 374891))?.id).toBe(session.id);
  await expect(ledger.stop(other, session.id)).rejects.toThrow(
    'another wallet',
  );
  await expect(ledger.pay(other, session.id, null)).rejects.toThrow(
    'another wallet',
  );
  await expect(ledger.cancelSession(other, session.id)).rejects.toThrow(
    'another wallet',
  );
  await ledger.cancelSession(customer, session.id);
  await expect(ledger.pay(customer, session.id, null)).rejects.toThrow(
    'Stop charging',
  );
  expect((await ledger.balance(customer)).balance).toBe('10000000000');
  expect((await ledger.portfolio(other)).receipts).toEqual([]);
});

test('a payment with no contributors is retained without granting it to later investors', async () => {
  const { ledger } = await fixture();
  const driver = wallet(),
    later = wallet();
  const session = await ledger.start(driver, 374891, {
    id: crypto.randomUUID(),
    kwh: '1',
  });
  await ledger.stop(driver, session.id);
  await ledger.pay(driver, session.id, null);
  await ledger.invest(later, 374891, { id: crypto.randomUUID(), amount: '10' });
  expect(
    (await ledger.portfolio(later)).investments[374891].claimableUsdc,
  ).toBe(0);
  expect(
    (await ledger.catalogResponse()).demos.find((d) => d.siteId === 374891)
      ?.revenue.receivedUsdc,
  ).toBeGreaterThanOrEqual(2.5);
});

test('investment and deposit retries are idempotent, capped and cannot reuse another wallet request', async () => {
  const { ledger } = await fixture();
  const alice = wallet(),
    other = wallet(),
    id = crypto.randomUUID();
  const holdings = await Promise.all(
    Array.from({ length: 6 }, () =>
      ledger.invest(alice, 219742, { id, amount: '100' }),
    ),
  );
  expect(new Set(holdings.map((h) => h.id)).size).toBe(1);
  expect((await ledger.balance(alice)).balance).toBe('9900000000');
  await expect(
    ledger.invest(other, 219742, { id, amount: '100' }),
  ).rejects.toThrow('Request ID already used');
  await expect(
    ledger.invest(alice, 219742, { id, amount: '200' }),
  ).rejects.toThrow('Request ID already used');
  await expect(
    ledger.invest(alice, 219742, { id: crypto.randomUUID(), amount: '999999' }),
  ).rejects.toThrow('remaining device funding');
  const depositId = crypto.randomUUID();
  await Promise.all([
    ledger.deposit(alice, { id: depositId, amount: '10' }),
    ledger.deposit(alice, { id: depositId, amount: '10' }),
  ]);
  expect((await ledger.balance(alice)).balance).toBe('9910000000');
  expect((await ledger.portfolio(alice)).investments[219742].amountUsdc).toBe(
    100,
  );
});

test('verified card investments are imported once and participate in device revenue', async () => {
  const { ledger, db } = await fixture();
  const backer = wallet(),
    customer = wallet();
  const [payment] = await db.db
    .insert(demoPayments)
    .values({
      wallet: backer,
      siteId: 374891,
      amountCents: 10000,
      status: 'completed',
      transactionId: 'verified-provider-receipt',
      createdAt: Date.now(),
      completedAt: Date.now(),
      usdcAllocation: {
        amountUsdc: 95.72,
        rate: 1,
        rateDate: '2026-10-19',
        source: 'USD',
      },
      paymentAmounts: {
        principalCents: 9572,
        moonpayFeeCents: 399,
        networkFeeCents: 29,
        extraFeeCents: 0,
        totalPaidCents: 10000,
        checkoutCents: 10000,
      },
    })
    .returning();
  await ledger.synchronize();
  await ledger.synchronize();
  expect((await ledger.portfolio(backer)).investments[374891]).toMatchObject({
    amountUsdc: 95.72,
    demoFiatAmountUsdc: 95.72,
  });
  const session = await ledger.start(customer, 374891, {
    id: crypto.randomUUID(),
    kwh: '1',
  });
  await ledger.stop(customer, session.id);
  await ledger.pay(customer, session.id, null);
  expect(
    (await ledger.portfolio(backer)).investments[374891].claimableUsdc,
  ).toBeGreaterThanOrEqual(2.5);
  expect(payment).toBeDefined();
});

test('integer allocation conserves revenue including indivisible dust and amount validation', () => {
  const result = splitRevenue(10n, [
    { wallet: 'a', units: '1' },
    { wallet: 'b', units: '1' },
    { wallet: 'c', units: '1' },
  ]);
  expect(result).toEqual([
    { wallet: 'a', units: '4' },
    { wallet: 'b', units: '3' },
    { wallet: 'c', units: '3' },
  ]);
  expect(splitRevenue(1n, [])).toEqual([]);
  for (const value of ['0', '-1', '1.0000001', 'NaN', '1e3', 1])
    expect(() => units(value)).toThrow();
});

test('previous indexed USDC holdings are imported into the backend without duplicate credit', async () => {
  const { ledger, db, catalog } = await fixture();
  const investor = wallet(),
    mint = wallet(),
    stream = 'legacy-demo-import';
  await db.db.insert(indexerState).values({ stream, startTime: 0 });
  const device = await catalog.get(219742);
  await db.db.insert(indexedTrees).values({
    stream,
    address: device.treeAddress,
    treeId: '202610190219742',
    creator: wallet(),
    supplier: wallet(),
    client: wallet(),
    reporter: wallet(),
    paymentMint: wallet(),
    shareMint: mint,
    fundingTokenAccount: wallet(),
    target: '108000000000',
    raised: '1000000',
    phase: 'funding',
    blockTime: 100,
    signature: 'tree-init',
  });
  await db.db.insert(indexedTransactions).values({
    stream,
    signature: 'previous-usdc-purchase',
    slot: 123,
    blockTime: 100,
    error: null,
    transaction: {
      meta: {
        err: null,
        preTokenBalances: [],
        postTokenBalances: [
          {
            accountIndex: 1,
            mint,
            owner: investor,
            uiTokenAmount: { amount: '1000000', decimals: 6 },
          },
        ],
      },
    },
  });
  await ledger.synchronize();
  await ledger.synchronize();
  const restored = new DeviceLedgerService(db, catalog);
  expect(
    (await restored.portfolio(investor)).investments[219742].amountUsdc,
  ).toBe(1);
  expect(
    (await restored.portfolio(investor)).investments[219742].claimableUsdc,
  ).toBe(0);
});
