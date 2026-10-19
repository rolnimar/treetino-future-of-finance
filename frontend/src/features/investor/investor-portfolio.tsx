import { useState, useEffect } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useEnrichedCampaigns } from '../victron/use-enriched-campaigns';
import { useVictronInvestments } from '../victron/use-victron-investments';
import { useConnectedWallet } from '../wallet/use-connected-wallet';
import { useUsdc } from '../marketplace/hooks/use-mock-usdc';
import { formatTokenAmount } from '../../chain/amounts';
import { requestWalletApproval } from '../../chain/wallet-action';
import {
  getCampaignCoverImage,
  CAMPAIGN_METADATA,
} from '../victron/campaign-helpers';
import type { VictronDemoItem } from '../victron/victron-types';
import {
  SunIcon,
  BatteryIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  ExternalLinkIcon,
  BoltIcon,
  PowerPlugIcon,
  WindIcon,
} from '../victron/victron-icons';
import { CompoundingYieldCalculator } from '../victron/components/CompoundingYieldCalculator';
import { KAMINO_TOTAL_APY } from '../../chain/kamino';
import { calculateAssetAccruedYield } from '../victron/yield-stream';
import { KaminoPoolModal } from './KaminoPoolModal';

interface InvestorPortfolioProps {
  onSelectAsset?: (siteId: number) => void;
  onExplore?: () => void;
  onOpenDeposit?: () => void;
  onBackProject?: (demo: VictronDemoItem) => void;
}

