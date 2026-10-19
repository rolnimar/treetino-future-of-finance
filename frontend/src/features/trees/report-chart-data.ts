import type { IndexedReport } from '../../lib/schemas';

export interface IntervalPoint {
  startTs: string;
  value: number;
}
export function reportChartData(report: IndexedReport) {
  return {
    production: report.wh.map((value, index) => ({
      startTs: (BigInt(report.dayStartTs) + BigInt(index) * 900n).toString(),
      value,
    })),
    prices:
      report.pricing?.method === 'quarter-hour'
        ? (report.pricing.intervals?.map(({ startTs, czkPerKwh }) => ({
            startTs,
            value: Number(czkPerKwh) / Number(report.pricing!.usdCzk),
          })) ?? [])
        : [],
  };
}
