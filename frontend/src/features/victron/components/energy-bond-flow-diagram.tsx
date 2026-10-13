import { useState } from 'react';
import {
  ShieldCheckIcon,
  CurrencyEuroIcon,
  BoltIcon,
  ArrowRightIcon,
} from '../victron-icons';

export function EnergyBondFlowDiagram() {
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | null>(null);

  const stepDetails = {
    1: {
      tag: 'Anchor PDA Escrow',
      desc: 'Your pledge is locked in a non-custodial smart contract until 100% funding is reached, after which fractional hardware titles (SPL) are minted with permanently burned authority (zero dilution).',
    },
    2: {
      tag: 'Victron SCADA Oracle',
      desc: 'On-site Victron Cerbo GX controllers cryptographically sign 15-minute generation readings to Solana daily report PDAs. Commercial off-takers are legally bound by 15-year PPAs to pay metered invoices.',
    },
    3: {
      tag: '10^18 Precision Accumulator',
      desc: 'Commercial off-taker invoice payments fund the on-chain revenue vault. Our O(1) mathematical accumulator credits your wallet in 1:1 stable currency with zero crypto volatility and zero middlemen.',
    },
  };

  return (
    <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-6">
      {/* 1. Diagram Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
        <div>
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#183d89]">
            Visual Capital & Energy Flow
          </span>
          <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-950 mt-0.5">
            How You Earn 14.2% – 18.5% APY in 3 Steps
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-zinc-500">
            100% Physical Asset Backed
          </span>
        </div>
      </div>

      {/* 2. Visual 3-Node Connected Schema */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 relative">
        {/* Step 1: Back Hardware */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveStep(activeStep === 1 ? null : 1)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setActiveStep(activeStep === 1 ? null : 1);
            }
          }}
          className={`group relative rounded-2xl border p-5 sm:p-6 transition-all cursor-pointer ${
            activeStep === 1
              ? 'border-[#183d89] bg-blue-50/30 shadow-sm ring-2 ring-[#183d89]/15'
              : 'border-zinc-200/80 bg-zinc-50/40 hover:bg-white hover:border-zinc-300 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-[#183d89]">
              01 / PLEDGE
            </span>
            <span className="font-mono text-[11px] font-medium text-zinc-500">
              From €50
            </span>
          </div>

          <div className="my-4 flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-950 text-white group-hover:bg-[#183d89] shadow-xs group-hover:scale-105 transition-all">
              <ShieldCheckIcon className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-zinc-950">
                You Back Hardware
              </h4>
              <p className="text-xs font-mono text-[#183d89] font-medium">
                Legal Fractional Title
              </p>
            </div>
          </div>

          <p className="text-xs text-zinc-600 font-normal leading-relaxed">
            Co-own patented solar trees, batteries, and charging plazas.
            Non-custodial escrow guarantees zero dilution.
          </p>

          <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3 text-[11px] font-mono text-zinc-400">
            <span>Anchor PDA Escrow</span>
            <span className="text-[#183d89] group-hover:translate-x-0.5 transition-transform font-medium">
              Details ↓
            </span>
          </div>

          {/* Desktop Pipeline Arrow */}
          <div
            aria-hidden="true"
            className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 h-6 w-6 items-center justify-center rounded-full bg-white border border-zinc-200 shadow-xs pointer-events-none"
          >
            <ArrowRightIcon className="h-3 w-3 text-zinc-400" />
          </div>
        </div>

        {/* Step 2: 24/7 Power Sales */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveStep(activeStep === 2 ? null : 2)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setActiveStep(activeStep === 2 ? null : 2);
            }
          }}
          className={`group relative rounded-2xl border p-5 sm:p-6 transition-all cursor-pointer ${
            activeStep === 2
              ? 'border-[#183d89] bg-blue-50/30 shadow-sm ring-2 ring-[#183d89]/15'
              : 'border-zinc-200/80 bg-zinc-50/40 hover:bg-white hover:border-zinc-300 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-[#183d89]">
              02 / GENERATE
            </span>
            <span className="font-mono text-[11px] font-semibold text-zinc-700">
              15-Year PPA
            </span>
          </div>

          <div className="my-4 flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-950 text-white group-hover:bg-[#183d89] shadow-xs group-hover:scale-105 transition-all">
              <BoltIcon className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-zinc-950">
                Electricity Sold 24/7
              </h4>
              <p className="text-xs font-mono text-[#183d89] font-medium">
                Factories & Grid Off-Takers
              </p>
            </div>
          </div>

          <p className="text-xs text-zinc-600 font-normal leading-relaxed">
            Hardware produces power around the clock. Victron Cerbo GX meters
            kilowatt-hours and signs telemetry on-chain.
          </p>

          <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3 text-[11px] font-mono text-zinc-400">
            <span>Cerbo GX Oracle</span>
            <span className="text-[#183d89] group-hover:translate-x-0.5 transition-transform font-medium">
              Details ↓
            </span>
          </div>

          {/* Desktop Pipeline Arrow */}
          <div
            aria-hidden="true"
            className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 h-6 w-6 items-center justify-center rounded-full bg-white border border-zinc-200 shadow-xs pointer-events-none"
          >
            <ArrowRightIcon className="h-3 w-3 text-zinc-400" />
          </div>
        </div>

        {/* Step 3: Direct Cash Flow */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveStep(activeStep === 3 ? null : 3)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setActiveStep(activeStep === 3 ? null : 3);
            }
          }}
          className={`group relative rounded-2xl border p-5 sm:p-6 transition-all cursor-pointer ${
            activeStep === 3
              ? 'border-[#183d89] bg-blue-50/30 shadow-sm ring-2 ring-[#183d89]/15'
              : 'border-zinc-200/80 bg-zinc-50/40 hover:bg-white hover:border-zinc-300 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-[#183d89]">
              03 / YIELD
            </span>
            <span className="font-mono text-[11px] font-semibold text-[#183d89]">
              14.2% – 18.5% APY
            </span>
          </div>

          <div className="my-4 flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-950 text-white group-hover:bg-[#183d89] shadow-xs group-hover:scale-105 transition-all">
              <CurrencyEuroIcon className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-zinc-950">
                Direct Cash Flow
              </h4>
              <p className="text-xs font-mono text-[#183d89] font-medium">
                1:1 Stable Daily Payout
              </p>
            </div>
          </div>

          <p className="text-xs text-zinc-600 font-normal leading-relaxed">
            Off-takers pay commercial invoices. Automated smart contracts stream
            bond yields to your wallet with zero crypto volatility.
          </p>

          <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3 text-[11px] font-mono text-zinc-400">
            <span>O(1) Accumulator</span>
            <span className="text-[#183d89] group-hover:translate-x-0.5 transition-transform font-medium">
              Details ↓
            </span>
          </div>
        </div>
      </div>

      {/* 3. Closed-Loop Banner with Signature Gradient */}
      <div className="rounded-2xl border border-zinc-900 bg-zinc-950 p-4 sm:p-5 text-white overflow-hidden relative shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 shrink-0">
              <span className="h-2 w-2 rounded-full bg-blue-400" />
            </div>
            <div>
              <span className="text-zinc-400 uppercase tracking-wider text-[11px]">
                AUTOMATED CLOSED-LOOP:
              </span>{' '}
              <span className="text-white font-normal">
                Pledge Capital &rarr; Solar &amp; Battery Generation &rarr; 1:1
                Stable Payouts
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-zinc-400 text-[11px] shrink-0">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#183d89]" />
            <span>Zero Speculative Crypto Volatility</span>
          </div>
        </div>

        {/* Animated Pipeline Graphic using the ONE signature gradient */}
        <div className="mt-3.5 relative h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
          <div
            className="absolute inset-y-0 w-1/3 rounded-full bg-gradient-to-r from-[#183d89] to-[#2563eb] animate-pulse"
            style={{
              animationDuration: '2.5s',
              animationIterationCount: 'infinite',
            }}
          />
        </div>
      </div>

      {/* 4. Interactive Step Detail Drawer */}
      {activeStep && (
        <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-4 sm:p-5 text-xs space-y-1.5 animate-fade-in shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-mono font-bold text-[#183d89] uppercase tracking-wider">
              Step {activeStep}: {stepDetails[activeStep].tag}
            </span>
            <button
              type="button"
              onClick={() => setActiveStep(null)}
              className="text-zinc-400 hover:text-zinc-700 cursor-pointer font-mono text-[11px]"
            >
              Close
            </button>
          </div>
          <p className="text-zinc-700 font-normal leading-relaxed">
            {stepDetails[activeStep].desc}
          </p>
        </div>
      )}
    </div>
  );
}