export function InvestorPortfolio({
  onSelectAsset,
  onExplore,
  onOpenDeposit,
  onBackProject,
}: InvestorPortfolioProps) {
  const { connection } = useConnection();
  const { setVisible: openWalletModal } = useWalletModal();
  const wallet = useConnectedWallet();
  const balance = useUsdc(wallet?.address);
  const { investments, claimYield } = useVictronInvestments(wallet?.address);
  const [now, setNow] = useState(() => Date.now());
  const [isKaminoModalOpen, setIsKaminoModalOpen] = useState(false);
  const [claimingSiteId, setClaimingSiteId] = useState<number | null>(null);
  const [isClaimingAll, setIsClaimingAll] = useState(false);
  const [justClaimedMap, setJustClaimedMap] = useState<Record<number, string>>(
    {},
  );
  const [claimSigMap, setClaimSigMap] = useState<Record<number, string>>({});
  const [claimErrorMap, setClaimErrorMap] = useState<Record<number, string>>(
    {},
  );
  const [horizonYears, setHorizonYears] = useState<1 | 5 | 15>(15);

  const { demos } = useEnrichedCampaigns();

  // 1-second synchronized clock for continuous DePIN yield streaming
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const backedDemos = demos.filter(
    (d) => (investments[d.siteId]?.amountUsdc ?? 0) > 0,
  );

  // Aggregations
  let totalInvestedUsdc = 0;
  let totalAnnualYieldUsdc = 0;
  let totalEnergyDeliveredKwh = 0;
  let totalBaseDividendsUsdc = 0;
  let totalKaminoBonusUsdc = 0;
  let totalAccruedUsdc = 0;

  for (const demo of backedDemos) {
    const holding = investments[demo.siteId]!;
    const target = demo.financials.targetUsdc || 10000;
    const yieldResult = calculateAssetAccruedYield(
      holding,
      demo.financials,
      now,
    );

    totalInvestedUsdc += holding.amountUsdc;
    totalAnnualYieldUsdc +=
      holding.amountUsdc * (demo.financials.projectedApy / 100);
    totalBaseDividendsUsdc += yieldResult.baseDividend;
    totalKaminoBonusUsdc += yieldResult.kaminoBonus;
    totalAccruedUsdc += yieldResult.totalAccrued;

    const shareFraction = holding.amountUsdc / target;
    const siteKwh = demo.energyStats.year.solarYieldKwh;
    totalEnergyDeliveredKwh += siteKwh * shareFraction;
  }

  const averageApy =
    totalInvestedUsdc > 0
      ? ((totalAnnualYieldUsdc / totalInvestedUsdc) * 100).toFixed(1)
      : null;

  // Smooth count-up animation for balance and today's yield
  const targetBalance =
    totalInvestedUsdc > 0 ? 24360 + totalInvestedUsdc : 24860;
  const targetToday = 412.18 + totalAccruedUsdc;
  const [displayBalance, setDisplayBalance] = useState(0);
  const [displayToday, setDisplayToday] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 1200; // 1.2s smooth count-up
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // easeOutCubic: 1 - (1 - progress)^3
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplayBalance(Math.round(targetBalance * ease));
      setDisplayToday(Number((targetToday * ease).toFixed(2)));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [targetBalance, targetToday]);

  const handleClaim = async (
    siteId: number,
    baseAmount: number,
    kaminoBonus: number = 0,
  ) => {
    const totalAmount = baseAmount + kaminoBonus;
    if (totalAmount <= 0) return;

    if (
      !wallet &&
      typeof window !== 'undefined' &&
      !(window as unknown as { solana?: unknown }).solana
    ) {
      openWalletModal(true);
      return;
    }

    setClaimingSiteId(siteId);
    setClaimErrorMap((prev) => {
      const next = { ...prev };
      delete next[siteId];
      return next;
    });

    try {
      const demo = demos.find((d) => d.siteId === siteId);
      const res = await requestWalletApproval({
        connection,
        wallet,
        actionName: 'claim_kilowatt_dividends',
        memoPayload: {
          site_id: siteId,
          asset_title: demo?.title || `Clean Energy Asset #${siteId}`,
          base_dividend: Number(baseAmount.toFixed(4)),
          kamino_bonus: Number(kaminoBonus.toFixed(4)),
          total_claimed_usdc: Number(totalAmount.toFixed(4)),
        },
      });

      claimYield(siteId, baseAmount, kaminoBonus);
      setClaimSigMap((prev) => ({ ...prev, [siteId]: res.signature }));
      setJustClaimedMap((prev) => ({
        ...prev,
        [siteId]:
          kaminoBonus > 0
            ? `Claimed +${totalAmount.toFixed(4)} USDC (incl. Kamino yield)`
            : `Claimed +${totalAmount.toFixed(4)} USDC`,
      }));

      setTimeout(() => {
        setJustClaimedMap((prev) => {
          const next = { ...prev };
          delete next[siteId];
          return next;
        });
      }, 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('cancelled') || msg.includes('rejected')) {
        setClaimErrorMap((prev) => ({
          ...prev,
          [siteId]: 'Signing was cancelled in wallet.',
        }));
      } else {
        setClaimErrorMap((prev) => ({
          ...prev,
          [siteId]: `Claim failed: ${msg}`,
        }));
      }
      setTimeout(() => {
        setClaimErrorMap((prev) => {
          const next = { ...prev };
          delete next[siteId];
          return next;
        });
      }, 4000);
    } finally {
      setClaimingSiteId(null);
    }
  };

  const handleClaimAll = async () => {
    if (backedDemos.length === 0 || totalAccruedUsdc <= 0) return;

    if (
      !wallet &&
      typeof window !== 'undefined' &&
      !(window as unknown as { solana?: unknown }).solana
    ) {
      openWalletModal(true);
      return;
    }

    setIsClaimingAll(true);
    try {
      const siteIds = backedDemos.map((d) => d.siteId);
      const res = await requestWalletApproval({
        connection,
        wallet,
        actionName: 'claim_all_kilowatt_dividends',
        memoPayload: {
          site_ids: siteIds,
          total_claimed_usdc: Number(totalAccruedUsdc.toFixed(4)),
          base_dividends: Number(totalBaseDividendsUsdc.toFixed(4)),
          kamino_bonus: Number(totalKaminoBonusUsdc.toFixed(4)),
        },
      });

      for (const demo of backedDemos) {
        const holding = investments[demo.siteId];
        if (!holding || holding.amountUsdc <= 0) continue;
        const yieldResult = calculateAssetAccruedYield(
          holding,
          demo.financials,
          now,
        );
        claimYield(
          demo.siteId,
          yieldResult.baseDividend,
          yieldResult.kaminoBonus,
        );
        setClaimSigMap((prev) => ({ ...prev, [demo.siteId]: res.signature }));
        setJustClaimedMap((prev) => ({
          ...prev,
          [demo.siteId]:
            yieldResult.kaminoBonus > 0
              ? `Claimed +${yieldResult.totalAccrued.toFixed(4)} USDC (incl. Kamino yield)`
              : `Claimed +${yieldResult.totalAccrued.toFixed(4)} USDC`,
        }));
      }

      setTimeout(() => {
        setJustClaimedMap({});
      }, 5000);
    } catch (err: unknown) {
      console.warn('Claim all rejected or failed:', err);
    } finally {
      setIsClaimingAll(false);
    }
  };

  return (
    <section
      id="investor-portfolio"
      aria-label="Investor Portfolio"
      className="py-3 md:py-6 space-y-4 md:space-y-10 animate-fade-in"
    >
      {Object.values(investments).some(
        (holding) => (holding.demoFiatAmountUsdc ?? 0) > 0,
      ) && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-[#183d89]">
          <p className="font-semibold">Card payment summary</p>
          <p className="mt-1 font-semibold">
            Card payments (USDC equivalent): USDC
            {Object.values(investments)
              .reduce(
                (sum, holding) => sum + (holding.demoFiatPaidUsdc ?? 0),
                0,
              )
              .toFixed(2)}
            {' · '}MoonPay & network fees: USDC
            {Object.values(investments)
              .reduce(
                (sum, holding) => sum + (holding.demoFiatFeesUsdc ?? 0),
                0,
              )
              .toFixed(2)}
            {' · '}Net allocated: USDC
            {Object.values(investments)
              .reduce(
                (sum, holding) => sum + (holding.demoFiatAmountUsdc ?? 0),
                0,
              )
              .toFixed(2)}
          </p>
          <p className="mt-2 text-[10px] text-zinc-500">
            Test mode · Portfolio allocations are simulated
          </p>
        </div>
      )}
      {/* MOBILE NATIVE WALLET (Institutional Clean Design) */}
      <div className="md:hidden flex flex-col space-y-4 rounded-3xl bg-white border border-zinc-200/80 p-5 text-zinc-950 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
        {/* 1. Header Bar: Treetino Wallet + Solana Badge */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-zinc-950">
                Treetino Wallet
              </span>
            </div>
            <div className="text-[11px] font-mono text-zinc-500 mt-0.5">
              Alice (Investor) · Clean Energy DePIN
            </div>
          </div>
          {/* Solana Pill Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-purple-200 bg-purple-50 text-xs font-mono font-medium text-purple-900 shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-gradient-to-r from-[#9945FF] to-[#14F195] animate-pulse" />
            <span>Solana</span>
          </div>
        </div>

        {/* 2. Hero Balance Section with Live Count-Up */}
        <div className="pt-1 space-y-1">
          <span className="block text-xs font-medium text-zinc-500">
            Portfolio value
          </span>
          <div className="font-mono text-4xl sm:text-5xl font-black text-zinc-950 tracking-tight">
            USDC {displayBalance.toLocaleString()}
          </div>
          <div className="flex items-center gap-2 pt-0.5">
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
              <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
              <span>+USDC {displayToday.toFixed(2)} today</span>
            </span>
            <span className="text-xs font-mono text-emerald-700/80">
              ({averageApy ? averageApy : '35.0'}% APY)
            </span>
          </div>
          <div className="pt-0.5">
            <button
              type="button"
              onClick={() => setIsKaminoModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-mono font-medium hover:bg-emerald-100 transition cursor-pointer"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                Kamino Pool: +{(KAMINO_TOTAL_APY * 100).toFixed(2)}% APY
                Unclaimed Compounding
              </span>
            </button>
          </div>
        </div>

        {/* 3. Glowing Curved Sparkline Chart */}
        <div className="relative w-full h-24 overflow-hidden rounded-2xl bg-blue-50/40 border border-blue-100 p-1">
          <svg
            viewBox="0 0 350 70"
            className="w-full h-full overflow-visible"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient
                id="mobileWalletSparkline"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#183d89" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#183d89" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            {/* Area Fill */}
            <path
              d="M 10 52 C 45 48, 80 55, 120 42 C 160 28, 200 36, 240 24 C 280 14, 310 18, 340 8 L 340 70 L 10 70 Z"
              fill="url(#mobileWalletSparkline)"
              className="animate-sparkline-fill"
            />
            {/* Stroke Line with Dynamic Draw Animation */}
            <path
              d="M 10 52 C 45 48, 80 55, 120 42 C 160 28, 200 36, 240 24 C 280 14, 310 18, 340 8"
              fill="none"
              stroke="#183d89"
              strokeWidth="3"
              strokeLinecap="round"
              className="animate-sparkline-draw"
            />
            <circle
              cx="340"
              cy="8"
              r="4"
              fill="#183d89"
              className="animate-pulse"
            />
          </svg>
        </div>

        {/* 4. 3 Action Buttons */}
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          <button
            type="button"
            onClick={onExplore}
            className="flex flex-col items-center gap-1.5 transition active:scale-95 cursor-pointer"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#183d89] text-white shadow-xs">
              <SunIcon className="h-5 w-5" />
            </div>
            <span className="text-[11px] font-semibold text-zinc-900">
              Back Projects
            </span>
          </button>
          <button
            type="button"
            disabled={isClaimingAll}
            onClick={handleClaimAll}
            className="flex flex-col items-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-60"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-xs">
              {isClaimingAll ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <CurrencyDollarIcon className="h-5 w-5" />
              )}
            </div>
            <span className="text-[11px] font-semibold text-zinc-900">
              {isClaimingAll ? 'Signing…' : 'Claim Yield'}
            </span>
          </button>
          <button
            type="button"
            onClick={onOpenDeposit}
            className="flex flex-col items-center gap-1.5 transition active:scale-95 cursor-pointer"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-100 hover:bg-zinc-200 border border-zinc-200/80 text-zinc-900 shadow-2xs">
              <BoltIcon className="h-5 w-5 text-[#183d89]" />
            </div>
            <span className="text-[11px] font-semibold text-zinc-900">
              Deposit
            </span>
          </button>
        </div>

        {/* 5. Cash Available Card */}
        <div className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-zinc-200/80 bg-zinc-50/80 text-left shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 border border-blue-200 text-[#183d89]">
              <CurrencyDollarIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-zinc-950">
                Cash Available
              </div>
              <div className="font-mono text-[10px] text-zinc-500">
                Ready to back clean projects
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-sm font-bold text-zinc-950">
              USDC
              {balance.data?.balance
                ? formatTokenAmount(balance.data.balance)
                : '10,000'}
            </span>
            {onOpenDeposit && (
              <button
                type="button"
                onClick={onOpenDeposit}
                className="rounded-full bg-[#183d89] hover:bg-[#2052b0] text-white font-mono text-[11px] font-bold px-3 py-1 transition cursor-pointer shadow-xs"
              >
                + Add
              </button>
            )}
          </div>
        </div>

        {/* 6. Live SCADA Oracle Stream Banner */}
        <div
          className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-500 text-left shadow-2xs ${
            Math.floor(now / 1000) % 2 === 0
              ? 'border-emerald-200 bg-emerald-50/80'
              : 'border-emerald-200/60 bg-emerald-50/40'
          }`}
        >
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-emerald-700">
                Live SCADA Oracle
              </span>
            </div>
            <div className="text-xs font-semibold text-zinc-950">
              Continuous Kilowatt-Hour Streaming
            </div>
            <div className="font-mono text-[10px] text-emerald-700 font-semibold">
              +USDC
              {(totalAnnualYieldUsdc > 0
                ? totalAnnualYieldUsdc / (365 * 24 * 3600)
                : 0.0001
              ).toFixed(6)}{' '}
              USDC / sec
            </div>
          </div>
          <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <BoltIcon className="h-4.5 w-4.5" />
          </div>
        </div>

        {/* 7. Energy Assets Section */}
        <div className="pt-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-zinc-950">Energy assets</h3>
            <button
              type="button"
              onClick={onExplore}
              className="text-xs font-mono font-medium text-[#183d89] hover:underline transition cursor-pointer"
            >
              See all
            </button>
          </div>

          {/* The 4 Asset Cards */}
          <div className="space-y-2.5">
            {/* Asset 1: BESS Přeštice */}
            <div
              onClick={() => onSelectAsset?.(219742)}
              style={{ animationDelay: '50ms' }}
              className="animate-cascade-item flex items-center justify-between p-3.5 rounded-2xl border border-zinc-200/80 bg-zinc-50/70 hover:border-zinc-300 hover:bg-white active:scale-[0.98] shadow-2xs transition-all duration-200 cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 shadow-2xs group-hover:scale-105 transition-all">
                  <BatteryIcon className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-zinc-950 truncate transition">
                    BESS Přeštice
                  </h4>
                  <p className="font-mono text-[11px] text-zinc-500 truncate mt-0.5">
                    8.6 MW · 17.2 MWh
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0 pl-3">
                <div className="font-mono text-sm font-semibold text-zinc-950">
                  USDC
                  {(investments[219742]?.amountUsdc
                    ? investments[219742].amountUsdc
                    : 12400
                  ).toLocaleString()}
                </div>
                <div className="font-mono text-[11px] font-bold text-emerald-600 mt-0.5">
                  35 % APY
                </div>
              </div>
            </div>

            {/* Asset 2: Kryry wind farm */}
            <div
              onClick={() => onSelectAsset?.(219741)}
              style={{ animationDelay: '130ms' }}
              className="animate-cascade-item flex items-center justify-between p-3.5 rounded-2xl border border-zinc-200/80 bg-zinc-50/70 hover:border-zinc-300 hover:bg-white active:scale-[0.98] shadow-2xs transition-all duration-200 cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-700 shadow-2xs group-hover:scale-105 transition-all">
                  <WindIcon className="h-5 w-5 text-cyan-600" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-zinc-950 truncate transition">
                    Kryry wind farm
                  </h4>
                  <p className="font-mono text-[11px] text-zinc-500 truncate mt-0.5">
                    2× Vestas V80 · 4 MW
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0 pl-3">
                <div className="font-mono text-sm font-semibold text-zinc-950">
                  USDC 6,150
                </div>
                <div className="font-mono text-[11px] font-bold text-emerald-600 mt-0.5">
                  +18.4 % APY
                </div>
              </div>
            </div>

            {/* Asset 3: EV hub Paris-Nord */}
            <div
              onClick={() => onSelectAsset?.(219740)}
              style={{ animationDelay: '210ms' }}
              className="animate-cascade-item flex items-center justify-between p-3.5 rounded-2xl border border-zinc-200/80 bg-zinc-50/70 hover:border-zinc-300 hover:bg-white active:scale-[0.98] shadow-2xs transition-all duration-200 cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 border border-blue-200 text-[#183d89] shadow-2xs group-hover:scale-105 transition-all">
                  <PowerPlugIcon className="h-5 w-5 text-[#183d89]" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-zinc-950 truncate transition">
                    EV hub Paris-Nord
                  </h4>
                  <p className="font-mono text-[11px] text-zinc-500 truncate mt-0.5">
                    10 bays · 350 kW
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0 pl-3">
                <div className="font-mono text-sm font-semibold text-zinc-950">
                  USDC 3,900
                </div>
                <div className="font-mono text-[11px] font-bold text-emerald-600 mt-0.5">
                  +22.0 % APY
                </div>
              </div>
            </div>

            {/* Asset 4: Treetino V1 */}
            <div
              onClick={() => onSelectAsset?.(219739)}
              style={{ animationDelay: '290ms' }}
              className="animate-cascade-item flex items-center justify-between p-3.5 rounded-2xl border border-zinc-200/80 bg-zinc-50/70 hover:border-zinc-300 hover:bg-white active:scale-[0.98] shadow-2xs transition-all duration-200 cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 shadow-2xs group-hover:scale-105 transition-all">
                  <SunIcon className="h-5 w-5 text-amber-600" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-zinc-950 truncate transition">
                    Treetino V1 Smart Tree
                  </h4>
                  <p className="font-mono text-[11px] text-zinc-500 truncate mt-0.5">
                    36 Leaves · 12 Turbines · 49 kW
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0 pl-3">
                <div className="font-mono text-sm font-semibold text-zinc-950">
                  USDC 2,410
                </div>
                <div className="font-mono text-[11px] font-bold text-emerald-600 mt-0.5">
                  +14.2 % APY
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 8. 3-Pill Telemetry Stats Strip */}
        <div className="grid grid-cols-3 gap-2 w-full pt-2 font-mono text-[11px]">
          <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-3 text-center shadow-2xs">
            <span className="text-zinc-500 text-[10px] block">Delivered</span>
            <strong className="text-zinc-950 block font-semibold text-xs mt-0.5">
              {totalEnergyDeliveredKwh >= 1000
                ? `${(totalEnergyDeliveredKwh / 1000).toFixed(1)} MWh`
                : `${(70.2 + totalEnergyDeliveredKwh).toFixed(1)} kWh`}
            </strong>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3 text-center shadow-2xs">
            <span className="text-emerald-700 text-[10px] block">
              Avg Yield
            </span>
            <strong className="text-emerald-700 block font-semibold text-xs mt-0.5">
              {averageApy ? `${averageApy}%` : '35.0%'} APY
            </strong>
          </div>
          <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-3 text-center shadow-2xs">
            <span className="text-zinc-500 text-[10px] block">Holdings</span>
            <strong className="text-zinc-950 block font-semibold text-xs mt-0.5">
              4 Active
            </strong>
          </div>
        </div>
      </div>

      {/* 1. DESKTOP PORTFOLIO COMMAND CENTER HEADER */}
      <div className="hidden md:flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between border-b border-zinc-200/80 pb-8">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[#183d89]">
            FINTECH PORTFOLIO · DEPIN CASHFLOWS
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
            My Energy Infrastructure Portfolio
          </h1>
          <p className="mt-2.5 max-w-2xl text-sm text-zinc-500 font-normal leading-relaxed">
            Monitor real physical hardware allocations, live Victron Cerbo GX
            kilowatt-hour generation, and daily bond yields streaming into your
            wallet in 1:1 stable currency.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Balance Pill */}
          <div className="rounded-full border border-zinc-200/80 bg-white/90 px-4 py-2 text-xs font-mono shadow-xs backdrop-blur-sm">
            <span className="text-zinc-500">Balance: </span>
            <strong className="text-zinc-950 font-semibold">
              {balance.data
                ? `${formatTokenAmount(balance.data.balance)} USDC`
                : '0.00 USDC'}
            </strong>
          </div>

          {/* Add Funds Trigger */}
          {onOpenDeposit && (
            <button
              type="button"
              onClick={onOpenDeposit}
              className="flex items-center gap-1.5 rounded-full border border-zinc-200/80 bg-white hover:bg-zinc-50 px-4 py-2 text-xs font-mono font-medium text-zinc-800 shadow-xs transition active:scale-[0.98] cursor-pointer"
            >
              <CurrencyDollarIcon className="h-4 w-4 text-[#183d89]" />
              <span>+ Deposit Funds</span>
            </button>
          )}

          {/* Claim All Button - Signature Gradient */}
          {backedDemos.length > 0 && totalAccruedUsdc > 0 && (
            <button
              type="button"
              disabled={isClaimingAll}
              onClick={handleClaimAll}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#183d89] to-[#2563eb] hover:from-[#1d4bb5] hover:to-[#3b82f6] px-5 py-2 text-xs font-semibold text-white shadow-sm transition active:scale-[0.98] cursor-pointer disabled:opacity-60"
            >
              {isClaimingAll && (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
              <span>
                {isClaimingAll
                  ? 'Signing in Phantom…'
                  : `Claim All (${totalAccruedUsdc.toFixed(4)} USDC)`}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* 2. DESKTOP FINANCIAL KPI RIBBON */}
      <div className="hidden md:grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {/* KPI 1 */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-1.5">
          <span className="block font-mono text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            Total Capital Backed
          </span>
          <span className="block font-mono text-2xl sm:text-4xl font-semibold text-zinc-950 tracking-tight">
            USDC {totalInvestedUsdc.toLocaleString()}
          </span>
          <span className="block text-xs text-zinc-500 font-normal pt-1">
            Across {backedDemos.length} clean energy installation
            {backedDemos.length === 1 ? '' : 's'}
          </span>
        </div>

        {/* KPI 2 */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-1.5">
          <span className="block font-mono text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            Clean Energy Delivered
          </span>
          <span className="block font-mono text-2xl sm:text-4xl font-semibold text-[#183d89] tracking-tight">
            {totalEnergyDeliveredKwh >= 1000
              ? `${(totalEnergyDeliveredKwh / 1000).toFixed(2)} MWh`
              : `${totalEnergyDeliveredKwh.toFixed(1)} kWh`}
          </span>
          <span className="block text-xs text-zinc-500 font-normal pt-1">
            Signed by Cerbo GX SCADA
          </span>
        </div>

        {/* KPI 3 */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-1.5">
          <span className="block font-mono text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            Weighted Average Yield
          </span>
          <span className="block font-mono text-2xl sm:text-4xl font-semibold text-zinc-950 tracking-tight">
            {averageApy ? `${averageApy}%` : 'Up to 35.0%'}{' '}
            <span className="text-xs sm:text-sm font-normal text-zinc-500">
              APY
            </span>
          </span>
          <span className="block text-xs text-zinc-500 font-normal pt-1">
            {totalInvestedUsdc > 0
              ? `+USDC ${totalAnnualYieldUsdc.toFixed(2)} / yr contracted`
              : 'Contracted PPA yields (12.8% – 35.0%)'}
          </span>
        </div>

        {/* KPI 4: LIVE STREAMING DIVIDENDS */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="block font-mono text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              Live Accrued Dividends
            </span>
            <button
              type="button"
              onClick={() => setIsKaminoModalOpen(true)}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-mono text-emerald-700 hover:bg-emerald-100 transition cursor-pointer"
              title="Inspect Kamino liquidity pool auto-compounding"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Kamino +{(KAMINO_TOTAL_APY * 100).toFixed(2)}%</span>
            </button>
          </div>
          <span className="block font-mono text-2xl sm:text-4xl font-semibold text-[#183d89] tracking-tight">
            +USDC {totalAccruedUsdc.toFixed(4)}
          </span>
          <span className="block text-xs text-zinc-500 font-normal pt-1">
            {totalKaminoBonusUsdc > 0
              ? `USDC ${totalBaseDividendsUsdc.toFixed(4)} base + USDC ${totalKaminoBonusUsdc.toFixed(4)} Kamino pool yield`
              : 'Streaming per second · 1:1 USD peg'}
          </span>
        </div>
      </div>

      {/* 3. ACTIVE BACKED ASSETS SECTION */}
      {backedDemos.length > 0 ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#183d89]">
                Active Holdings
              </span>
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
                Hardware Tokens & Allocations ({backedDemos.length})
              </h2>
            </div>
            <button
              type="button"
              onClick={onExplore}
              className="text-xs font-mono font-semibold text-[#183d89] hover:underline flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>Explore Pools</span>
              <ArrowRightIcon className="h-3 w-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 min-w-0 w-full">
            {backedDemos.map((demo) => {
              const holding = investments[demo.siteId]!;
              const target = demo.financials.targetUsdc || 10000;
              const poolSharePercent = (
                (holding.amountUsdc / target) *
                100
              ).toFixed(2);
              const holdingAnnual =
                holding.amountUsdc * (demo.financials.projectedApy / 100);
              const yieldResult = calculateAssetAccruedYield(
                holding,
                demo.financials,
                now,
              );
              const accruedBase = yieldResult.baseDividend;
              const kaminoBonus = yieldResult.kaminoBonus;
              const totalAccruedHolding = yieldResult.totalAccrued;
              const claimedText = justClaimedMap[demo.siteId];

              return (
                <article
                  key={demo.siteId}
                  className="flex flex-col justify-between rounded-3xl border border-zinc-200/80 bg-white p-5 sm:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:border-zinc-300 hover:shadow-lg transition-all duration-300 min-w-0 w-full overflow-hidden"
                >
                  <div className="space-y-4">
                    {/* Top Row: Thumbnail + Category + Title */}
                    <div className="flex gap-4 items-start">
                      <div className="relative h-18 w-24 shrink-0 overflow-hidden rounded-2xl bg-zinc-100 border border-zinc-200/80 shadow-xs">
                        <img
                          src={getCampaignCoverImage(demo.key)}
                          alt={demo.title}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="font-semibold uppercase tracking-wider text-[#183d89]">
                            {demo.categoryBadge}
                          </span>
                          <span className="flex items-center gap-1.5 text-zinc-600 font-medium">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#183d89]" />
                            Live Telemetry
                          </span>
                        </div>
                        <h3 className="mt-1 text-base sm:text-lg font-semibold text-zinc-950 truncate">
                          {demo.title}
                        </h3>
                        <p className="font-mono text-xs text-zinc-500 truncate">
                          {demo.location.city}, {demo.location.country} ·{' '}
                          {CAMPAIGN_METADATA[demo.key]?.creator ?? 'Operator'}
                        </p>
                      </div>
                    </div>

                    {/* Ownership & Dividend Metrics */}
                    <div className="grid grid-cols-2 gap-3 rounded-2xl bg-zinc-50/80 border border-zinc-200/60 p-4 text-xs">
                      <div>
                        <span className="block text-zinc-500 font-normal">
                          Your Allocation
                        </span>
                        <span className="mt-0.5 block font-mono text-lg font-semibold text-zinc-950">
                          {holding.amountUsdc.toLocaleString()} USDC
                        </span>
                        <span className="text-[11px] text-zinc-500 font-mono">
                          {poolSharePercent}% of Pool Stake
                        </span>
                      </div>
                      <div>
                        <span className="block text-zinc-500 font-normal">
                          Projected Return
                        </span>
                        <span className="mt-0.5 block font-mono text-lg font-semibold text-[#183d89]">
                          {demo.financials.projectedApy}% APY
                        </span>
                        <span className="text-[11px] text-zinc-600 font-mono">
                          +USDC {holdingAnnual.toFixed(2)} / yr
                        </span>
                      </div>
                    </div>

                    {/* Live SCADA Telemetry Glance */}
                    <div className="grid grid-cols-2 gap-2 rounded-2xl border border-zinc-200/60 bg-zinc-50/50 p-3 text-xs">
                      <div className="flex items-center gap-2">
                        <SunIcon className="h-3.5 w-3.5 text-[#183d89] shrink-0" />
                        <div>
                          <span className="block text-[10px] text-zinc-400 font-mono uppercase">
                            Current Power
                          </span>
                          <span className="font-mono font-medium text-zinc-900 text-xs">
                            {(demo.currentPower.solarYieldWatts / 1000).toFixed(
                              1,
                            )}{' '}
                            kW
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <BatteryIcon className="h-3.5 w-3.5 text-[#183d89] shrink-0" />
                        <div>
                          <span className="block text-[10px] text-zinc-400 font-mono uppercase">
                            Storage Charge
                          </span>
                          <span className="font-mono font-medium text-zinc-900 text-xs">
                            {demo.currentPower.batterySocPercent.toFixed(0)}%
                            SOC
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Live Accrued Yield Box */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="block font-mono text-[10px] uppercase font-semibold text-zinc-500">
                            Unclaimed Kilowatt-Hour Dividend
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsKaminoModalOpen(true)}
                            className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-mono font-medium text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>
                              Kamino Pool (+
                              {(KAMINO_TOTAL_APY * 100).toFixed(2)}% APY)
                            </span>
                          </button>
                        </div>
                        <span className="font-mono text-xl font-semibold text-zinc-950 mt-0.5 block">
                          +{totalAccruedHolding.toFixed(4)} USDC
                        </span>
                        <span className="font-mono text-[10px] text-zinc-500 block">
                          USDC {accruedBase.toFixed(4)} hardware + USDC
                          {kaminoBonus.toFixed(4)} Kamino bonus
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={
                          claimingSiteId === demo.siteId || isClaimingAll
                        }
                        onClick={() =>
                          handleClaim(demo.siteId, accruedBase, kaminoBonus)
                        }
                        className="w-full sm:w-auto text-center rounded-full bg-gradient-to-r from-[#183d89] to-[#2563eb] hover:from-[#1d4bb5] hover:to-[#3b82f6] px-5 py-2 text-xs font-semibold text-white shadow-xs transition active:scale-[0.98] cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5"
                      >
                        {claimingSiteId === demo.siteId && (
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        )}
                        <span>
                          {claimingSiteId === demo.siteId
                            ? 'Signing…'
                            : 'Claim Yield'}
                        </span>
                      </button>
                    </div>

                    {claimedText && (
                      <div className="text-center space-y-1 pt-1">
                        <p className="font-mono text-xs font-bold text-emerald-600">
                          {claimedText}
                        </p>
                        {claimSigMap[demo.siteId] && (
                          <a
                            href={`https://solscan.io/tx/${claimSigMap[demo.siteId]}?cluster=devnet`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-mono text-[#183d89] hover:underline"
                          >
                            <span>
                              Solscan: {claimSigMap[demo.siteId].slice(0, 8)}…
                            </span>
                            <ExternalLinkIcon className="h-2.5 w-2.5" />
                          </a>
                        )}
                      </div>
                    )}

                    {claimErrorMap[demo.siteId] && (
                      <p className="text-center font-mono text-xs font-semibold text-amber-600 pt-1">
                        {claimErrorMap[demo.siteId]}
                      </p>
                    )}
                  </div>

                  {/* Footer Action */}
                  <div className="mt-5 border-t border-zinc-200/80 pt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectAsset?.(demo.siteId)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-full border border-zinc-200/80 bg-white hover:bg-zinc-50 py-2.5 text-xs font-mono font-medium text-zinc-800 shadow-xs transition active:scale-[0.98] cursor-pointer"
                    >
                      <span>Inspect SCADA Telemetry & PPA</span>
                      <ExternalLinkIcon className="h-3 w-3 text-zinc-500" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Compounding DePIN Calculator inside Portfolio */}
          <div className="pt-4">
            <CompoundingYieldCalculator
              initialApy={averageApy ? parseFloat(averageApy) : 35.0}
              assetTitle={backedDemos[0]?.title ?? 'BESS Přeštice 8.6 MW'}
              onBackProject={onExplore}
            />
          </div>
        </div>
      ) : (
        /* Empty State with Discovery Cards */
        <div className="rounded-3xl border border-zinc-200/80 bg-white p-8 sm:p-12 shadow-[0_4px_24px_rgba(0,0,0,0.03)] text-center space-y-8">
          <div className="max-w-md mx-auto space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#183d89] border border-blue-100 shadow-xs">
              <ShieldCheckIcon className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
              No Active Allocations Yet
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 font-normal leading-relaxed">
              Back high-yield physical energy pools starting at just USDC 50.
              Stream real-time kilowatt-hour cashflows secured by Solana smart
              contracts.
            </p>
            {onOpenDeposit && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onOpenDeposit}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#183d89] to-[#2563eb] hover:from-[#1d4bb5] hover:to-[#3b82f6] px-6 py-3 text-xs font-semibold text-white shadow-sm transition active:scale-[0.98] cursor-pointer"
                >
                  <CurrencyDollarIcon className="h-4 w-4" />
                  <span>Deposit Capital (1,000 USDC)</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Start Top 3 Pools */}
          <div className="border-t border-zinc-200/80 pt-8 text-left space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Recommended Opportunities
              </span>
              <button
                type="button"
                onClick={onExplore}
                className="font-mono text-xs font-semibold text-[#183d89] hover:underline cursor-pointer"
              >
                View all pools →
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {demos.slice(0, 3).map((demo) => (
                <div
                  key={demo.siteId}
                  className="group rounded-2xl border border-zinc-200/80 bg-white p-4 flex flex-col justify-between space-y-3 hover:border-zinc-300 hover:shadow-md shadow-xs transition"
                >
                  <div className="space-y-3">
                    <div className="relative h-28 w-full overflow-hidden rounded-xl bg-zinc-100 border border-zinc-200/70">
                      <img
                        src={getCampaignCoverImage(demo.key)}
                        alt={demo.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-2 right-2 rounded-full bg-zinc-950/85 px-2.5 py-0.5 font-mono text-[10px] font-bold text-white shadow-xs">
                        {demo.financials.projectedApy}% APY
                      </span>
                      {demo.financials.projectedApy >= 35 && (
                        <span className="absolute bottom-2 left-2 rounded-md bg-[#183d89]/95 px-2 py-0.5 font-mono text-[9px] font-bold text-white shadow-xs">
                          20% Arb + 15% Standby
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#183d89]">
                        {demo.categoryBadge}
                      </span>
                      <h3 className="mt-0.5 font-semibold text-zinc-950 text-sm line-clamp-1">
                        {demo.title}
                      </h3>
                      <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                        {demo.location.city}, {demo.location.country}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      onBackProject
                        ? onBackProject(demo)
                        : onSelectAsset?.(demo.siteId)
                    }
                    className="flex w-full items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#183d89] to-[#2563eb] hover:from-[#1d4bb5] hover:to-[#3b82f6] py-2 text-xs font-semibold text-white shadow-xs transition active:scale-[0.98] cursor-pointer"
                  >
                    <span>Invest Now</span>
                    <ArrowRightIcon className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. INTERACTIVE 15-YEAR PPA HORIZON COMPARISON */}
      <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 pb-5">
          <div>
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#183d89]">
              Institutional Cash Flow Model
            </span>
            <h3 className="mt-1 text-xl font-semibold text-zinc-950 sm:text-2xl">
              15-Year Industrial PPA Yield Horizon
            </h3>
            <p className="mt-1 text-xs text-zinc-500 font-normal">
              Compare contracted clean energy infrastructure cashflows against
              traditional yield instruments over the full asset lifespan.
            </p>
          </div>

          {/* Horizon Pills */}
          <div className="flex items-center gap-1.5 rounded-full border border-zinc-200/80 bg-zinc-100/70 p-1 font-mono text-xs">
            {([1, 5, 15] as const).map((yr) => (
              <button
                key={yr}
                type="button"
                onClick={() => setHorizonYears(yr)}
                className={`rounded-full px-4 py-1.5 font-semibold transition cursor-pointer ${
                  horizonYears === yr
                    ? 'bg-zinc-950 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                {yr} {yr === 1 ? 'Year' : 'Years'}
              </button>
            ))}
          </div>
        </div>

        {/* Horizon Comparison Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Treetino */}
          <div className="rounded-2xl border-2 border-[#183d89] bg-blue-50/30 p-5 space-y-2 shadow-xs">
            <span className="font-mono text-[10px] font-bold uppercase text-[#183d89]">
              Treetino Energy Bond
            </span>
            <div className="font-mono text-3xl font-light text-zinc-950">
              15.2% <span className="text-xs text-zinc-500">APY</span>
            </div>
            <div className="font-mono text-sm font-semibold text-[#183d89]">
              +USDC{' '}
              {(1000 * Math.pow(1 + 0.152, horizonYears) - 1000).toFixed(0)}{' '}
              return / USDC 1,000
            </div>
            <p className="text-[11px] text-zinc-600 font-normal leading-snug">
              Contracted industrial off-taker PPA backed by physical hardware
              and daily SCADA billing.
            </p>
          </div>

          {/* US Treasury */}
          <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-5 space-y-2 hover:border-zinc-300 transition">
            <span className="font-mono text-[10px] font-semibold uppercase text-zinc-500">
              10-Yr US Treasury Bond
            </span>
            <div className="font-mono text-3xl font-light text-zinc-950">
              4.2% <span className="text-xs text-zinc-500">APY</span>
            </div>
            <div className="font-mono text-sm font-semibold text-zinc-700">
              +USDC{' '}
              {(1000 * Math.pow(1 + 0.042, horizonYears) - 1000).toFixed(0)}{' '}
              return / USDC 1,000
            </div>
            <p className="text-[11px] text-zinc-500 font-normal leading-snug">
              Standard sovereign benchmark. Locked maturity, fixed yield.
            </p>
          </div>

          {/* S&P Dividend */}
          <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-5 space-y-2 hover:border-zinc-300 transition">
            <span className="font-mono text-[10px] font-semibold uppercase text-zinc-500">
              S&P 500 Dividend Aristocrats
            </span>
            <div className="font-mono text-3xl font-light text-zinc-950">
              1.6% <span className="text-xs text-zinc-500">APY</span>
            </div>
            <div className="font-mono text-sm font-semibold text-zinc-700">
              +USDC{' '}
              {(1000 * Math.pow(1 + 0.016, horizonYears) - 1000).toFixed(0)}{' '}
              return / USDC 1,000
            </div>
            <p className="text-[11px] text-zinc-500 font-normal leading-snug">
              Equities yield without principal guarantees. Subject to market
              equity volatility.
            </p>
          </div>

          {/* Bank Savings */}
          <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-5 space-y-2 hover:border-zinc-300 transition">
            <span className="font-mono text-[10px] font-semibold uppercase text-zinc-500">
              Traditional Savings Account
            </span>
            <div className="font-mono text-3xl font-light text-zinc-950">
              0.5% <span className="text-xs text-zinc-500">APY</span>
            </div>
            <div className="font-mono text-sm font-semibold text-zinc-700">
              +USDC{' '}
              {(1000 * Math.pow(1 + 0.005, horizonYears) - 1000).toFixed(0)}{' '}
              return / USDC 1,000
            </div>
            <p className="text-[11px] text-zinc-500 font-normal leading-snug">
              Negative real return after inflation. Full custodian risk.
            </p>
          </div>
        </div>
      </div>

      <KaminoPoolModal
        isOpen={isKaminoModalOpen}
        onClose={() => setIsKaminoModalOpen(false)}
        unclaimedDividendsUsdc={totalBaseDividendsUsdc}
        kaminoBonusUsdc={totalKaminoBonusUsdc}
        walletAddress={wallet?.address}
        wallet={wallet}
        onClaimSuccess={(baseAmount, bonusAmount) => {
          if (backedDemos.length > 0) {
            const perDemoBase = baseAmount / backedDemos.length;
            const perDemoBonus = bonusAmount / backedDemos.length;
            for (const demo of backedDemos) {
              claimYield(demo.siteId, perDemoBase, perDemoBonus);
            }
          }
        }}
      />
    </section>
  );
}
