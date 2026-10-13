import type { VictronWaterfallStep } from '../victron-types';

export interface CommercialDossierDetail {
  label: string;
  value: string;
  subtext?: string;
}

export interface CashFlowDossierProps {
  offTakerTitle: string;
  offTakerBadge?: string;
  offTakerDescription: string;
  keyDetails?: CommercialDossierDetail[];
  grossRevenueTitle: string;
  waterfallSteps: VictronWaterfallStep[];
}

export function CashFlowDossier({
  offTakerTitle,
  offTakerBadge = 'Commercial Off-Taker',
  offTakerDescription,
  keyDetails = [],
  grossRevenueTitle,
  waterfallSteps,
}: CashFlowDossierProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Left: Off-Taker / Commercial Counterparty Profile */}
      <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-200/80 pb-3.5">
          <div>
            <span className="text-xs font-semibold tracking-[0.2em] text-[#183d89] uppercase">
              Commercial Counterparty & Demand
            </span>
            <h4 className="text-lg font-semibold text-zinc-950 mt-1">
              {offTakerTitle}
            </h4>
          </div>
          <span className="rounded-full bg-blue-50 border border-blue-100 px-3 py-1 font-mono text-xs font-semibold text-[#183d89]">
            {offTakerBadge}
          </span>
        </div>

        <p className="text-xs text-zinc-600 leading-relaxed font-normal">
          {offTakerDescription}
        </p>

        {keyDetails.length > 0 && (
          <div className="grid grid-cols-2 gap-3 text-xs font-mono pt-1">
            {keyDetails.map((item, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-zinc-200/70 bg-zinc-50/70 p-3"
              >
                <span className="text-zinc-400 text-[10px] uppercase font-semibold">
                  {item.label}
                </span>
                <div className="font-semibold text-zinc-950 text-sm mt-0.5">
                  {item.value}
                </div>
                {item.subtext && (
                  <span className="text-zinc-500 text-[10px] block mt-0.5">
                    {item.subtext}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right: Transparent Investor Cash Flow Waterfall */}
      <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-4">
        <div className="border-b border-zinc-200/80 pb-3.5">
          <span className="text-xs font-semibold tracking-[0.2em] text-[#183d89] uppercase">
            Tokenized Cash Flow Waterfall
          </span>
          <h4 className="text-lg font-semibold text-zinc-950 mt-1">
            {grossRevenueTitle}
          </h4>
        </div>

        <div className="space-y-2.5">
          {waterfallSteps.map((step, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between rounded-2xl border border-zinc-200/70 bg-zinc-50/70 p-3.5 text-xs font-mono"
            >
              <div>
                <span className="font-semibold text-zinc-950">
                  {step.title}
                </span>
                <div className="text-[11px] text-zinc-500 mt-0.5">
                  {step.description}
                </div>
              </div>
              <div className="text-right shrink-0 pl-3">
                <span className="font-semibold text-[#183d89] text-sm">
                  {step.amount}
                </span>
                <div className="text-[10px] text-zinc-400 font-semibold">
                  {step.percentage}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
