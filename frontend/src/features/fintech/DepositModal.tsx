import { useState, useEffect } from 'react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useConnectedWallet } from '../wallet/use-connected-wallet';
import { usePublicTransactions } from '../marketplace/hooks/use-public-transactions';
import { parseTokenAmount } from '../../chain/amounts';
import {
  CurrencyDollarIcon,
  CheckIcon,
  ExternalLinkIcon,
} from '../victron/victron-icons';
import { UniversalPopup } from './UniversalPopup';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance?: string;
  onDepositSuccess?: () => void;
}

export function DepositModal({
  isOpen,
  onClose,
  currentBalance,
  onDepositSuccess,
}: DepositModalProps) {
  const wallet = useConnectedWallet();
  const { setVisible: openWalletModal } = useWalletModal();
  const publicTx = usePublicTransactions(wallet);

  const [amountStr, setAmountStr] = useState('1000');
  const [successDismissTimer, setSuccessDismissTimer] = useState<number | null>(
    null,
  );

  const amountNum = parseFloat(amountStr) || 0;

  useEffect(() => {
    return () => {
      if (successDismissTimer) window.clearTimeout(successDismissTimer);
    };
  }, [successDismissTimer]);

  if (!isOpen) return null;

  const handleDeposit = () => {
    if (!wallet) {
      openWalletModal(true);
      return;
    }
    if (amountNum <= 0) return;

    try {
      const baseUnits = parseTokenAmount(amountStr);
      publicTx.mutate(
        { action: 'giveMeMoney', amount: baseUnits },
        {
          onSuccess: () => {
            onDepositSuccess?.();
            const timer = window.setTimeout(() => {
              publicTx.reset();
              onClose();
            }, 3000);
            setSuccessDismissTimer(timer);
          },
        },
      );
    } catch (err) {
      console.error('Invalid token amount:', err);
    }
  };

  const estAnnualYield = (amountNum * 0.152).toFixed(2);

  return (
    <UniversalPopup
      isOpen={isOpen}
      onClose={onClose}
      dark={false}
      icon={
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 border border-blue-200 text-[#183d89] shadow-xs">
          <CurrencyDollarIcon className="h-8 w-8" />
        </div>
      }
      tag="DEMO WALLET"
      title="Deposit Funds (USDC)"
      description="Add demo USDC to your demo wallet to invest in devices or pay for EV charging."
      mainPoint={
        <div className="space-y-3">
          {/* Amount Input Row */}
          <div className="flex items-center justify-between pb-2 border-b border-zinc-200/80">
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-medium text-zinc-400 select-none">
                USDC
              </span>
              <input
                id="deposit-amount-input"
                type="number"
                min="10"
                max="50000"
                step="50"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-28 text-3xl font-bold tracking-tight text-zinc-950 bg-transparent focus:outline-none"
                placeholder="1000"
              />
            </div>
            <div className="flex items-center gap-1.5 rounded-xl bg-blue-50 border border-blue-200 px-2.5 py-1 shadow-2xs font-mono text-xs font-bold text-[#183d89]">
              <div className="h-4 w-4 rounded-full bg-[#10b981] flex items-center justify-center text-white text-[10px] font-bold">
                <CurrencyDollarIcon className="h-4 w-4" />
              </div>
              <span>USDC</span>
            </div>
          </div>

          {/* Preset Chips */}
          <div className="flex flex-wrap gap-1.5 font-mono">
            {['250', '500', '1000', '2500'].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setAmountStr(val)}
                className={`flex-1 min-w-[55px] py-1 rounded-lg text-xs font-semibold transition cursor-pointer text-center ${
                  amountStr === val
                    ? 'bg-[#183d89] text-white shadow-xs'
                    : 'bg-white border border-zinc-200/80 text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                +USDC {val}
              </button>
            ))}
          </div>

          {/* Balance & Est Yield Summary */}
          <div className="pt-2 border-t border-zinc-200/80 space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Current Balance</span>
              <span className="font-mono font-bold text-zinc-950">
                {currentBalance ? `${currentBalance} USDC` : '0.00 USDC'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">
                Estimated Yield (~15.2% APY)
              </span>
              <span className="font-mono font-bold text-[#183d89]">
                +USDC {estAnnualYield}/yr
              </span>
            </div>
          </div>

          {/* Feedback status */}
          {publicTx.isPending && (
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-2.5 text-xs text-[#183d89] font-medium text-center">
              Adding demo funds…
            </div>
          )}

          {publicTx.isSuccess && (
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-2.5 text-xs text-[#183d89] font-medium text-center space-y-1">
              <div className="font-bold flex items-center justify-center gap-1">
                <CheckIcon className="h-3.5 w-3.5 text-[#183d89]" />
                <span>+{amountNum.toLocaleString()} USDC Deposited!</span>
              </div>
              {publicTx.signature && (
                <a
                  href={`https://solscan.io/tx/${publicTx.signature}?cluster=devnet`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] text-[#183d89] underline"
                >
                  <span>View on Solscan</span>
                  <ExternalLinkIcon className="h-2.5 w-2.5" />
                </a>
              )}
            </div>
          )}

          {publicTx.error && (
            <div className="rounded-xl border border-zinc-200 bg-zinc-100 p-2.5 text-xs text-zinc-800">
              {publicTx.error.message}
            </div>
          )}
        </div>
      }
      primaryButton={{
        label: !wallet
          ? 'Connect Wallet to Deposit'
          : publicTx.isPending
            ? 'Saving demo balance…'
            : `Add +${amountNum.toLocaleString()} demo USDC →`,
        onClick: !wallet ? () => openWalletModal(true) : handleDeposit,
        isLoading: publicTx.isPending,
        disabled: publicTx.isPending || amountNum <= 0,
      }}
      secondaryButton={{
        label: 'Cancel',
        onClick: onClose,
      }}
      footerNote="Demo credits · Balance saved to your account"
    />
  );
}
