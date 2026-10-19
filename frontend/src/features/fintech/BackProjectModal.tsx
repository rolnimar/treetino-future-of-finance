import { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  MoonPayBuyWidget,
  MoonPayProvider,
  MoonPayTransactionTrackerWidget,
} from '@moonpay/moonpay-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useConnectedWallet } from '../wallet/use-connected-wallet';
import type { VictronDemoItem } from '../victron/victron-types';
import { getCampaignCoverImage } from '../victron/campaign-helpers';
import { CheckIcon } from '../victron/victron-icons';
import { UniversalPopup } from './UniversalPopup';
import { PaymentMethodSwitch } from './PaymentMethodSwitch';
import { UsdcBacking } from './UsdcBacking';
import {
  clearPendingPayment,
  cancelPayment,
  createPayment,
  readPendingPayment,
  savePendingPayment,
  signCheckout,
  prepareCheckout,
  fetchPaymentQuote,
  verifyPayment,
  type PaymentOrder,
  type PaymentReceipt,
  type PaymentAmounts,
} from './moonpay';

interface BackProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  demo: VictronDemoItem | null;
  walletBalance?: string;
  onOpenDeposit?: () => void;
  onNavigatePortfolio?: () => void;
}

export function BackProjectModal(props: BackProjectModalProps) {
  const wallet = useConnectedWallet();
  if (!props.isOpen || !props.demo) return null;
  return (
    <Backing
      key={props.demo.siteId}
      {...props}
      demo={props.demo}
      walletAddress={wallet?.address}
    />
  );
}

function Backing(
  props: BackProjectModalProps & {
    demo: VictronDemoItem;
    walletAddress?: string;
  },
) {
  const [method, setMethod] = useState<'card' | 'usdc'>('card');
  return method === 'card' ? (
    <FiatBacking
      key={props.walletAddress ?? 'guest'}
      {...props}
      onUseUsdc={() => setMethod('usdc')}
    />
  ) : (
    <UsdcBacking
      key={props.walletAddress ?? 'guest'}
      {...props}
      onUseCard={() => setMethod('card')}
    />
  );
}

