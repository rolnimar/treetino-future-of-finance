import type {
  RevenuePillar,
  DiurnalWindow,
} from '../../types/investor-dossier';

interface DualRevenueEngineProps {
  pillars: RevenuePillar[];
  diurnalSchedule: DiurnalWindow[];
  title?: string;
  subtitle?: string;
}

export function DualRevenueEngine({
  pillars,
  diurnalSchedule,
  title = 'Dual Revenue Engines & Operational Arbitrage',
  subtitle = 'Combining contracted recurring baseload revenues with real-time programmatic arbitrage and grid flexibility services.',
}: DualRevenueEngineProps) {
  return (
    <div className="rounded-3xl border border-black/10 bg-white p-6 sm:p-8 shadow-xs space-y-8">
      {/* 1. HEADER */}
      <div className="border-b border-black/10 pb-6">
        <span className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Revenue Model & Monetization
        </span>
        <h3 className="mt-1.5 text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
          {title}
        </h3>
        <p className="mt-1 max-w-3xl text-xs sm:text-sm text-zinc-600 font-light leading-relaxed">
          {subtitle}
        </p>
      </div>

      {/* 2. THE TWO REVENUE PILLARS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {pillars.map((pillar, idx) => (
          <div
            key={idx}
            className="flex flex-col justify-between rounded-2xl border border-black/10 bg-zinc-50/50 p-6 shadow-2xs"
          >
            <div>
              <div className="flex items-baseline justify-between gap-2 border-b border-black/5 pb-3 font-mono">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#183d89]">
                  {pillar.sharePercent}
                </span>
                <span className="text-xs font-semibold text-emerald-600">
                  {pillar.annualRevenueRangeCzk}
                </span>
              </div>

              <h4 className="mt-3 font-semibold text-base text-zinc-950 leading-snug">
                {pillar.title}
              </h4>
              <p className="mt-2 text-xs text-zinc-600 leading-relaxed font-light">
                {pillar.summary}
              </p>

              <div className="mt-4 space-y-2 border-t border-black/5 pt-3">
                {pillar.bulletPoints.map((bp, bIdx) => (
                  <div
                    key={bIdx}
                    className="flex items-start gap-2 text-xs text-zinc-600 font-light leading-relaxed"
                  >
                    <span className="text-zinc-400 font-mono text-[10px] mt-0.5">
                      •
                    </span>
                    <span>{bp}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. 24-HOUR DIURNAL CO-OPTIMIZED STACKING SCHEDULE */}
      <div className="space-y-4 pt-2">
        <div>
          <h4 className="font-semibold text-base text-zinc-950">
            24-Hour Operational Dispatch Schedule
          </h4>
          <span className="text-xs text-zinc-500 font-light">
            Wholesale power market price spreads vs. automated charge,
            discharge, and grid balancing windows
          </span>
        </div>

        {/* 24h Visual Timeline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
          {diurnalSchedule.map((window, idx) => {
            const isCharge = window.category === 'charge';
            const isDischarge = window.category === 'discharge';
            return (
              <div
                key={idx}
                className="rounded-2xl border border-black/10 bg-white p-4 shadow-2xs space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-900">
                    {window.time}
                  </span>
                  <span
                    className={`text-[10px] font-medium uppercase tracking-wider ${
                      isCharge
                        ? 'text-[#183d89]'
                        : isDischarge
                          ? 'text-emerald-600'
                          : 'text-zinc-500'
                    }`}
                  >
                    {isCharge
                      ? 'Charge Window'
                      : isDischarge
                        ? 'Peak Discharge'
                        : 'Balancing'}
                  </span>
                </div>

                <div className="font-sans font-semibold text-sm text-zinc-950 leading-snug">
                  {window.title}
                </div>

                <div className="text-xs text-zinc-700">
                  Tariff:{' '}
                  <strong className="text-zinc-950">
                    {window.priceUsdcMwh}
                  </strong>
                </div>

                <p className="font-sans text-[11px] text-zinc-500 font-light leading-snug pt-1 border-t border-black/5">
                  {window.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Operational Mechanics Note */}
        <p className="text-xs font-mono text-zinc-500 border-t border-black/5 pt-3 leading-relaxed">
          Operational Spread & Off-Take Execution: Realized net spread after DC
          efficiency reaches USDC 95 – USDC 98 / MWh across 1.2 daily cycles,
          generating institutional cash flows distributed continuously on
          Solana.
        </p>
      </div>
    </div>
  );
}
