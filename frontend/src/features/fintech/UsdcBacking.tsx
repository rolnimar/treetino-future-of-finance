import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useConnectedWallet } from '../wallet/use-connected-wallet';
import { useUsdc } from '../marketplace/hooks/use-mock-usdc';
import { usePublicTransactions } from '../marketplace/hooks/use-public-transactions';
import { api } from '../../lib/api';
import { treesResponseSchema } from '../../lib/schemas';
import { formatTokenAmount, parseTokenAmount } from '../../chain/amounts';
import type { VictronDemoItem } from '../victron/victron-types';
import { getCampaignCoverImage } from '../victron/campaign-helpers';
import { UniversalPopup } from './UniversalPopup';
import { PaymentMethodSwitch } from './PaymentMethodSwitch';

export function UsdcBacking({
  demo,
  onClose,
  onUseCard,
  onOpenDeposit,
  onNavigatePortfolio,
}: {
  demo: VictronDemoItem;
  onClose: () => void;
  onUseCard: () => void;
  onOpenDeposit?: () => void;
  onNavigatePortfolio?: () => void;
}) {
  const wallet = useConnectedWallet();
  const { setVisible } = useWalletModal();
  const balance = useUsdc(wallet?.address);
  const transaction = usePublicTransactions(wallet);
  const [amount, setAmount] = useState('500');
  const [inputError, setInputError] = useState<string | null>(null);
  const trees = useQuery({
    queryKey: ['trees', 'funding-catalog'],
    queryFn: ({ signal }) =>
      api('trees?limit=1000', treesResponseSchema, { signal }),
    refetchInterval: 10_000,
  });
  const tree = trees.data?.trees.find(
    (item) => item.address === demo.identifier,
  );
  let units = '0';
  let amountError: string | null = null;
  try {
    units = parseTokenAmount(amount);
  } catch (error) {
    amountError =
      error instanceof Error ? error.message : 'Enter a valid USDC amount';
  }
  const insufficient =
    !!balance.data && BigInt(units) > BigInt(balance.data.balance);
  const exceedsRemaining = !!tree && BigInt(units) > BigInt(tree.remaining);
  const ready =
    !!tree?.canBuy &&
    !amountError &&
    !insufficient &&
    !exceedsRemaining &&
    !!balance.data;
  const buy = () => {
    if (!wallet) {
      setVisible(true);
      return;
    }
    if (!tree || !ready || transaction.isPending) return;
    setInputError(null);
    try {
      transaction.mutate({
        action: 'buyShares',
        tree,
        amount: parseTokenAmount(amount),
      });
    } catch (error) {
      setInputError(error instanceof Error ? error.message : 'Invalid amount');
    }
  };
  const success = transaction.isSuccess;
  return (
    <UniversalPopup
      isOpen
      onClose={transaction.isPending ? () => {} : onClose}
      icon={
        <img
          src={getCampaignCoverImage(demo.key)}
          alt=""
          className="h-16 w-16 rounded-full object-cover"
        />
      }
      tag={success ? 'INVESTMENT CONFIRMED' : 'BACK CLEAN ENERGY'}
      title={
        success ? 'Your USDC investment is confirmed' : `Back ${demo.title}`
      }
      description={
        success
          ? 'Your test USDC funded this project on Solana devnet. Your shares are available in your portfolio.'
          : 'Invest USDC directly from your wallet. 1 USDC buys 1 project share. Your wallet pays network fees in SOL.'
      }
      mainPoint={
        success ? (
          <div className="space-y-3 text-sm">
            <p className="text-center text-3xl font-bold">{amount} USDC</p>
            <a
              className="block break-all text-xs text-blue-800 underline"
              href={`https://solscan.io/tx/${transaction.signature}?cluster=devnet`}
              target="_blank"
              rel="noreferrer"
            >
              View confirmed transaction
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            <PaymentMethodSwitch
              method="usdc"
              disabled={transaction.isPending}
              onChange={(method) => {
                if (method === 'card') onUseCard();
              }}
            />
            <label
              htmlFor="usdc-invest-amount"
              className="block text-xs text-zinc-600"
            >
              Investment amount (USDC)
            </label>
            <input
              id="usdc-invest-amount"
              type="number"
              min="0.000001"
              step="0.000001"
              value={amount}
              disabled={transaction.isPending}
              onChange={(event) => setAmount(event.target.value)}
              className="w-full border-b border-zinc-200 bg-transparent pb-3 text-3xl font-bold outline-none"
            />
            <p className="text-xs text-zinc-600">
              Wallet balance:{' '}
              {balance.data
                ? `${formatTokenAmount(balance.data.balance)} USDC`
                : wallet
                  ? 'Loading…'
                  : 'Connect your wallet'}
            </p>
            {tree && (
              <p className="text-xs text-zinc-600">
                Available to fund: {formatTokenAmount(tree.remaining)} USDC
              </p>
            )}
            {onOpenDeposit && (
              <button
                type="button"
                disabled={transaction.isPending}
                onClick={() => {
                  onClose();
                  onOpenDeposit();
                }}
                className="text-xs font-semibold text-blue-800 underline"
              >
                Get test USDC
              </button>
            )}
            <p role="status" className="text-xs text-amber-900">
              {transaction.isPending
                ? transaction.signature
                  ? 'Confirming your transaction on Solana…'
                  : 'Approve the USDC investment in your wallet…'
                : (transaction.error?.message ??
                  inputError ??
                  balance.error?.message ??
                  trees.error?.message ??
                  (trees.isPending
                    ? 'Loading project funding account…'
                    : !tree
                      ? 'This project’s funding account is not available yet.'
                      : !tree.canBuy
                        ? 'This project is not accepting funding.'
                        : (amountError ??
                          (insufficient
                            ? 'Insufficient USDC balance.'
                            : exceedsRemaining
                              ? 'Amount exceeds remaining project funding.'
                              : ''))))}
            </p>
            {transaction.signature && !transaction.isSuccess && (
              <a
                className="block text-xs text-blue-800 underline"
                href={`https://solscan.io/tx/${transaction.signature}?cluster=devnet`}
                target="_blank"
                rel="noreferrer"
              >
                Check transaction status before retrying
              </a>
            )}
          </div>
        )
      }
      primaryButton={{
        label: success
          ? 'Go to My Portfolio →'
          : !wallet
            ? 'Connect Wallet to Continue'
            : `Invest ${amount || '—'} USDC`,
        onClick: success
          ? () => {
              onClose();
              onNavigatePortfolio?.();
            }
          : buy,
        isLoading: transaction.isPending,
        disabled: !success && !!wallet && (!ready || !!transaction.signature),
      }}
      secondaryButton={{
        label: success ? 'Done' : 'Cancel',
        onClick: onClose,
        disabled: transaction.isPending,
      }}
      footerNote="Solana devnet · Test USDC"
    />
  );
}
