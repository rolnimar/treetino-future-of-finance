import { useState } from 'react';
import type { VictronDemoItem } from './victron-types';
import { useVictronInvestments } from './use-victron-investments';
import { useLiveYieldStream } from './yield-stream';
import { useConnectedWallet } from '../wallet/use-connected-wallet';
import { usePublicTransactions } from '../marketplace/hooks/use-public-transactions';
import { parseTokenAmount } from '../../chain/amounts';

interface VictronMoneyFlowProps {
  demo: VictronDemoItem;
  walletAddress?: string;
  walletBalance?: string;
  onOpenDeposit?: () => void;
  onBackProject?: (demo: VictronDemoItem) => void;
}

export function VictronMoneyFlow({
  demo,
  walletAddress,
  walletBalance,
  onOpenDeposit,
  onBackProject,
}: VictronMoneyFlowProps) {
  const wallet = useConnectedWallet();
  const publicTx = usePublicTransactions(wallet);
  const [investAmount, setInvestAmount] = useState<number>(500);
  const { investments } = useVictronInvestments(walletAddress);
  const currentHolding = investments[demo.siteId];

  // Proportional calculations
  const target = demo.financials.targetUsdc || 10000;
  const apyFraction = demo.financials.projectedApy / 100;
  const poolSharePercent = ((investAmount / target) * 100).toFixed(2);
  const annualDividend = (investAmount * apyFraction).toFixed(2);
  const monthlyDividend = ((investAmount * apyFraction) / 12).toFixed(2);
  const dailyDividend = ((investAmount * apyFraction) / 365).toFixed(2);

  // Synchronized live accrued yield
  const liveResult = useLiveYieldStream(currentHolding, demo.financials);
  const accruedUsdc = liveResult.totalAccrued;

  return (
    <div className="space-y-6">
      {/* 1. VISUAL MONEY FLOW PIPELINE */}
      <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-xs sm:p-8">
        <div className="border-b border-black/10 pb-4">
          <div className="flex items-center gap-2 text-xs font-mono text-t-blue font-semibold uppercase tracking-wider">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Tokenized Cash Flow Pipeline
          </div>
          <h3 className="mt-1 text-xl font-bold tracking-tight text-zinc-950 sm:text-2xl">
            How Metered Kilowatt-Hours Turn Into Investor Yield
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            Automated revenue settlement: Signed Cerbo GX energy telemetry
            directly triggers Solana smart contract dividend payouts.
          </p>
        </div>

        {/* 4-Step Visual Flow Cards */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Step 1 */}
          <div className="rounded-2xl border border-black/10 bg-amber-50/50 p-5 text-xs shadow-2xs">
            <div className="font-mono text-[10px] text-amber-800 font-bold uppercase tracking-wider">
              Stage 01 · Metering
            </div>
            <div className="mt-1 font-bold text-zinc-950 text-sm">
              Metered Generation
            </div>
            <div className="mt-2 font-mono text-lg font-black text-amber-950">
              {demo.energyStats.year.solarYieldKwh.toLocaleString()} kWh / yr
            </div>
            <p className="mt-1.5 text-[11px] text-zinc-600 leading-snug">
              Signed telemetry logged on-site by Venus OS Cerbo GX gateway.
            </p>
          </div>

          {/* Step 2 */}
          <div className="rounded-2xl border border-black/10 bg-sky-50/50 p-5 text-xs shadow-2xs">
            <div className="font-mono text-[10px] text-sky-800 font-bold uppercase tracking-wider">
              Stage 02 · Tariff Billing
            </div>
            <div className="mt-1 font-bold text-zinc-950 text-sm">
              Energy Revenue
            </div>
            <div className="mt-2 font-mono text-lg font-black text-t-blue">
              USDC {demo.financials.estAnnualRevenueUsdc.toLocaleString()} / yr
            </div>
            <p className="mt-1.5 text-[11px] text-zinc-600 leading-snug">
              {demo.financials.tariffRate}
            </p>
          </div>

          {/* Step 3 */}
          <div className="rounded-2xl border border-black/10 bg-zinc-50/80 p-5 text-xs shadow-2xs">
            <div className="font-mono text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
              Stage 03 · Operational
            </div>
            <div className="mt-1 font-bold text-zinc-950 text-sm">
              O&M & Connection
            </div>
            <div className="mt-2 font-mono text-lg font-black text-zinc-900">
              {demo.financials.cashFlowWaterfall[1]?.amount ?? '-7%'}
            </div>
            <p className="mt-1.5 text-[11px] text-zinc-600 leading-snug">
              Cerbo GX LTE connectivity, hardware insurance, and maintenance.
            </p>
          </div>

          {/* Step 4 */}
          <div className="rounded-2xl border border-t-blue/20 bg-t-blue/5 p-5 text-xs shadow-2xs">
            <div className="font-mono text-[10px] text-t-blue font-bold uppercase tracking-wider">
              Stage 04 · Distribution
            </div>
            <div className="mt-1 font-bold text-zinc-950 text-sm">
              Net Investor Yield
            </div>
            <div className="mt-2 font-mono text-xl font-black text-t-blue">
              {demo.financials.projectedApy}% APY
            </div>
            <p className="mt-1.5 text-[11px] text-zinc-600 leading-snug">
              Automated dividend streams to verified tokenholder wallets.
            </p>
          </div>
        </div>

        {/* Detailed Annual Waterfall Table */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xs">
          <div className="border-b border-black/10 bg-zinc-50 px-5 py-3.5 font-mono text-xs font-bold text-zinc-700 uppercase tracking-wider">
            Annual Cash Flow Breakdown & Yield Waterfall
          </div>
          <div className="divide-y divide-black/5 text-xs">
            {demo.financials.cashFlowWaterfall.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-wrap items-center justify-between p-4 sm:px-5 gap-2"
              >
                <div>
                  <div className="font-bold text-zinc-950 text-sm flex items-center gap-2">
                    <span>{item.title}</span>
                    <span className="font-mono text-xs text-zinc-400 font-normal">
                      ({item.percentage})
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {item.description}
                  </p>
                </div>
                <div
                  className={`font-mono text-base font-extrabold ${
                    idx === demo.financials.cashFlowWaterfall.length - 1
                      ? 'text-t-blue text-lg'
                      : idx === 1
                        ? 'text-rose-600'
                        : 'text-zinc-900'
                  }`}
                >
                  {item.amount}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. INVESTOR TERMINAL & LIVE ALLOCATION CALCULATOR */}
      <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-xs sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 pb-4">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-zinc-950 sm:text-2xl">
              Investor Allocation & Yield Terminal
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              Calculate your exact hardware ownership and continuous dividend
              distribution.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="rounded-xl border border-black/10 bg-zinc-50 px-3.5 py-2 font-mono text-xs text-zinc-700">
              <span className="text-zinc-500">Connected: </span>
              {walletAddress ? (
                <span className="text-t-blue font-bold">
                  {walletAddress.slice(0, 4)}…{walletAddress.slice(-4)} (
                  {walletBalance ?? '0'} USDC)
                </span>
              ) : (
                <span className="text-amber-700 font-semibold">
                  Demo Simulation
                </span>
              )}
            </div>

            {onOpenDeposit ? (
              <button
                type="button"
                onClick={onOpenDeposit}
                className="rounded-xl border border-t-blue/30 bg-t-blue/5 px-3 py-2 font-mono text-xs font-bold text-t-blue hover:bg-t-blue/10 transition shadow-2xs cursor-pointer flex items-center gap-1.5"
              >
                <span>+ Deposit / Mint USDC</span>
              </button>
            ) : wallet ? (
              <button
                type="button"
                disabled={publicTx.isPending}
                onClick={() =>
                  publicTx.mutate({
                    action: 'giveMeMoney',
                    amount: parseTokenAmount('1000'),
                  })
                }
                className="rounded-xl border border-t-blue/30 bg-t-blue/5 px-3 py-2 font-mono text-xs font-bold text-t-blue hover:bg-t-blue/10 transition disabled:opacity-50 shadow-2xs cursor-pointer"
              >
                {publicTx.isPending ? 'Minting…' : '+ Faucet 1,000 USDC'}
              </button>
            ) : null}
          </div>
        </div>

        {publicTx.isSuccess && (
          <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-semibold text-emerald-800">
            Minted 1,000 USDC to your devnet wallet!
          </div>
        )}
        {publicTx.error && (
          <div className="mt-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-800">
            {publicTx.error.message}
          </div>
        )}

        {/* ACTIVE POSITION CARD IF INVESTED */}
        {currentHolding && currentHolding.amountUsdc > 0 && (
          <div className="mt-6 rounded-2xl border border-t-blue/20 bg-t-blue/5 p-6 text-xs shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-t-blue font-bold">
                  Demo Asset Holding
                </div>
                <div className="mt-1 text-2xl font-black text-zinc-950">
                  {currentHolding.amountUsdc.toLocaleString()} USDC (
                  {((currentHolding.amountUsdc / target) * 100).toFixed(2)}%
                  Pool Share)
                </div>
                <p className="mt-1 text-zinc-600">
                  Yield streaming continuously from metered energy generation at{' '}
                  {demo.financials.projectedApy}% APY.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="block font-mono text-[10px] text-zinc-500 font-semibold">
                    Simulated Dividend
                  </span>
                  <span className="font-mono text-2xl font-black text-t-blue">
                    +{accruedUsdc.toFixed(4)} USDC
                  </span>
                </div>
                <a
                  href="#trees"
                  className="rounded-xl bg-zinc-950 px-4 py-2.5 font-semibold text-white hover:bg-black/90 transition shadow-sm text-xs"
                >
                  View on-chain rewards
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ALLOCATION INPUT AND PROPORTIONAL BREAKDOWN */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left: Input & Allocation Controls */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700">
                Investment Amount (USDC)
              </label>
              <div className="relative mt-2">
                <input
                  type="number"
                  min="10"
                  step="50"
                  value={investAmount}
                  onChange={(e) =>
                    setInvestAmount(
                      Math.max(0, parseFloat(e.target.value) || 0),
                    )
                  }
                  className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 font-mono text-xl font-extrabold text-zinc-950 focus:border-t-blue focus:ring-1 focus:ring-t-blue focus:outline-hidden shadow-2xs"
                />
                <span className="absolute right-4 top-3.5 font-mono text-xs font-bold text-zinc-400">
                  USDC
                </span>
              </div>
            </div>

            {/* Quick Amount Buttons */}
            <div className="flex flex-wrap gap-2">
              {[100, 250, 500, 1000, 2500].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setInvestAmount(amt)}
                  className={`rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition font-mono cursor-pointer ${
                    investAmount === amt
                      ? 'border-t-blue bg-t-blue text-white shadow-xs'
                      : 'border-black/10 bg-white text-zinc-700 hover:bg-black/5'
                  }`}
                >
                  USDC {amt}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => onBackProject?.(demo)}
              disabled={!onBackProject}
              className="w-full rounded-xl bg-t-blue hover:bg-t-blue/90 py-3.5 text-sm font-semibold text-white shadow-sm transition active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              Invest with Card or USDC →
            </button>
          </div>

          {/* Right: Proportional Distribution Table */}
          <div className="rounded-2xl border border-black/10 bg-zinc-50/70 p-6 text-xs shadow-2xs">
            <span className="font-mono text-[10px] text-t-blue font-bold uppercase tracking-wider">
              Exact Distribution for {investAmount.toLocaleString()} USDC
            </span>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between border-b border-black/5 pb-2.5">
                <span className="text-zinc-600 font-medium">
                  Hardware Ownership Stake:
                </span>
                <span className="font-mono font-bold text-zinc-950 text-sm">
                  {poolSharePercent}% of Pool
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-black/5 pb-2.5">
                <span className="text-zinc-600 font-medium">
                  Daily Energy Dividend:
                </span>
                <span className="font-mono font-bold text-t-blue text-sm">
                  +USDC {dailyDividend} / day
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-black/5 pb-2.5">
                <span className="text-zinc-600 font-medium">
                  Monthly Run-Rate:
                </span>
                <span className="font-mono font-bold text-t-blue text-sm">
                  +USDC {monthlyDividend} / mo
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="font-bold text-zinc-950 text-sm">
                  Annual Distributed Yield:
                </span>
                <span className="font-mono text-2xl font-black text-t-blue">
                  +USDC {annualDividend} / yr
                </span>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-black/10 bg-white p-3.5 text-[11px] text-zinc-500 leading-snug shadow-2xs">
              <strong className="text-zinc-900">
                Yield Distribution Rule:
              </strong>{' '}
              For every kilowatt-hour metered by this Victron installation,
              revenue is split proportionally according to token share. (USDC
              {investAmount} × {demo.financials.projectedApy}%) = USDC
              {annualDividend} annual return.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
