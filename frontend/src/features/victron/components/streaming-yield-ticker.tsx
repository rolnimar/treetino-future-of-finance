import type { InvestmentRecord } from '../use-victron-investments';
import { useLiveYieldStream } from '../yield-stream';

export interface StreamingYieldTickerProps {
  assetName: string;
  siteId?: number;
  holding?: InvestmentRecord;
  financials?: {
    projectedApy: number;
    targetUsdc?: number;
    fundedUsdc?: number;
    estDailyRevenueUsdc?: number;
  };
  onBackProject?: () => void;
  onClaim?: (siteId: number, base: number, bonus: number) => Promise<void>;
  isClaiming?: boolean;
  claimSuccessText?: string | null;
  claimErrorText?: string | null;
  shareUsdc?: number;
  stakePercent?: string;
  hourlyRate?: string;
  baseYieldUsdc?: number;
  incrementPerSecond?: number;
}

export function StreamingYieldTicker({
  assetName,
  siteId,
  holding,
  financials,
  onBackProject,
  onClaim,
  isClaiming,
  claimSuccessText,
  claimErrorText,
}: StreamingYieldTickerProps) {
  const result = useLiveYieldStream(holding, financials);
  const hasYield = result.totalAccrued > 0;
  return (
    <div
      className={`rounded-2xl border p-4 text-xs text-white transition-all ${
        hasYield
          ? 'border-emerald-400 bg-gradient-to-r from-emerald-950 via-blue-950 to-emerald-950 shadow-[0_0_28px_rgba(16,185,129,0.25)]'
          : 'border-blue-900/60 bg-blue-950/90'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold">{assetName}</p>
            {hasYield && (
              <span className="rounded-full bg-emerald-400/20 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase text-emerald-300">
                ⚡ LIVE EV PAYOUT CREDITED
              </span>
            )}
          </div>
          <p className="mt-1 text-zinc-300">
            {holding
              ? `Your contribution: ${holding.amountUsdc} USDC · ${holding.poolSharePercent ?? '0'}% of contributions`
              : 'Back this device to receive future usage revenue.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-mono text-sm">
            Paid revenue available:{' '}
            <strong
              data-testid="ticker-paid-revenue"
              className="text-base font-black text-emerald-300"
            >
              {result.formattedTotal}
            </strong>
          </p>
          {siteId === 374891 && (
            <a
              href="#charge/374891"
              className="rounded-full border border-emerald-400/50 bg-emerald-500/20 px-4 py-2 font-semibold text-emerald-200 hover:bg-emerald-500/30"
            >
              ⚡ EV Outlet Kiosk
            </a>
          )}
          {onClaim && siteId !== undefined && holding && (
            <button
              disabled={isClaiming || result.totalAccrued <= 0}
              onClick={() => void onClaim(siteId, result.baseDividend, 0)}
              className="rounded-full bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-500 disabled:opacity-40"
            >
              {isClaiming ? 'Saving…' : 'Claim Yield'}
            </button>
          )}
          {onBackProject && (
            <button
              onClick={onBackProject}
              className="rounded-full bg-blue-700 px-4 py-2 font-semibold"
            >
              Invest with Card or USDC
            </button>
          )}
        </div>
      </div>
      {claimSuccessText && (
        <p className="mt-2 text-emerald-300">{claimSuccessText}</p>
      )}
      {claimErrorText && (
        <p className="mt-2 text-amber-300">{claimErrorText}</p>
      )}
    </div>
  );
}
