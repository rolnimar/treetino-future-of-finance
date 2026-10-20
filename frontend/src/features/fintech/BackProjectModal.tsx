import { useCallback, useEffect, useRef, useState } from 'react';
import { MoonPayCheckout } from './MoonPayCheckout';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useConnectedWallet } from '../wallet/use-connected-wallet';
import {
  DEMO_PERSONAS,
  getPersonaConnectedWallet,
  setActivePersona,
} from '../wallet/demo-personas';
import { demoPost, investmentSchema } from '../devices/device-api';
import { APPLE_LOGO_PATH } from '../../lib/brand-marks';
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
    <FiatBacking {...props} onUseUsdc={() => setMethod('usdc')} />
  ) : (
    <UsdcBacking {...props} onUseCard={() => setMethod('card')} />
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
  const wallet = useConnectedWallet();
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
  const [expressBusy, setExpressBusy] = useState(false);
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
  useEffect(() => {
    activeOrderId.current = order?.id;
  }, [order?.id]);
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
    const initial = window.setTimeout(() => {
      void verify();
    }, 0);
    const timer = window.setInterval(() => {
      void verify();
    }, 10_000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, [order, receipt, verify]);

  const instantCardCheckout = async () => {
    if (busy || expressBusy || !validAmount) return;
    setExpressBusy(true);
    setMessage(null);
    try {
      let activeWallet = wallet;
      if (!activeWallet) {
        const alice =
          DEMO_PERSONAS.find((p) => p.id === 'investor-alice') ??
          DEMO_PERSONAS[0]!;
        setActivePersona(alice.id);
        activeWallet = getPersonaConnectedWallet(alice);
      }
      await new Promise((resolve) => window.setTimeout(resolve, 750));
      const invId = crypto.randomUUID();
      const txRef = `mp_applepay_express_${Date.now()}`;
      const recorded = await demoPost(
        activeWallet,
        `devices/${demo.siteId}/investments`,
        investmentSchema,
        {
          id: invId,
          amount: String(amountNum),
          memoReference: txRef,
        },
      );
      const moonpayFee = Number((amountNum * 0.015).toFixed(2));
      const networkFee = 0.25;
      const totalFees = Number((moonpayFee + networkFee).toFixed(2));
      const nowIso = new Date(recorded.createdAt).toISOString();
      const syntheticReceipt: PaymentReceipt = {
        id: recorded.id,
        wallet: activeWallet.address,
        siteId: demo.siteId,
        amount: amountNum,
        checkoutAmount: Number((amountNum + totalFees).toFixed(2)),
        currency: 'USD',
        status: 'completed',
        transactionId: txRef,
        completedAt: recorded.createdAt,
        simulated: true,
        settledAt: recorded.createdAt,
        paymentAmounts: {
          amountPaid: Number((amountNum + totalFees).toFixed(2)),
          moonpayFee,
          networkFee,
          extraFee: 0,
          totalFees,
          netInvested: amountNum,
        },
        usdcAllocation: {
          amountUsdc: amountNum,
          rate: 1,
          rateDate: nowIso.slice(0, 10),
          source: 'USD',
        },
      };
      setReceipt(syntheticReceipt);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['device-portfolio'] }),
        queryClient.invalidateQueries({ queryKey: ['device-catalog'] }),
        queryClient.invalidateQueries({ queryKey: ['wallet', 'usdc'] }),
      ]);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Could not complete instant card payment.',
      );
    } finally {
      setExpressBusy(false);
    }
  };

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
                disabled={busy || expressBusy}
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
                  disabled={!!order || busy || expressBusy}
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
              <button
                type="button"
                data-testid="instant-apple-pay-card-btn"
                disabled={busy || expressBusy || !validAmount}
                onClick={() => {
                  void instantCardCheckout();
                }}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-black text-[17px] font-medium tracking-[-0.01em] text-white shadow-[0_8px_24px_rgba(0,0,0,0.18)] transition hover:bg-zinc-900 active:scale-[0.99] disabled:opacity-50"
              >
                {expressBusy ? (
                  <span>Approving…</span>
                ) : (
                  <>
                    <svg
                      viewBox="0 0 24 24"
                      className="-mt-0.5 h-[18px] w-[18px]"
                      fill="currentColor"
                      aria-hidden
                    >
                      <path d={APPLE_LOGO_PATH} />
                    </svg>
                    <span>Pay</span>
                    <span className="mx-1 h-4 w-px bg-white/25" />
                    <span className="tabular-nums">
                      {validAmount
                        ? `$${amountNum.toLocaleString('en-US')}`
                        : '—'}
                    </span>
                  </>
                )}
              </button>
              <p className="-mt-1 text-center text-[11px] text-zinc-500">
                Card, Apple Pay or Google Pay · No account, no KYC
              </p>
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
