import type { InvestmentRecord } from './use-victron-investments';
export interface AccruedYieldResult {
  hasActiveHolding: boolean;
  amountUsdc: number;
  poolSharePercent: string;
  hourlyRate: string;
  hourlyRateNumber: number;
  baseDividend: number;
  kaminoBonus: number;
  totalAccrued: number;
  formattedTotal: string;
  formattedBase: string;
  formattedKamino: string;
  elapsedSeconds: number;
  totalClaimedUsdc: number;
}
// Presentation only: earned and claimable amounts always come from the backend ledger.
export function calculateAssetAccruedYield(
  holding: InvestmentRecord | undefined,
  _financials?: unknown,
  _now?: number,
): AccruedYieldResult {
  const amount = holding?.claimableUsdc ?? 0,
    rate = holding?.hourlyRateUsdc ?? 0;
  return {
    hasActiveHolding: (holding?.amountUsdc ?? 0) > 0 || amount > 0,
    amountUsdc: holding?.amountUsdc ?? 0,
    poolSharePercent: `${holding?.poolSharePercent ?? '0.00'}%`,
    hourlyRate: `USDC ${rate.toFixed(4)} / hr realized`,
    hourlyRateNumber: rate,
    baseDividend: amount,
    kaminoBonus: 0,
    totalAccrued: amount,
    formattedTotal: `+USDC ${amount.toFixed(6)}`,
    formattedBase: `USDC ${amount.toFixed(6)}`,
    formattedKamino: 'USDC 0.000000',
    elapsedSeconds: 0,
    totalClaimedUsdc: holding?.totalClaimedUsdc ?? 0,
  };
}
export function useLiveYieldStream(
  holding: InvestmentRecord | undefined,
  financials?: unknown,
) {
  return calculateAssetAccruedYield(holding, financials);
}
