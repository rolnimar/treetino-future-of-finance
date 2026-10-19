import { useState } from 'react';

interface Stage {
  id: string;
  stepNumber: string;
  instruction: string;
  title: string;
  shortSummary: string;
  signature: string;
  guarantee: string;
  statBadge: string;
}

const STAGES: Stage[] = [
  {
    id: 'escrow',
    stepNumber: '01',
    instruction: 'buy_shares',
    title: 'PDA Escrow Vault',
    shortSummary: 'Non-custodial capital lock',
    signature: 'buy_shares(ctx: Context<BuyShares>, amount: u64)',
    guarantee:
      '100% Capital Protection: Funds lock in PDA vault until target is fully met.',
    statBadge: 'Zero Slippage',
  },
  {
    id: 'revoke',
    stepNumber: '02',
    instruction: 'purchase_tree',
    title: 'Non-Dilutive Settlement',
    shortSummary: 'Mint authority burned forever',
    signature: 'purchase_tree(ctx: Context<PurchaseTree>)',
    guarantee:
      'Zero Dilution Guarantee: Mint authority revoked on-chain at 100% funding.',
    statBadge: 'Mint Revoked',
  },
  {
    id: 'oracle',
    stepNumber: '03',
    instruction: 'submit_report',
    title: 'Hardware SCADA Oracle',
    shortSummary: '96 daily readings cryptographically signed',
    signature:
      'submit_report(ctx: Context<SubmitReport>, day_start_ts, wh: Vec<u32>)',
    guarantee:
      'Edge Cryptography: Victron Cerbo GX industrial hardware signs 96 readings daily.',
    statBadge: '96 Readings / Day',
  },
  {
    id: 'streaming',
    stepNumber: '04',
    instruction: 'claim_rewards',
    title: 'O(1) Streaming Yield',
    shortSummary: 'Instant claims without gas spikes',
    signature: 'claim_rewards(ctx: Context<ClaimRewards>)',
    guarantee:
      'O(1) Precision: 10^18 global index accumulator ensures constant-time claims.',
    statBadge: '< USDC 0.0002 / Tx',
  },
];

export function PitchContractVisualizer() {
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const activeStage = STAGES[activeStageIndex];

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6 backdrop-blur-xl shadow-xl">
      {/* Top Bar: Devnet Program ID & Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Solana Devnet
            </span>
          </div>
          <span className="h-3 w-px bg-white/15" />
          <span className="font-mono text-xs text-zinc-400 truncate max-w-[200px] sm:max-w-none">
            EEbZ5DVTQ9f4XeRwmSh4u2QPiMSSmQjqKPNEpDHoBU2n
          </span>
        </div>

        <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 font-mono text-[11px] font-medium text-blue-300">
          Anchor v0.30 Verified
        </span>
      </div>

      {/* 4 Architecture Nodes (Interactive Stepper) */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        {STAGES.map((stage, idx) => {
          const isActive = activeStageIndex === idx;
          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => setActiveStageIndex(idx)}
              className={`text-left rounded-xl p-3.5 border transition-all cursor-pointer ${
                isActive
                  ? 'border-blue-500 bg-blue-600/15 shadow-lg shadow-blue-900/30 ring-1 ring-blue-500/50'
                  : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`font-mono text-xs font-bold ${isActive ? 'text-blue-400' : 'text-zinc-500'}`}
                >
                  {stage.stepNumber}
                </span>
                <span className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400 border border-white/5">
                  {stage.instruction}
                </span>
              </div>
              <div className="text-sm font-bold text-white tracking-tight truncate">
                {stage.title}
              </div>
              <div className="text-xs text-zinc-400 mt-1 line-clamp-1">
                {stage.shortSummary}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Node Detail & On-Chain Guarantee */}
      <div className="mt-4 rounded-xl border border-white/10 bg-black/40 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-blue-400 font-semibold">
              fn {activeStage.signature}
            </span>
          </div>
          <div className="text-sm font-medium text-zinc-200">
            {activeStage.guarantee}
          </div>
        </div>

        <div className="shrink-0 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 font-mono text-xs font-semibold text-emerald-400">
          {activeStage.statBadge}
        </div>
      </div>
    </div>
  );
}
