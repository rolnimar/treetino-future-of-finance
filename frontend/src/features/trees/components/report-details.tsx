import type { IndexedReport } from '../../../lib/schemas';
import { formatTokenAmount, utcDay } from '../../../chain/amounts';
import { ReportCharts } from './report-charts';

export function ReportDetails({ report }: { report: IndexedReport }) {
  const pricing = report.pricing;
  return (
    <div className="space-y-2 text-sm">
      <p className="font-semibold">
        {utcDay(report.dayStartTs)} · {report.totalWh} Wh
      </p>
      <ReportCharts report={report} />
      {report.invoiceIssued ? (
        <p>
          {formatTokenAmount(report.due)} EURTree billed ·{' '}
          {formatTokenAmount(report.paid)} paid ·{' '}
          {formatTokenAmount(
            (BigInt(report.due) - BigInt(report.paid)).toString(),
          )}{' '}
          remaining
        </p>
      ) : (
        <p className="text-zinc-500">Invoice draft · Awaiting admin issuance</p>
      )}
      {pricing ? (
        <>
          <p>
            {pricing.method === 'quarter-hour'
              ? '15-minute spot billing:'
              : `Historical daily-average billing: ${pricing.czkPerKwh} CZK/kWh ·`}{' '}
            {pricing.totalCzk} CZK total
          </p>
          <p>
            {pricing.amount === null
              ? 'This spot-price amount cannot be issued as an unsigned on-chain invoice.'
              : `${formatTokenAmount(pricing.amount)} EURTree at ${pricing.eurCzk} CZK/EUR`}
          </p>
          <p className="text-xs text-zinc-500">
            UTC report day {pricing.date} · CNB fixing{' '}
            {pricing.exchangeRateDate} · Energy price only
          </p>
          {pricing.intervals && (
            <details className="text-xs">
              <summary className="cursor-pointer">
                15-minute invoice breakdown ({pricing.intervals.length}{' '}
                intervals)
              </summary>
              <div className="mt-2 max-h-64 overflow-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr>
                      <th>UTC start</th>
                      <th>Wh</th>
                      <th>CZK/kWh</th>
                      <th>CZK</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pricing.intervals.map((interval) => (
                      <tr key={interval.startTs}>
                        <td>
                          {new Date(Number(interval.startTs) * 1000)
                            .toISOString()
                            .slice(0, 16)
                            .replace('T', ' ')}
                        </td>
                        <td>{interval.wh}</td>
                        <td>{interval.czkPerKwh}</td>
                        <td>{interval.totalCzk}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}
          <div className="flex flex-wrap gap-3 text-xs underline text-t-blue">
            {(
              pricing.priceSources ?? [
                { date: pricing.date, url: pricing.priceSource },
              ]
            ).map((source) => (
              <a
                key={source.date}
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="hover:text-t-accent"
              >
                OTE {source.date} ↗
              </a>
            ))}
            <a
              href={pricing.exchangeRateSource}
              target="_blank"
              rel="noreferrer"
              className="hover:text-t-accent"
            >
              CNB rates ↗
            </a>
          </div>
        </>
      ) : (
        <p className="text-xs text-zinc-500">
          {report.pricingError
            ? `Pricing pending: ${report.pricingError}. The backend will retry.`
            : 'Fetching 15-minute OTE prices and CNB exchange rates…'}
        </p>
      )}
      <details className="text-xs text-zinc-500">
        <summary className="cursor-pointer">
          {report.wh.length} production readings
        </summary>
        <p className="mt-2 break-words">{report.wh.join(', ')} Wh</p>
      </details>
    </div>
  );
}
