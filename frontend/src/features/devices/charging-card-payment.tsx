import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import type { ConnectedWallet } from '../../chain/wallet';
import { MoonPayCheckout } from '../fintech/MoonPayCheckout';
import {
  paymentOrderSchema,
  cancelPayment,
  verifyPayment,
  prepareCheckout,
  fetchPaymentQuote,
  type PaymentOrder,
  type PaymentReceipt,
} from '../fintech/moonpay';
import { demoPost, type ChargingSession } from './device-api';

const statusSchema = z.object({ order: paymentOrderSchema.nullable() });
const usd = (value: number) =>
  value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

export function ChargingCardPayment({
  wallet,
  session,
  onLockedChange,
}: {
  wallet: ConnectedWallet;
  session: ChargingSession;
  onLockedChange: (locked: boolean) => void;
}) {
  const client = useQueryClient();
  const key = ['charging-card-order', session.id, wallet.address];
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [checkout, setCheckout] = useState<{
    order: PaymentOrder;
    trackingId: string | null;
    allowedIpAddress: string;
  } | null>(null);
  const checking = useRef(false);
  const status = useQuery({
    queryKey: key,
    queryFn: () =>
      demoPost(
        wallet,
        `payments/moonpay/charging/${session.id}/status`,
        statusSchema,
        {},
      ),
    refetchInterval: 5000,
    retry: false,
  });
  const order = status.data?.order;
  const open =
    !!order && (order.status === 'pending' || order.status === 'failed');
  useEffect(() => {
    onLockedChange(busy || open || status.isPending || status.isError);
    return () => onLockedChange(false);
  }, [busy, open, status.isPending, status.isError, onLockedChange]);
  const refresh = useCallback(async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ['charging-session'] }),
      client.invalidateQueries({ queryKey: ['wallet', 'usdc'] }),
      client.invalidateQueries({ queryKey: ['device-portfolio'] }),
      client.invalidateQueries({ queryKey: ['device-catalog'] }),
    ]);
  }, [client]);
  const accept = useCallback(
    async (result: PaymentReceipt, previous: PaymentOrder) => {
      client.setQueryData(['charging-card-order', session.id, wallet.address], {
        order: { ...previous, ...result },
      });
      if (result.status === 'completed') {
        setCheckout(null);
        await refresh();
        const latest = client.getQueryData<ChargingSession>([
          'charging-session',
          session.siteId,
          wallet.address,
        ]);
        setMessage(
          latest?.status === 'paid'
            ? 'MoonPay payment confirmed. Your charging bill is paid and the remaining funds are in your demo balance.'
            : 'MoonPay payment confirmed and funds credited to your demo balance. The final fees left too little to pay this bill. Add funds or make another card purchase to finish payment.',
        );
      } else if (result.status === 'cancelled') {
        setCheckout(null);
        setMessage(
          'Card checkout cancelled. You can pay with USDC or start another card checkout.',
        );
      } else if (result.status === 'failed') {
        setMessage(
          'MoonPay could not complete this payment. Cancel this checkout before retrying.',
        );
      } else if (result.transactionId) {
        setMessage(
          'MoonPay is processing your card payment. Do not pay again.',
        );
      } else {
        setMessage(
          'No card payment has been submitted. Resume checkout or cancel it to use USDC.',
        );
      }
    },
    [client, session.id, session.siteId, wallet.address, refresh],
  );
  useEffect(() => {
    if (order?.status === 'completed') void refresh();
  }, [order?.status, refresh]);
  const verify = useCallback(async () => {
    if (!order || checking.current) return;
    checking.current = true;
    try {
      await accept(await verifyPayment(order.id), order);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Could not verify card payment.',
      );
    } finally {
      checking.current = false;
    }
  }, [order, accept]);
  const quote = useQuery({
    queryKey: ['moonpay-quote', order?.checkoutAmount],
    queryFn: () => fetchPaymentQuote(order!.checkoutAmount!),
    enabled: open && !!order?.checkoutAmount,
    staleTime: 30000,
    retry: false,
  });
  const create = async () => {
    if (busy) return;
    setBusy(true);
    setMessage('');
    try {
      const next = await demoPost(
        wallet,
        `payments/moonpay/charging/${session.id}/orders`,
        paymentOrderSchema,
        {},
      );
      client.setQueryData(key, { order: next });
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Could not prepare card checkout.',
      );
    } finally {
      setBusy(false);
    }
  };
  const begin = async () => {
    if (!order || busy) return;
    setBusy(true);
    setMessage('');
    try {
      const receipt = await verifyPayment(order.id);
      await accept(receipt, order);
      if (receipt.status !== 'pending') return;
      const prepared = receipt.transactionId
        ? { allowedIpAddress: '' }
        : await prepareCheckout(order.id);
      setCheckout({
        order,
        trackingId: receipt.transactionId,
        allowedIpAddress: prepared.allowedIpAddress,
      });
      setMessage('');
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Could not open MoonPay checkout.',
      );
    } finally {
      setBusy(false);
    }
  };
  const cancel = async () => {
    if (!order || busy) return;
    setBusy(true);
    setMessage('');
    try {
      await accept(await cancelPayment(order.id), order);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Could not cancel card checkout.',
      );
    } finally {
      setBusy(false);
    }
  };
  const close = useCallback(() => setCheckout(null), []);
  const reportError = useCallback((value: string) => setMessage(value), []);
  return (
    <div className="space-y-3 rounded-2xl border border-violet-100 bg-violet-50/50 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Pay by card</h3>
        <span className="text-xs text-violet-800">MoonPay · Sandbox</span>
      </div>
      {status.error && (
        <p role="alert" className="text-xs text-red-800">
          {status.error.message}{' '}
          <button onClick={() => void status.refetch()} className="underline">
            Retry payment status
          </button>
        </p>
      )}
      {(message ||
        (order?.status === 'completed' &&
          'Card funds were credited, but this bill is still unpaid. Pay from your demo balance or add more card funds.')) && (
        <p role="status" className="text-xs leading-relaxed text-violet-900">
          {message ||
            'Card funds were credited, but this bill is still unpaid. Pay from your demo balance or add more card funds.'}
        </p>
      )}
      {open ? (
        <>
          <dl className="space-y-2 text-xs">
            <div className="flex justify-between">
              <dt>Charging bill</dt>
              <dd>{usd(session.amountUsdc)}</dd>
            </div>
            <div className="flex justify-between font-semibold">
              <dt>Card checkout total</dt>
              <dd>{usd(order.checkoutAmount ?? order.amount)}</dd>
            </div>
            {quote.data && (
              <>
                <div className="flex justify-between">
                  <dt>Estimated MoonPay & network fees</dt>
                  <dd>{usd(quote.data.totalFees)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Estimated balance left after charging</dt>
                  <dd>
                    {Math.max(
                      0,
                      quote.data.netInvested - session.amountUsdc,
                    ).toFixed(2)}{' '}
                    demo USDC
                  </dd>
                </div>
              </>
            )}
          </dl>
          <p className="text-xs leading-relaxed text-zinc-600">
            The minimum card purchase may exceed your bill. MoonPay buys test
            SOL; its net USD allocation funds your demo USDC balance. This bill
            is paid automatically and the remainder stays in your balance. Final
            fees appear in checkout.
          </p>
          {quote.error && (
            <p className="text-xs text-zinc-500">
              Fee estimate unavailable. Check the final fees in MoonPay.
            </p>
          )}
          <button
            disabled={busy || status.isFetching}
            onClick={() => void begin()}
            className="w-full rounded-xl bg-violet-700 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy
              ? 'Preparing…'
              : order.transactionId
                ? 'View MoonPay payment status'
                : 'Continue to MoonPay'}
          </button>
          <div className="flex gap-3 text-xs">
            <button
              disabled={busy}
              onClick={() => void cancel()}
              className="flex-1 rounded-xl border bg-white p-3 disabled:opacity-50"
            >
              Cancel card checkout
            </button>
            <button
              disabled={busy}
              onClick={() => void verify()}
              className="flex-1 rounded-xl border bg-white p-3 disabled:opacity-50"
            >
              Check payment status
            </button>
          </div>
        </>
      ) : (
        <button
          disabled={busy || status.isPending || status.isError}
          onClick={() => void create()}
          className="w-full rounded-xl bg-violet-700 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? 'Preparing card checkout…' : 'Pay by card with MoonPay'}
        </button>
      )}
      <p className="text-[11px] text-zinc-500">
        Test mode · Use MoonPay sandbox details. No real money is charged.
      </p>
      {checkout && (
        <MoonPayCheckout
          order={checkout.order}
          trackingId={checkout.trackingId}
          allowedIpAddress={checkout.allowedIpAddress}
          onVerify={verify}
          onClose={close}
          onError={reportError}
        />
      )}
    </div>
  );
}
