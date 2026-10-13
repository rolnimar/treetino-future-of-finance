import 'reflect-metadata';
import { afterEach, expect, test } from 'bun:test';
import { SchedulerRegistry } from '@nestjs/schedule';
import { testDatabase } from './database.fixture';
import { DatabaseService } from '../dist/database/database.service.js';
import { IndexerRepository } from '../dist/indexer/indexer.repository.js';
import { IndexerConfig } from '../dist/indexer/indexer.config.js';
import { BillingService } from '../dist/billing/billing.service.js';
import {
  SpotPriceService,
  parseOtePrices,
  pricingDates,
  parseCnbRates,
  priceInvoice,
} from '../dist/billing/spot-price.service.js';

const date = '2026-10-04';
const day = String(Date.parse(date + 'T00:00:00Z') / 1000);
function labels() {
  const time = (n: number) =>
    `${String(Math.floor(n / 4)).padStart(2, '0')}:${String((n % 4) * 15).padStart(2, '0')}`;
  return Array.from({ length: 96 }, (_, n) => `${time(n)}-${time(n + 1)}`);
}
function marketHtml(date: string, periods = labels(), price = '156,48') {
  return `<div data-default-select-date="${date}"><table>${periods.map((label) => `<tr><td>${label}</td><td>${price}</td></tr>`).join('')}</table></div>`;
}
const html = marketHtml(date);
const rates =
  '02 Oct 2026 #190\nCountry|Currency|Amount|Code|Rate\nEMU|euro|1|EUR|24.465\nUSA|dollar|1|USD|21.795\n';
const quote = {
  date,
  method: 'quarter-hour' as const,
  intervals: [{ startTs: day, eurPerMwh: '156.480000' }],
  eurCzk: '24.465000',
  usdCzk: '21.795000',
  exchangeRateDate: '2026-10-02',
  priceSource: 'https://www.ote-cr.cz/',
  exchangeRateSource: 'https://www.cnb.cz/',
};
const cleanup: (() => Promise<void>)[] = [];
afterEach(async () => {
  for (const dispose of cleanup.splice(0).reverse()) await dispose();
});
async function fixture() {
  const testDb = await testDatabase();
  cleanup.push(() => testDb.cleanup());
  const database = await DatabaseService.create(testDb.config);
  cleanup.push(() => database.onApplicationShutdown());
  const repo = new IndexerRepository(database);
  await repo.initialize('test:program', 1, 'https://rpc.test', 'program');
  return { testDb, database, repo };
}
const report = {
  address: 'report',
  tree: 'tree',
  dayStartTs: String(Date.parse(date + 'T00:00:00Z') / 1000),
  submittedAt: '1791158400',
  reporter: 'wallet',
  wh: [10000],
  totalWh: '10000',
  invoiceIssued: false,
  due: '0',
  paid: '0',
};

test('DST curves keep 92 and 100 distinct prices and a UTC report fetches both Czech delivery dates', () => {
  const spring = labels().filter((_, n) => n < 8 || n >= 12);
  spring[7] = '01:45-03:00';
  const springPrices = parseOtePrices(
    marketHtml('2026-03-29', spring),
    '2026-03-29',
  );
  expect(springPrices).toHaveLength(92);
  expect(springPrices[8]!.startTs).toBe(
    String(Date.parse('2026-03-29T01:00:00Z') / 1000),
  );
  const fall = labels();
  fall.splice(
    8,
    4,
    '02a:00-02a:15',
    '02a:15-02a:30',
    '02a:30-02a:45',
    '02a:45-02b:00',
    '02b:00-02b:15',
    '02b:15-02b:30',
    '02b:30-02b:45',
    '02b:45-03:00',
  );
  fall[7] = '01:45-02a:00';
  const fallPrices = parseOtePrices(
    marketHtml('2025-10-26', fall),
    '2025-10-26',
  );
  expect(fallPrices).toHaveLength(100);
  expect(Number(fallPrices[12]!.startTs) - Number(fallPrices[8]!.startTs)).toBe(
    3600,
  );
  expect(pricingDates(day, 96)).toEqual(['2026-10-04', '2026-10-05']);
  expect(
    pricingDates(String(Date.parse('2026-03-29T00:00:00Z') / 1000), 96),
  ).toEqual(['2026-03-29', '2026-03-30']);
});