function FiatBacking({
  demo,
  onClose,
  onNavigatePortfolio,
  walletAddress,
  onUseUsdc,
}: BackProjectModalProps & {
  demo: VictronDemoItem;
  walletAddress?: string;
  onUseUsdc: () => void;
}) {
  const { setVisible: openWalletModal } = useWalletModal();
  const queryClient = useQueryClient();
  const [order, setOrder] = useState<PaymentOrder | null>(() =>
    walletAddress ? readPendingPayment(walletAddress, demo.siteId) : null,
  );
  const [amount, setAmount] = useState(() =>
    String(order?.checkoutAmount ?? order?.amount ?? 500),
  );
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [allowedIpAddress, setAllowedIpAddress] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);
  const [trackingId, setTrackingId] = useState<string | null>(
    order?.transactionId ?? null,
  );
  const [checkoutTrackingId, setCheckoutTrackingId] = useState<string | null>(
    null,
  );
  const [quoteAmount, setQuoteAmount] = useState<number | null>(null);
  const checking = useRef(false);
  const activeOrderId = useRef(order?.id);
  activeOrderId.current = order?.id;
  const closeCheckout = useCallback(() => setCheckoutVisible(false), []);
  const amountNum = Number(amount);
  const validAmount =
    Number.isFinite(amountNum) &&
    amountNum >= 20 &&
    amountNum <= 5000 &&
    Math.abs(amountNum * 100 - Math.round(amountNum * 100)) < 0.000001;

  useEffect(() => {
    const timer = window.setTimeout(
      () => setQuoteAmount(validAmount ? amountNum : null),
      400,
    );
    return () => window.clearTimeout(timer);
  }, [amountNum, validAmount]);
  const quote = useQuery({
    queryKey: ['moonpay-quote', quoteAmount],
    queryFn: () => fetchPaymentQuote(quoteAmount!),
    enabled:
      quoteAmount !== null && !receipt && (!order || order.currency === 'USD'),
    staleTime: 30_000,
  });

  const complete = useCallback(
    async (result: PaymentReceipt, currentOrder: PaymentOrder) => {
      setReceipt(result);
      setCheckoutVisible(false);
      clearPendingPayment(currentOrder);
      await queryClient.invalidateQueries({
        queryKey: ['moonpay-receipts', currentOrder.wallet],
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['device-portfolio'] }),
        queryClient.invalidateQueries({ queryKey: ['device-catalog'] }),
      ]);
    },
    [queryClient],
  );

  const verify = useCallback(async () => {
    if (!order || checking.current) return;
    checking.current = true;
    try {
      const result = await verifyPayment(order.id);
      if (activeOrderId.current !== order.id) return;
      if (result.status === 'completed') {
        await complete(result, order);
      } else if (result.status === 'cancelled') {
        clearPendingPayment(order);
        activeOrderId.current = undefined;
        setOrder(null);
        setTrackingId(null);
        setMessage(
          'Card checkout cancelled. Choose a payment method or enter a new amount.',
        );
      } else if (result.status === 'failed') {
        setMessage(
          'Your payment was unsuccessful. No allocation was recorded. Please try again.',
        );
      } else {
        setTrackingId(result.transactionId);
        if (result.transactionId)
          savePendingPayment({ ...order, transactionId: result.transactionId });
        setMessage(
          result.transactionId
            ? 'MoonPay is processing your existing payment. You do not need to pay again. View its status or check again shortly.'
            : 'No completed payment has been found yet. If you already paid, check its status again before retrying checkout.',
        );
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Could not verify payment. Please retry.',
      );
    } finally {
      checking.current = false;
    }
  }, [order, complete]);

  const cancelCurrentOrder = async () => {
    if (busy) return false;
    if (!order) return true;
    setBusy(true);
    try {
      const result = await cancelPayment(order.id);
      if (result.status === 'completed') {
        await complete(result, order);
        return false;
      }
      clearPendingPayment(order);
      activeOrderId.current = undefined;
      setOrder(null);
      setTrackingId(null);
      setCheckoutTrackingId(null);
      setCheckoutVisible(false);
      setMessage(
        'Card checkout cancelled. Choose a payment method or enter a new amount.',
      );
      return true;
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Could not cancel checkout. Check payment status before trying again.',
      );
      return false;
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!order || receipt) return;
    void verify();
    const timer = window.setInterval(() => {
      void verify();
    }, 10_000);
    return () => window.clearInterval(timer);
  }, [order, receipt, verify]);

  const beginCheckout = async () => {
    if (!walletAddress) {
      openWalletModal(true);
      return;
    }
    if (busy || !validAmount) return;
    setBusy(true);
    setMessage(null);
    try {
      let currentOrder = order;
      // Recover a paid order before opening any screen that could take another payment.
      if (currentOrder) {
        const result = await verifyPayment(currentOrder.id);
        if (result.status === 'completed') {
          await complete(result, currentOrder);
          return;
        }
        if (result.status === 'pending' && result.transactionId) {
          setTrackingId(result.transactionId);
          setCheckoutTrackingId(result.transactionId);
          savePendingPayment({
            ...currentOrder,
            transactionId: result.transactionId,
          });
          setCheckoutVisible(true);
          return;
        }
        setTrackingId(null);
        setCheckoutTrackingId(null);
      }
      if (!currentOrder) {
        const created = await createPayment(
          walletAddress,
          demo.siteId,
          amountNum,
        );
        // Save before opening so reloads can resume payment verification.
        savePendingPayment(created);
        setOrder(created);
        currentOrder = created;
      }
      const checkout = await prepareCheckout(currentOrder.id);
      setAllowedIpAddress(checkout.allowedIpAddress);
      setCheckoutVisible(true);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Could not open checkout.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <UniversalPopup
        isOpen={!checkoutVisible}
        onClose={onClose}
        dark={false}
        icon={
          receipt ? (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-white">
              <CheckIcon className="h-8 w-8" />
            </div>
          ) : (
            <img
              src={getCampaignCoverImage(demo.key)}
              alt=""
              className="h-16 w-16 rounded-full object-cover"
            />
          )
        }
        tag={receipt ? 'PAYMENT CONFIRMED' : 'BACK CLEAN ENERGY'}
        title={
          receipt ? 'Your test allocation is recorded' : `Back ${demo.title}`
        }
        description={
          receipt
            ? `Your sandbox payment for ${demo.title} is confirmed. Your test allocation is available in your portfolio.`
            : 'Pay by card through MoonPay. Checkout delivers devnet SOL to your wallet and records a test allocation in USDC.'
        }
        mainPoint={
          receipt ? (
            <div className="space-y-3 text-sm">
              <p className="text-center text-3xl font-bold">
                {receipt.usdcAllocation?.amountUsdc.toLocaleString()} USDC
              </p>
              <p className="text-center text-xs text-zinc-500">
                Allocated to {demo.title}
              </p>
              {receipt.paymentAmounts && (
                <PaymentBreakdown
                  amounts={receipt.paymentAmounts}
                  currency={receipt.currency}
                  allocation={receipt.usdcAllocation?.amountUsdc}
                />
              )}
              <div className="space-y-2 text-xs text-zinc-600">
                <p>✓ Sandbox payment verified</p>
                <p>✓ Test allocation recorded</p>
                <p>✓ Available in your portfolio</p>
              </div>
              <details className="text-xs text-zinc-500">
                <summary className="cursor-pointer">Receipt details</summary>
                <p className="mt-2 break-all">
                  Payment reference: {receipt.transactionId}
                </p>
                <p className="mt-1 break-all">
                  Allocation reference: {receipt.id}
                </p>
              </details>
            </div>
          ) : (
            <div className="space-y-4">
              <PaymentMethodSwitch
                method="card"
                disabled={busy}
                onChange={(method) => {
                  if (method === 'usdc')
                    void (async () => {
                      if (await cancelCurrentOrder()) onUseUsdc();
                    })();
                }}
              />
              <label
                htmlFor="back-amount-input"
                className="block text-xs text-zinc-600"
              >
                Total card payment (USD)
              </label>
              <div className="flex items-center gap-2 border-b border-zinc-200 pb-3">
                <span className="text-xl text-zinc-400">
                  {order?.currency ?? 'USD'}
                </span>
                <input
                  id="back-amount-input"
                  type="number"
                  min="20"
                  max="5000"
                  step="0.01"
                  value={amount}
                  disabled={!!order || busy}
                  onChange={(event) => setAmount(event.target.value)}
                  className="w-full bg-transparent text-3xl font-bold outline-none"
                />
              </div>
              {!order && (
                <div className="flex gap-2">
                  {[100, 500, 1000].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setAmount(String(value))}
                      className="flex-1 rounded-lg border border-zinc-200 p-2 text-xs"
                    >
                      USD {value}
                    </button>
                  ))}
                </div>
              )}
              {(!order || order.currency === 'USD') &&
              quoteAmount === amountNum &&
              quote.data ? (
                <PaymentBreakdown amounts={quote.data} estimated />
              ) : (
                <p className="text-xs text-zinc-500">
                  {quote.isError
                    ? 'Fee estimate unavailable. MoonPay will show final fees before payment.'
                    : validAmount
                      ? 'Loading MoonPay fee estimate…'
                      : 'Enter between USD 20 and USD 5,000.'}
                </p>
              )}
              <div className="space-y-2 text-xs text-zinc-600">
                <p>1. Choose your contribution</p>
                <p>2. Complete secure checkout</p>
                <p>3. View your allocation in your portfolio</p>
              </div>
              {order && (
                <button
                  type="button"
                  onClick={() => {
                    void verify();
                  }}
                  className="text-xs font-semibold text-[#183d89] underline"
                >
                  Check payment status
                </button>
              )}
              {message && (
                <p
                  role="status"
                  className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900"
                >
                  {message}
                </p>
              )}
            </div>
          )
        }
        primaryButton={{
          label: receipt
            ? 'Go to My Portfolio →'
            : !walletAddress
              ? 'Connect Wallet to Continue'
              : order
                ? trackingId
                  ? 'View Payment Status'
                  : 'Resume MoonPay Checkout'
                : `Pay USD ${validAmount ? amountNum.toLocaleString() : '—'} with Card`,
          onClick: receipt
            ? () => {
                onClose();
                onNavigatePortfolio?.();
              }
            : () => {
                void beginCheckout();
              },
          isLoading: busy,
          disabled: !receipt && !validAmount,
        }}
        secondaryButton={{
          label: receipt ? 'Done' : order ? 'Cancel card checkout' : 'Close',
          onClick:
            order && !receipt
              ? () => {
                  void cancelCurrentOrder();
                }
              : onClose,
          disabled: busy,
        }}
        footerNote="Test mode · Payments and allocations are simulated"
      />
      {order && checkoutVisible && !receipt && (
        <MoonPayCheckout
          order={order}
          trackingId={checkoutTrackingId}
          allowedIpAddress={allowedIpAddress}
          onVerify={verify}
          onClose={closeCheckout}
          onError={setMessage}
        />
      )}
    </>
  );
}

