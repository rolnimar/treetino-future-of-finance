import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useConnection } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useConnectedWallet } from '../wallet/use-connected-wallet';
import { useUsdc } from '../marketplace/hooks/use-mock-usdc';
import { requestWalletApproval } from '../../chain/wallet-action';
import { formatTokenAmount, parseTokenAmount } from '../../chain/amounts';
import { demoPost, investmentSchema } from '../devices/device-api';
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
  const wallet = useConnectedWallet(),
    { connection } = useConnection(),
    { setVisible } = useWalletModal(),
    client = useQueryClient();
  const balance = useUsdc(wallet?.address),
    [amount, setAmount] = useState('500'),
    id = useRef(crypto.randomUUID());
  let amountUnits = '0',
    valid = true;
  try {
    amountUnits = parseTokenAmount(amount);
  } catch {
    valid = false;
  }
  const available =
    !!balance.data && BigInt(amountUnits) <= BigInt(balance.data.balance);
  const mutation = useMutation({
    mutationFn: async () => {
      if (!wallet) throw new Error('Connect your wallet first.');
      const approval = await requestWalletApproval({
        connection,
        wallet,
        actionName: 'demo_device_investment',
        memoPayload: {
          simulated: true,
          site_id: demo.siteId,
          amount_usdc: amount,
          request_id: id.current,
        },
      });
      return demoPost(
        wallet,
        `devices/${demo.siteId}/investments`,
        investmentSchema,
        { id: id.current, amount, memoReference: approval.signature },
      );
    },
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ['device-catalog'] }),
        client.invalidateQueries({ queryKey: ['device-portfolio'] }),
        client.invalidateQueries({ queryKey: ['wallet', 'usdc'] }),
      ]);
    },
    retry: false,
  });
  return (
    <UniversalPopup
      isOpen
      onClose={mutation.isPending ? () => {} : onClose}
      icon={
        <img
          src={getCampaignCoverImage(demo.key)}
          alt=""
          className="h-16 w-16 rounded-full object-cover"
        />
      }
      tag={mutation.isSuccess ? 'INVESTMENT RECORDED' : 'BACK CLEAN ENERGY'}
      title={
        mutation.isSuccess
          ? 'Your USDC investment is saved'
          : `Back ${demo.title}`
      }
      description={
        mutation.isSuccess
          ? 'Your demo investment is saved and available in your portfolio on every device.'
          : 'Invest demo USDC in this device. A wallet memo confirms your action; your investment is recorded.'
      }
      mainPoint={
        mutation.isSuccess ? (
          <div className="space-y-3">
            <p className="text-center text-3xl font-bold">{amount} USDC</p>
            <p className="break-all text-xs text-zinc-500">
              Investment receipt: {mutation.data.id}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <PaymentMethodSwitch
              method="usdc"
              disabled={mutation.isPending}
              onChange={(m) => {
                if (m === 'card') onUseCard();
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
              disabled={mutation.isPending}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border-b border-zinc-200 bg-transparent pb-3 text-3xl font-bold outline-none"
            />
            <p className="text-xs text-zinc-600">
              Demo wallet balance:{' '}
              {balance.data ? formatTokenAmount(balance.data.balance) : '…'}{' '}
              USDC
            </p>
            {onOpenDeposit && (
              <button
                type="button"
                className="text-xs font-semibold text-blue-800 underline"
                disabled={mutation.isPending}
                onClick={() => {
                  onClose();
                  onOpenDeposit();
                }}
              >
                Get test USDC
              </button>
            )}
            <p role="status" className="text-xs text-amber-900">
              {mutation.error?.message ??
                balance.error?.message ??
                (!valid
                  ? 'Enter a positive amount with at most six decimals.'
                  : wallet && balance.data && !available
                    ? 'Insufficient demo USDC balance.'
                    : '')}
            </p>
          </div>
        )
      }
      primaryButton={{
        label: mutation.isSuccess
          ? 'Go to My Portfolio →'
          : !wallet
            ? 'Connect Wallet to Continue'
            : `Invest ${amount || '—'} USDC`,
        onClick: mutation.isSuccess
          ? () => {
              onClose();
              onNavigatePortfolio?.();
            }
          : !wallet
            ? () => setVisible(true)
            : () => mutation.mutate(),
        isLoading: mutation.isPending,
        disabled: !mutation.isSuccess && !!wallet && (!valid || !available),
      }}
      secondaryButton={{
        label: mutation.isSuccess ? 'Done' : 'Cancel',
        onClick: onClose,
        disabled: mutation.isPending,
      }}
      footerNote="Demo USDC · Investment receipt saved"
    />
  );
}