test('equal total Wh with different production timing has different invoices; signed prices net and rounding happens once', () => {
  const timed = {
    ...quote,
    eurCzk: '25',
    usdCzk: '20',
    intervals: [
      { startTs: day, eurPerMwh: '100' },
      { startTs: String(BigInt(day) + 900n), eurPerMwh: '200' },
    ],
  };
  expect(priceInvoice(day, [1000, 3000], [timed])).toMatchObject({
    method: 'quarter-hour',
    totalCzk: '17.50',
    amount: '875000',
  });
  expect(priceInvoice(day, [3000, 1000], [timed])).toMatchObject({
    totalCzk: '12.50',
    amount: '625000',
  });
  expect(
    priceInvoice(
      day,
      [1000, 3000],
      [
        {
          ...timed,
          intervals: [{ startTs: day, eurPerMwh: '-100' }, timed.intervals[1]!],
        },
      ],
    ),
  ).toMatchObject({ totalCzk: '12.50', amount: '625000' });
  const tiny = {
    ...timed,
    intervals: timed.intervals.map((interval) => ({
      ...interval,
      eurPerMwh: '1',
    })),
  };
  expect(priceInvoice(day, [1, 1], [tiny]).amount).toBe('3');
  expect(() => priceInvoice(day, [1, 1, 1], [timed])).toThrow(
    'price unavailable',
  );
  // The next Czech delivery date begins at 22:00 UTC in summer.
  const curves = [
    {
      ...timed,
      intervals: parseOtePrices(marketHtml(date, labels(), '100'), date),
    },
    {
      ...timed,
      date: '2026-10-05',
      eurCzk: '99',
      usdCzk: '99',
      intervals: parseOtePrices(
        marketHtml('2026-10-05', labels(), '200'),
        '2026-10-05',
      ),
    },
  ];
  const billed = priceInvoice(day, Array(96).fill(1000), curves);
  expect(billed.intervals![87]!.eurPerMwh).toBe('100.000000');
  expect(billed.intervals![88]!.eurPerMwh).toBe('200.000000');
  expect(billed).toMatchObject({
    totalCzk: '260.00',
    amount: '13000000',
    eurCzk: '25',
    usdCzk: '20',
  });
});

test('legacy drafts are repriced from raw chain readings while already issued amounts and their audit pricing stay intact', async () => {
  const f = await fixture();
  await f.repo.saveTransaction(
    'test:program',
    'draft',
    1,
    1,
    null,
    {},
    [],
    [],
    [report],
  );
  const legacy = {
    date,
    eurPerMwh: '1',
    czkPerKwh: '1',
    amount: '1',
    totalCzk: '1',
    eurCzk: '1',
    usdCzk: '1',
    exchangeRateDate: date,
    priceSource: quote.priceSource,
    exchangeRateSource: quote.exchangeRateSource,
  };
  await f.testDb
    .sql`UPDATE indexed_reports SET pricing=${f.testDb.sql.json(legacy)}`;
  const billing = new BillingService(
    f.database,
    { quote: async () => quote } as never,
    new IndexerConfig(),
    new SchedulerRegistry(),
  );
  cleanup.push(() => billing.beforeApplicationShutdown());
  await billing.poll();
  expect(
    (await f.repo.listReports('test:program', 'tree', 20, 0)).reports[0]!
      .pricing,
  ).toMatchObject({ method: 'quarter-hour', amount: '1756496' });
  await f.repo.saveTransaction(
    'test:program',
    'issued',
    2,
    2,
    null,
    {},
    [],
    [],
    [{ ...report, invoiceIssued: true, due: '5' }],
  );
  await f.testDb
    .sql`UPDATE indexed_reports SET pricing=${f.testDb.sql.json(legacy)}`;
  await billing.poll();
  expect(
    (await f.repo.listReports('test:program', 'tree', 20, 0)).reports[0],
  ).toMatchObject({ due: '5', pricing: legacy });
});

test('OTE quarter-hour curves use UTC timestamps and reject wrong days, missing and reordered market intervals', () => {
  const prices = parseOtePrices(html, date);
  expect(prices).toHaveLength(96);
  expect(prices[0]).toEqual({
    startTs: String(Date.parse('2026-10-03T22:00:00Z') / 1000),
    eurPerMwh: '156.480000',
  });
  expect(
    parseOtePrices(html.replaceAll('156,48', '-23,5'), date)[0]!.eurPerMwh,
  ).toBe('-23.500000');
  expect(() => parseOtePrices(html, '2026-10-03')).toThrow('did not return');
  expect(() =>
    parseOtePrices(marketHtml(date, labels().slice(1)), date),
  ).toThrow('incomplete');
  const reversed = labels();
  [reversed[0], reversed[1]] = [reversed[1]!, reversed[0]!];
  expect(() => parseOtePrices(marketHtml(date, reversed), date)).toThrow(
    'out of order',
  );
  expect(parseCnbRates(rates, date)).toEqual({
    eurCzk: '24.465000',
    usdCzk: '21.795000',
    exchangeRateDate: '2026-10-02',
  });
  for (const requested of ['2026-10-01', '2026-10-20'])
    expect(() => parseCnbRates(rates, requested)).toThrow('unavailable');
  expect(() => parseCnbRates(rates.replace('|USD|', '|XXX|'), date)).toThrow(
    'USD',
  );
});