// Keep SDK props stable while the backing dialog polls for settlement.
const MoonPayCheckout = memo(function MoonPayCheckout({
  order,
  trackingId,
  allowedIpAddress,
  onVerify,
  onClose,
  onError,
}: {
  order: PaymentOrder;
  trackingId: string | null;
  allowedIpAddress: string;
  onVerify: () => Promise<void>;
  onClose: () => void;
  onError: (message: string) => void;
}) {
  const sign = useCallback(
    async (url: string) => {
      try {
        return await signCheckout(order.id, url);
      } catch (error) {
        onError(
          error instanceof Error ? error.message : 'Checkout signing failed.',
        );
        onClose();
        throw error;
      }
    },
    [order.id, onError, onClose],
  );
  const close = useCallback(async () => {
    onClose();
    await onVerify();
  }, [onClose, onVerify]);
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') void close();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [close]);
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/80 p-3"
      role="dialog"
      aria-modal="true"
      aria-label="Secure payment checkout"
    >
      <div className="w-full max-w-[440px] overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-200 p-3 text-xs">
          <span>Secure checkout · MoonPay</span>
          <button
            type="button"
            onClick={() => {
              void close();
            }}
            className="rounded-lg border border-zinc-200 px-3 py-1.5"
          >
            Close checkout
          </button>
        </div>
        <MoonPayProvider apiKey={order.publicKey}>
          {trackingId ? (
            <MoonPayTransactionTrackerWidget
              variant="embedded"
              visible
              transactionId={trackingId}
              style={{
                width: '100%',
                height: 'min(720px, 80vh)',
                margin: 0,
                border: 0,
                borderRadius: 0,
              }}
              onTransactionCompleted={onVerify}
              onClose={close}
            />
          ) : (
            <MoonPayBuyWidget
              variant="embedded"
              visible
              style={{
                width: '100%',
                height: 'min(720px, 80vh)',
                margin: 0,
                border: 0,
                borderRadius: 0,
              }}
              currencyCode="sol"
              baseCurrencyCode={order.currency.toLowerCase()}
              baseCurrencyAmount={String(order.checkoutAmount ?? order.amount)}
              walletAddress={order.wallet}
              externalTransactionId={order.id}
              lockAmount="true"
              allowedIpAddress={allowedIpAddress}
              onUrlSignatureRequested={sign}
              onTransactionCreated={onVerify}
              onTransactionCompleted={onVerify}
              onClose={close}
            />
          )}
        </MoonPayProvider>
      </div>
    </div>
  );
});

