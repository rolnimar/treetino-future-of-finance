import { expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { reportChartData } from '../src/features/trees/report-chart-data';
import { ReportCharts } from '../src/features/trees/components/report-charts';
import {
  reportDaySchema,
  activationFormSchema,
} from '../src/features/admin/schemas';
import { lastCompletedUtcDay } from '../src/chain/amounts';
import type { IndexedReport } from '../src/lib/schemas';
import { tree, reporter } from './fixtures/chain';
import { reportAddress } from '../src/chain/addresses';

function report(): IndexedReport {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    tree: tree.toBase58(),
    address: reportAddress(tree, '1790726400').toBase58(),
    dayStartTs: '1790726400',
    submittedAt: '1791072000',
    reporter: reporter.toBase58(),
    wh: [0, 4294967295, ...Array(95).fill(7)],
    totalWh: '4294967960',
    invoiceIssued: false,
    due: '0',
    paid: '0',
    pricingError: null,
    signature: 'test',
    updatedAt: '2026-10-04T00:00:00Z',
    pricing: {
      date: '2026-09-30',
      method: 'quarter-hour',
      intervals: [
        {
          startTs: '1790726400',
          wh: 0,
          eurPerMwh: '-50',
          czkPerKwh: '-1.25',
          totalCzk: '0',
        },
        {
          startTs: '1790727300',
          wh: 1,
          eurPerMwh: '0',
          czkPerKwh: '0',
          totalCzk: '0',
        },
        {
          startTs: '1790728200',
          wh: 1,
          eurPerMwh: '100',
          czkPerKwh: '2.5',
          totalCzk: '0.0025',
        },
      ],
      eurCzk: '25',
      usdCzk: '22',
      exchangeRateDate: '2026-09-30',
      totalCzk: '0.0025',
      amount: '114',
      priceSource: 'https://www.ote-cr.cz/',
      exchangeRateSource: 'https://www.cnb.cz/',
    },
  };
}
test('report charts retain exact on-chain intervals, zero production and negative spot prices, without truncating extra readings', () => {
  const input = report();
  const data = reportChartData(input);
  expect(data.production).toHaveLength(97);
  expect(data.production[0]).toEqual({ startTs: input.dayStartTs, value: 0 });
  expect(data.production[1]).toEqual({
    startTs: '1790727300',
    value: 4294967295,
  });
  expect(data.production[96]!.startTs).toBe('1790812800');
  expect(data.prices[0]!.value).toBeCloseTo(-0.0568181818);
  expect(data.prices[1]!.value).toBe(0);
  expect(data.prices[2]!.value).toBeCloseTo(0.1136363636);
  const html = renderToStaticMarkup(
    createElement(ReportCharts, { report: input }),
  );
  expect(html).toContain('15-minute production · 2026-09-30');
  expect(html).toContain('15-minute spot price · 2026-09-30');
  expect(html).toContain('97 intervals');
  expect(html).toContain('USDC/kWh');
  expect(html).toContain('-0.057');
});
test('empty production and unavailable market data never produce invented graph series', () => {
  const input = { ...report(), wh: [], totalWh: '0', pricing: null };
  const html = renderToStaticMarkup(
    createElement(ReportCharts, { report: input }),
  );
  expect(html).toContain('no interval readings were submitted');
  expect(html).not.toContain('polyline');
  expect(html).not.toContain('spot price');
});
test('past UTC billing days and completed report days are accepted; invalid, current and future report days are rejected', () => {
  expect(activationFormSchema.parse({ firstDay: '2020-01-01' }).firstDay).toBe(
    '2020-01-01',
  );
  expect(reportDaySchema.parse(lastCompletedUtcDay())).toBe(
    lastCompletedUtcDay(),
  );
  expect(reportDaySchema.parse('2020-01-01')).toBe('2020-01-01');
  for (const invalid of [
    '2026-02-30',
    '1969-12-31',
    '2026-10-4',
    new Date().toISOString().slice(0, 10),
    '9999-12-31',
  ])
    expect(reportDaySchema.safeParse(invalid).success).toBe(false);
});
