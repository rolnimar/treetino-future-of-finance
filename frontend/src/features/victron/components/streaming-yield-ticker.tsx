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
  return (
    <div className="rounded-2xl border border-blue-900/60 bg-blue-950/90 p-4 text-xs text-white">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-semibold">{assetName}</p>
          <p className="mt-1 text-zinc-300">
            {holding
              ? `Your contribution: ${holding.amountUsdc} USDC · ${holding.poolSharePercent ?? '0'}% of contributions`
              : 'Back this device to receive future usage revenue.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <p>
            Paid revenue available:{' '}
            <strong className="text-emerald-300">
              {result.formattedTotal}
            </strong>
          </p>
          {onClaim && siteId !== undefined && holding && (
            <button
              disabled={isClaiming || result.totalAccrued <= 0}
              onClick={() => void onClaim(siteId, result.baseDividend, 0)}
              className="rounded-full bg-emerald-700 px-4 py-2 font-semibold disabled:opacity-40"
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