function PaymentBreakdown({
  amounts,
  estimated = false,
  currency = 'USD',
  allocation,
}: {
  amounts: PaymentAmounts;
  estimated?: boolean;
  currency?: 'USD';
  allocation?: number;
}) {
  const money = (amount: number) => `${amount.toFixed(2)} ${currency}`;
  return (
    <div
      className="space-y-2 border-y border-zinc-200 py-3 text-xs"
      aria-label={
        estimated
          ? 'Estimated payment breakdown'
          : 'Confirmed payment breakdown'
      }
    >
      <div className="flex justify-between">
        <span>Total paid{estimated ? ' (estimated)' : ''}</span>
        <strong>{money(amounts.amountPaid)}</strong>
      </div>
      <div className="flex justify-between">
        <span>MoonPay & network fees</span>
        <strong>{money(amounts.totalFees)}</strong>
      </div>
      <p className="text-[10px] text-zinc-500">
        MoonPay {money(amounts.moonpayFee)} · Network{' '}
        {money(amounts.networkFee)}
        {amounts.extraFee > 0
          ? ` · Additional fee ${money(amounts.extraFee)}`
          : ''}
      </p>
      <div className="flex justify-between font-semibold text-emerald-700">
        <span>{estimated ? 'Estimated allocation' : 'Net allocated'}</span>
        <strong>
          {allocation !== undefined
            ? `${allocation.toFixed(2)} USDC`
            : `${amounts.netInvested.toFixed(2)} USDC`}
        </strong>
      </div>
      {estimated && (
        <p className="text-[10px] text-zinc-500">
          Card-payment estimate. Final fees are confirmed in MoonPay checkout
          and may vary by payment method.
        </p>
      )}
    </div>
  );
}