test('CZK billing and six-decimal EURTree use exact integer math including zero, negative prices and overflow', () => {
  expect(priceInvoice(day, [10000], [quote])).toMatchObject({
    totalCzk: '38.28',
    amount: '1756496',
  });
  expect(priceInvoice(day, [], [quote])).toMatchObject({
    totalCzk: '0.00',
    amount: '0',
  });
  expect(
    priceInvoice(
      day,
      [10000],
      [{ ...quote, intervals: [{ startTs: day, eurPerMwh: '-156.480000' }] }],
    ),
  ).toMatchObject({ totalCzk: '-38.28', amount: null });
  expect(
    priceInvoice(
      day,
      [4294967295],
      [{ ...quote, intervals: [{ startTs: day, eurPerMwh: '1000000000000' }] }],
    ).amount,
  ).toBeNull();
});

test('daily quotes persist across restart and invoices retry source failures without changing issued amounts or cached pricing', async () => {
  const f = await fixture();
  const prices = new SpotPriceService(f.database);
  let calls = 0;
  prices.fetchDailyQuote = async () => {
    calls++;
    return quote;
  };
  await f.testDb
    .sql`INSERT INTO daily_spot_prices (date,quote) VALUES (${date}, ${f.testDb.sql.json({ date, eurPerMwh: '156.48' })})`;
  expect(await prices.quote(date)).toEqual(quote);
  expect(await new SpotPriceService(f.database).quote(date)).toEqual(quote);
  expect(calls).toBe(1);
  await f.repo.saveTransaction(
    'test:program',
    'production',
    1,
    1,
    null,
    {},
    [],
    [],
    [report],
  );
  let offline = true;
  const billing = new BillingService(
    f.database,
    {
      quote: async () => {
        if (offline) throw new Error('source offline');
        return prices.quote(date);
      },
    } as never,
    new IndexerConfig(),
    new SchedulerRegistry(),
  );
  cleanup.push(() => billing.beforeApplicationShutdown());
  await billing.poll();
  expect(
    (await f.repo.listReports('test:program', 'tree', 20, 0)).reports[0],
  ).toMatchObject({ pricing: null, pricingError: 'source offline' });
  offline = false;
  const firstPoll = billing.poll();
  expect(billing.poll()).toBe(firstPoll);
  await firstPoll;
  const saved = (await f.repo.listReports('test:program', 'tree', 20, 0))
    .reports[0]!;
  expect(saved.pricing).toMatchObject({ amount: '1756496', totalCzk: '38.28' });
  expect(saved.pricingError).toBeNull();
  await f.repo.saveTransaction(
    'test:program',
    'issued',
    2,
    2,
    null,
    {},
    [],
    [],
    [{ ...report, invoiceIssued: true, due: '2000000', paid: '500000' }],
  );
  await billing.poll();
  expect(
    (await f.repo.listReports('test:program', 'tree', 20, 0)).reports[0],
  ).toMatchObject({
    id: saved.id,
    invoiceIssued: true,
    due: '2000000',
    paid: '500000',
    pricing: saved.pricing,
  });
  for (const table of [
    'indexed_reports',
    'mock_reporters',
    'mock_report_jobs',
    'daily_spot_prices',
  ]) {
    const columns = await f.testDb
      .sql`SELECT c.column_name,c.data_type FROM information_schema.table_constraints t JOIN information_schema.key_column_usage k USING (constraint_catalog,constraint_schema,constraint_name) JOIN information_schema.columns c ON c.table_schema=k.table_schema AND c.table_name=k.table_name AND c.column_name=k.column_name WHERE t.constraint_type='PRIMARY KEY' AND t.table_schema='public' AND t.table_name=${table}`;
    expect([...columns]).toEqual([{ column_name: 'id', data_type: 'uuid' }]);
  }
});
