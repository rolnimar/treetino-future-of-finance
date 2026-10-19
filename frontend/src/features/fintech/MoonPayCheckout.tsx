import { memo, useCallback, useEffect } from 'react';
import {
  MoonPayBuyWidget,
  MoonPayProvider,
  MoonPayTransactionTrackerWidget,
} from '@moonpay/moonpay-react';
import { signCheckout, type PaymentOrder } from './moonpay';

// Keep SDK props stable while the backing dialog polls for settlement.
export const MoonPayCheckout = memo(function MoonPayCheckout({
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
