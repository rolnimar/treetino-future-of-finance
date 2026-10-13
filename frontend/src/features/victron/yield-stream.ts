import { useState, useEffect } from 'react';
import type { InvestmentRecord } from './use-victron-investments';
import {
  calculateKaminoAccruedYield,
  KAMINO_TOTAL_APY,
} from '../../chain/kamino';

export const INITIAL_TELEMETRY_HOURS = 37.5;
export const SECONDS_PER_YEAR = 365 * 24 * 3600;

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

/**
 * Calculates continuous streaming yield and Kamino pool bonus for an asset holding.
 * Uses exact timestamp offsets so that the Portfolio page and Product Detail page
 * always evaluate to the exact same value at any given second.
 */
export function calculateAssetAccruedYield(
  holding: InvestmentRecord | undefined,
  financials: {
    projectedApy: number;
    targetUsdc?: number;
    fundedUsdc?: number;
    estDailyRevenueUsdc?: number;
  },
  now: number = Date.now(),
): AccruedYieldResult {
  if (!holding || holding.amountUsdc <= 0) {
    const target = financials.targetUsdc || 10000;
    const apyFraction = financials.projectedApy / 100;
    const poolHourly = (target * apyFraction) / (365 * 24);
    return {
      hasActiveHolding: false,
      amountUsdc: 0,
      poolSharePercent: '0.00%',
      hourlyRate: `+€${poolHourly.toFixed(3)} / hr`,
      hourlyRateNumber: poolHourly,
      baseDividend: 0,
      kaminoBonus: 0,
      totalAccrued: 0,
      formattedTotal: '+€0.0000',
      formattedBase: '€0.0000',
      formattedKamino: '€0.0000',
      elapsedSeconds: 0,
      totalClaimedUsdc: 0,
    };
  }

  const target = financials.targetUsdc || 10000;
  const poolShareFraction = holding.amountUsdc / target;
  const poolSharePercent = (poolShareFraction * 100).toFixed(2);
  const apyFraction = financials.projectedApy / 100;
  const annualDividend = holding.amountUsdc * apyFraction;
  const hourlyRateNumber = annualDividend / (365 * 24);
  const hourlyRate = `+€${hourlyRateNumber.toFixed(hourlyRateNumber >= 0.01 ? 3 : 4)} / hr`;

  // Determine effective lastClaimedAt:
  // If the user has never claimed yield on this holding (totalClaimedUsdc is 0 or undefined),
  // we ensure they have pre-existing operational telemetry (~36 hours) accrued from the Cerbo GX SCADA gateway.
  let effectiveLastClaimedAt = holding.lastClaimedAt;
  const hasClaimedBefore = (holding.totalClaimedUsdc ?? 0) > 0;

  if (!hasClaimedBefore) {
    const elapsedSinceClaim = now - holding.lastClaimedAt;
    if (elapsedSinceClaim < INITIAL_TELEMETRY_HOURS * 3600 * 1000) {
      effectiveLastClaimedAt =
        holding.lastClaimedAt - INITIAL_TELEMETRY_HOURS * 3600 * 1000;
    }
  }

  const elapsedSeconds = Math.max(
    0,
    Math.floor((now - effectiveLastClaimedAt) / 1000),
  );

  const ratePerSecond = annualDividend / SECONDS_PER_YEAR;
  const baseDividend = ratePerSecond * elapsedSeconds;

  const { kaminoBonus } = calculateKaminoAccruedYield(
    baseDividend,
    elapsedSeconds,
    KAMINO_TOTAL_APY,
  );

  const totalAccrued = baseDividend + kaminoBonus;

  return {
    hasActiveHolding: true,
    amountUsdc: holding.amountUsdc,
    poolSharePercent: `${poolSharePercent}%`,
    hourlyRate,
    hourlyRateNumber,
    baseDividend,
    kaminoBonus,
    totalAccrued,
    formattedTotal: `+€${totalAccrued.toFixed(4)}`,
    formattedBase: `€${baseDividend.toFixed(4)}`,
    formattedKamino: `€${kaminoBonus.toFixed(4)}`,
    elapsedSeconds,
    totalClaimedUsdc: holding.totalClaimedUsdc || 0,
  };
}

/**
 * React hook that streams live yield, re-rendering at 1Hz (every second).
 */
export function useLiveYieldStream(
  holding: InvestmentRecord | undefined,
  financials: {
    projectedApy: number;
    targetUsdc?: number;
    fundedUsdc?: number;
    estDailyRevenueUsdc?: number;
  },
): AccruedYieldResult {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return calculateAssetAccruedYield(holding, financials, now);
}
