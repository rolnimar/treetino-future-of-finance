import { useState, useEffect } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useConnectedWallet } from '../wallet/use-connected-wallet';
import { useVictronInvestments } from '../victron/use-victron-investments';
import { usePublicTransactions } from '../marketplace/hooks/use-public-transactions';
import { useTrees } from '../trees/use-trees';
import { parseTokenAmount } from '../../chain/amounts';
import { requestWalletApproval } from '../../chain/wallet-action';
import type { VictronDemoItem } from '../victron/victron-types';
import { getCampaignCoverImage } from '../victron/campaign-helpers';
import { CheckIcon, ExternalLinkIcon } from '../victron/victron-icons';
import { UniversalPopup } from './UniversalPopup';

interface BackProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  demo: VictronDemoItem | null;
  walletBalance?: string;
  onOpenDeposit?: () => void;
  onNavigatePortfolio?: () => void;
}

export function BackProjectModal({
  isOpen,
  onClose,
  demo,
  walletBalance,
  onNavigatePortfolio,
}: BackProjectModalProps) {
  const { connection } = useConnection();
  const wallet = useConnectedWallet();
  const { setVisible: openWalletModal } = useWalletModal();
  const { invest } = useVictronInvestments(wallet?.address);
  const publicTx = usePublicTransactions(wallet);
  const { data: treesData } = useTrees('all', 0);

  const [amountStr, setAmountStr] = useState('500');
  const [step, setStep] = useState<'input' | 'confirming' | 'success'>('input');
  const [isInstantConfirmed, setIsInstantConfirmed] = useState(false);
  const [liveYieldTicks, setLiveYieldTicks] = useState(0);
  const [prevDemoSiteId, setPrevDemoSiteId] = useState<number | null>(null);
  const [confirmedTxSig, setConfirmedTxSig] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (demo && demo.siteId !== prevDemoSiteId) {
    setPrevDemoSiteId(demo.siteId);
    setStep('input');
    setIsInstantConfirmed(false);
    setLiveYieldTicks(0);
    setConfirmedTxSig(null);
    setErrorMessage(null);
  }

  const amountNum = parseFloat(amountStr) || 0;
  const balanceNum = walletBalance ? parseFloat(walletBalance) : 0;
  const isInsufficient = wallet && balanceNum > 0 && amountNum > balanceNum;

  const handleQuickMint = () => {
    if (!wallet) {
      openWalletModal(true);
      return;
    }
    try {
      const baseUnits = parseTokenAmount('1000');
      publicTx.mutate({ action: 'giveMeMoney', amount: baseUnits });
    } catch (e) {
      console.error(e);
    }
  };

  // Live yield streaming ticker simulation
  useEffect(() => {
    if (step !== 'success') return;
    const interval = setInterval(() => {
      setLiveYieldTicks((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  if (!isOpen || !demo) return null;

  const target = demo.financials.targetUsdc || 10000;
  const apyFraction = demo.financials.projectedApy / 100;
  const poolStakePercent = ((amountNum / target) * 100).toFixed(2);
  const annualDividend = (amountNum * apyFraction).toFixed(2);
  const dailyDividend = ((amountNum * apyFraction) / 365).toFixed(2);

  const streamingCents = (
    (parseFloat(annualDividend) / (365 * 24 * 3600)) *
    (liveYieldTicks + 1)
  ).toFixed(6);

  const handleConfirmBacking = async () => {
    if (amountNum <= 0) return;

    if (
      !wallet &&
      typeof window !== 'undefined' &&
      !(window as unknown as { solana?: unknown }).solana
    ) {
      openWalletModal(true);
      return;
    }

    setErrorMessage(null);
    setStep('confirming');

    try {
      const approval = await requestWalletApproval({
        connection,
        wallet,
        actionName: 'back_clean_energy_infrastructure',
        memoPayload: {
          site_id: demo.siteId,
          asset_title: demo.title,
          amount_eurtree: amountNum,
          projected_apy: demo.financials.projectedApy,
          hardware_escrow: 'solana_devnet_v1',
        },
      });

      invest(demo.siteId, amountNum);
      setIsInstantConfirmed(true);
      setConfirmedTxSig(approval.signature);

      const matchingTree =
        treesData?.trees?.find((t) => t.id === String(demo.siteId)) ??
        treesData?.trees?.[0];

      if (matchingTree && matchingTree.phase === 'funding') {
        try {
          const baseUnits = parseTokenAmount(amountStr);
          publicTx.mutate({
            action: 'buyShares',
            tree: matchingTree,
            amount: baseUnits,
          });
        } catch {
          // ignore
        }
      }

      setTimeout(() => setStep('success'), 400);
    } catch (err: unknown) {
      console.warn('Backing rejected or failed:', err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('cancelled') || msg.includes('rejected')) {
        setErrorMessage('Transaction was cancelled in wallet.');
      } else {
        setErrorMessage(`Transaction failed: ${msg}`);
      }
      setStep('input');
    }
  };

  // STEP 2: CONFIRMING
  if (step === 'confirming') {
    return (
      <UniversalPopup
        isOpen={isOpen}
        onClose={onClose}
        dark={false}
        icon={
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 border border-blue-200 shadow-xs">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#183d89] border-t-transparent" />
          </div>
        }
        tag="SOLANA DEVNET ESCROW"
        title="Confirming Allocation…"
        description="Interacting with Anchor contract escrow. Please approve the transaction in your wallet."
        mainPoint={
          <div className="py-4 text-center text-xs text-zinc-600 font-mono">
            Submitting transaction to Solana Devnet…
          </div>
        }
        primaryButton={{
          label: 'Confirming…',
          onClick: () => {},
          isLoading: true,
          disabled: true,
        }}
      />
    );
  }

  // STEP 3: SUCCESS (Confirmation state matching layout 100%)
  if (step === 'success') {
    return (
      <UniversalPopup
        isOpen={isOpen}
        onClose={onClose}
        dark={false}
        icon={
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md">
            <CheckIcon className="h-8 w-8" />
          </div>
        }
        tag="ALLOCATION CONFIRMED"
        title={`You Backed ${demo.title}!`}
        description={`€${amountNum.toLocaleString()} EURTree allocated into hardware escrow. You now own ${poolStakePercent}% of this installation.`}
        mainPoint={
          <div className="space-y-1.5 text-center py-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-700 border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>LIVE YIELD STREAM ACTIVE</span>
            </div>
            <div className="font-mono text-3xl sm:text-4xl font-bold text-zinc-950 tracking-tight pt-1">
              +€{streamingCents}{' '}
              <span className="text-xs text-zinc-500 font-normal font-sans">
                EURTree
              </span>
            </div>
            <p className="text-[11px] text-zinc-600 font-normal">
              Continuous kilowatt-hour revenue accruing every second based on
              Victron Cerbo GX telemetry.
            </p>
            {confirmedTxSig && (
              <div className="pt-2">
                <a
                  href={`https://solscan.io/tx/${confirmedTxSig}?cluster=devnet`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-[#183d89] hover:underline"
                >
                  <span>
                    Solscan: {confirmedTxSig.slice(0, 8)}…
                    {confirmedTxSig.slice(-6)}
                  </span>
                  <ExternalLinkIcon className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>
        }
        primaryButton={{
          label: 'Go to My Portfolio →',
          onClick: () => {
            onClose();
            onNavigatePortfolio?.();
          },
        }}
        secondaryButton={{
          label: 'Done',
          onClick: onClose,
        }}
      />
    );
  }

  // STEP 1: INVESTMENT INPUT STATE (Exact same 6-step layout)
  return (
    <UniversalPopup
      isOpen={isOpen}
      onClose={onClose}
      dark={false}
      icon={
        <div className="relative h-16 w-16 overflow-hidden rounded-full ring-4 ring-blue-500/20 shadow-md">
          <img
            src={getCampaignCoverImage(demo.key)}
            alt={demo.title}
            className="h-full w-full object-cover"
          />
        </div>
      }
      tag={`${demo.financials.projectedApy}% APY · REAL ASSET ESCROW`}
      title={`Back ${demo.title}`}
      description={`${
        demo.location?.city ?? 'Dolni Lukavice'
      }, Czech Republic · 20-Yr ČEZ Concession Agreement`}
      mainPoint={
        <div className="space-y-3">
          {/* Amount Input Row */}
          <div className="flex items-center justify-between pb-2 border-b border-zinc-200/80">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-light text-zinc-400 select-none">
                €
              </span>
              <input
                id="back-amount-input"
                type="number"
                min="10"
                step="50"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-28 text-3xl font-bold tracking-tight text-zinc-950 bg-transparent focus:outline-none"
                placeholder="500"
              />
            </div>
            <div className="flex items-center gap-1.5 rounded-xl bg-blue-50 border border-blue-200 px-2.5 py-1 shadow-2xs font-mono text-xs font-bold text-[#183d89]">
              <div className="h-4 w-4 rounded-full bg-[#10b981] flex items-center justify-center text-white text-[10px] font-bold">
                €
              </div>
              <span>EURTree</span>
            </div>
          </div>

          {/* Preset Chips */}
          <div className="flex items-center gap-1.5 font-mono">
            {['100', '500', '1000'].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setAmountStr(val)}
                className={`flex-1 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  amountStr === val
                    ? 'bg-[#183d89] text-white shadow-xs'
                    : 'bg-white border border-zinc-200/80 text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                €{val}
              </button>
            ))}
            {wallet && balanceNum > 0 && (
              <button
                type="button"
                onClick={() => setAmountStr(String(Math.floor(balanceNum)))}
                className="px-2 py-1 rounded-lg text-xs font-semibold bg-white border border-zinc-200/80 text-zinc-700 hover:bg-zinc-100"
              >
                Max
              </button>
            )}
          </div>

          {/* Yield & Stake Breakdown */}
          <div className="pt-2 border-t border-zinc-200/80 space-y-1.5 text-[11px] text-zinc-500 text-left">
            <div className="flex justify-between items-center">
              <span>Projected Yield:</span>
              <span className="font-mono font-bold text-emerald-600">
                +€{annualDividend}/yr (+€{dailyDividend}/d)
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Hardware Share:</span>
              <span className="font-mono font-semibold text-zinc-950">
                {poolStakePercent}% of Installation
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Revenue Model:</span>
              <span className="font-medium text-zinc-800">
                Spot Arb + Grid Standby
              </span>
            </div>
          </div>

          {isInsufficient && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-2 text-xs text-amber-900 flex items-center justify-between">
              <span>Amount exceeds balance</span>
              <button
                type="button"
                disabled={publicTx.isPending}
                onClick={handleQuickMint}
                className="font-bold text-amber-800 underline cursor-pointer"
              >
                Mint €1k
              </button>
            </div>
          )}

          {errorMessage && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-900 font-medium text-center">
              {errorMessage}
            </div>
          )}
        </div>
      }
      primaryButton={{
        label: isInstantConfirmed ? (
          <span className="inline-flex items-center gap-2 animate-scale-up font-bold">
            <CheckIcon className="h-5 w-5" />
            <span>✓ Confirmed in 0.4 s</span>
          </span>
        ) : !wallet ? (
          'Connect Wallet to Invest'
        ) : (
          `Confirm on Solana (€${amountNum.toLocaleString()})`
        ),
        onClick: !wallet ? () => openWalletModal(true) : handleConfirmBacking,
        disabled: amountNum <= 0,
        colorClass: isInstantConfirmed
          ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 shadow-emerald-500/40 ring-2 ring-emerald-400/50'
          : undefined,
      }}
      secondaryButton={{
        label: 'Test Demo Simulation',
        onClick: handleConfirmBacking,
      }}
      footerNote="1:1 Stable Settlement · Zero Volatility · Solana PDA Escrow"
    />
  );
}
