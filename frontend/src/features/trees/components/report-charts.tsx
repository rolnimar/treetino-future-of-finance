import type { IndexedReport } from '../../../lib/schemas';
import { utcDay } from '../../../chain/amounts';
import { reportChartData } from '../report-chart-data';
import { IntervalChart } from './interval-chart';

export function ReportCharts({ report }: { report: IndexedReport }) {
  const data = reportChartData(report);
  const date = utcDay(report.dayStartTs);
  return (
    <div className="my-4 space-y-3">
      <IntervalChart
        title={`15-minute production · ${date}`}
        unit="Wh"
        points={data.production}
      />
      {data.prices.length > 0 && (
        <IntervalChart
          title={`15-minute spot price · ${date}`}
          unit="USDC/kWh"
          points={data.prices}
        />
      )}
    </div>
  );
}
