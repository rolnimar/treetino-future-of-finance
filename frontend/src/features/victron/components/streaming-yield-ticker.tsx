import { useState, useEffect } from 'react';
import type { InvestmentRecord } from '../use-victron-investments';
import { useLiveYieldStream } from '../yield-stream';
import { KAMINO_TOTAL_APY } from '../../../chain/kamino';

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
  onClaim?: (
    siteId: number,
    baseAmount: number,
    kaminoBonus: number,
  ) => Promise<void>;
  isClaiming?: boolean;
  claimSuccessText?: string | null;
  claimErrorText?: string | null;

  // Backwards-compatible legacy props:
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
  isClaiming = false,
  claimSuccessText,
  claimErrorText,
  shareUsdc = 100,
  stakePercent,
  hourlyRate,
  baseYieldUsdc,
  incrementPerSecond = 0.0012,
}: StreamingYieldTickerProps) {
  // 1. If real holding is provided, use the synchronized yield stream engine
  const liveResult = useLiveYieldStream(
    holding,
    financials ?? {
      projectedApy: 18.5,
      targetUsdc: 100000,
    },
  );

  // 2. Legacy fallback timer (only used when holding is undefined and baseYieldUsdc was explicitly provided)
  const [legacyCents, setLegacyCents] = useState(0);
  useEffect(() => {
    if (holding !== undefined || baseYieldUsdc === undefined) return;
    const timer = setInterval(() => {
      setLegacyCents((prev) => prev + incrementPerSecond);
    }, 1000);
    return () => clearInterval(timer);
  }, [holding, baseYieldUsdc, incrementPerSecond]);

  // Determine active mode:
  const hasActiveHolding = (holding?.amountUsdc ?? 0) > 0;
  const isLegacyMock = holding === undefined && baseYieldUsdc !== undefined;

  // Active user position: 100% synchronized with portfolio
  if (hasActiveHolding) {
    return (
      <div className="flex flex-col gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 text-white p-3.5 px-5 font-mono text-xs shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-white">
              Active Position ({liveResult.amountUsdc} USDC):
            </span>
            <span className="text-zinc-400">
              {assetName} · Stake {liveResult.poolSharePercent}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-400 text-[11px]">Unclaimed: </span>
                <span className="inline-flex items-center gap-1 rounded bg-emerald-950/80 px-1.5 py-0.5 text-[9px] text-emerald-400 border border-emerald-800/60 font-mono">
                  <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
                  Kamino Pool (+{(KAMINO_TOTAL_APY * 100).toFixed(2)}%)
                </span>
              </div>
              <span className="font-semibold text-emerald-400 text-sm block mt-0.5">
                {liveResult.formattedTotal}
              </span>
            </div>

            <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] text-zinc-300">
              {liveResult.hourlyRate}
            </span>

            {onClaim && siteId !== undefined && (
              <button
                type="button"
                disabled={isClaiming || liveResult.totalAccrued <= 0}
                onClick={() =>
                  onClaim(
                    siteId,
                    liveResult.baseDividend,
                    liveResult.kaminoBonus,
                  )
                }
                className="rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-3.5 py-1 text-xs font-semibold text-white shadow-xs transition active:scale-[0.98] disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {isClaiming && (
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                )}
                <span>{isClaiming ? 'Signing…' : 'Claim Yield'}</span>
              </button>
            )}
          </div>
        </div>

        {claimSuccessText && (
          <p className="text-xs text-emerald-400 font-sans border-t border-zinc-800 pt-1.5">
            {claimSuccessText}
          </p>
        )}
        {claimErrorText && (
          <p className="text-xs text-amber-400 font-sans border-t border-zinc-800 pt-1.5">
            {claimErrorText}
          </p>
        )}
      </div>
    );
  }

  // Legacy mock fallback if explicitly passed with baseYieldUsdc and no holding passed
  if (isLegacyMock) {
    const totalLegacy = ((baseYieldUsdc ?? 0.035) + legacyCents).toFixed(4);
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 text-white p-3.5 px-5 font-mono text-xs shadow-md">
        <div className="flex items-center gap-2.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-white">
            Active Position ({shareUsdc} USDC):
          </span>
          <span className="text-zinc-400">
            {assetName} · Stake {stakePercent ?? '0.10%'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400 text-[11px]">Unclaimed: </span>
              <span className="inline-flex items-center gap-1 rounded bg-emerald-950/80 px-1.5 py-0.5 text-[9px] text-emerald-400 border border-emerald-800/60 font-mono">
                <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
                Kamino Pool (+8.85%)
              </span>
            </div>
            <span className="font-semibold text-emerald-400 text-sm block mt-0.5">
              +{totalLegacy} USDC
            </span>
          </div>
          <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] text-zinc-300">
            {hourlyRate ?? '+USDC 0.042 / hr'}
          </span>
        </div>
      </div>
    );
  }

  // Opportunity for Backing Banner (when user is not yet invested in this site)
  const apy = financials?.projectedApy ?? 18.5;
  const poolHourly = (
    ((financials?.targetUsdc ?? 100000) * (apy / 100)) /
    (365 * 24)
  ).toFixed(2);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-900/60 bg-blue-950/40 text-white p-3.5 px-5 font-mono text-xs shadow-md backdrop-blur-xs">
      <div className="flex items-center gap-2.5">
        <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
        <span className="font-semibold text-white">Open Opportunity:</span>
        <span className="text-zinc-300">
          {assetName} · Target Projected Yield {apy}% APY
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-zinc-400 text-[11px]">
          Pool Cashflow:{' '}
          <strong className="text-white">+USDC {poolHourly}/hr</strong>
        </span>
        {onBackProject && (
          <button
            type="button"
            onClick={onBackProject}
            className="rounded-full bg-gradient-to-r from-[#183d89] to-[#2563eb] hover:from-[#1d4bb5] hover:to-[#3b82f6] px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition active:scale-[0.98] cursor-pointer"
          >
            Back with USDC
          </button>
        )}
      </div>
    </div>
  );
}
