import { z } from 'zod';
import { api, jsonBody } from '../../lib/api';

export const paymentAmountsSchema = z.object({
  amountPaid: z.number().nonnegative(),
  moonpayFee: z.number().nonnegative(),
  networkFee: z.number().nonnegative(),
  extraFee: z.number().nonnegative(),
  totalFees: z.number().nonnegative(),
  netInvested: z.number().positive(),
});
export type PaymentAmounts = z.infer<typeof paymentAmountsSchema>;

export const paymentReceiptSchema = z.object({
  id: z.string().uuid(),
  wallet: z.string(),
  siteId: z.number().int(),
  amount: z.number().positive(),
  checkoutAmount: z.number().positive().optional(),
  paymentAmounts: paymentAmountsSchema.nullable().optional(),
  currency: z.literal('USD'),
  usdcAllocation: z
    .object({
      amountUsdc: z.number().positive(),
      rate: z.number().positive(),
      rateDate: z.string(),
      source: z.literal('USD'),
    })
    .nullable()
    .optional(),
  status: z.enum(['pending', 'completed', 'failed', 'cancelled']),
  transactionId: z.string().nullable(),
  completedAt: z.number().nullable(),
  simulated: z.literal(true),
  chargingSessionId: z.string().uuid().nullable().optional(),
  settledAt: z.number().nullable().optional(),
});
export const paymentOrderSchema = paymentReceiptSchema.extend({
  publicKey: z.string().startsWith('pk_test_'),
});
export type PaymentReceipt = z.infer<typeof paymentReceiptSchema>;
export type PaymentOrder = z.infer<typeof paymentOrderSchema>;

export const fetchPaymentQuote = (amount: number) =>
  api('payments/moonpay/quote', paymentAmountsSchema, jsonBody({ amount }));

export const createPayment = (wallet: string, siteId: number, amount: number) =>
  api(
    'payments/moonpay/orders',
    paymentOrderSchema,
    jsonBody({ wallet, siteId, amount }),
  );
export const verifyPayment = (id: string) =>
  api(
    `payments/moonpay/orders/${id}/verify`,
    paymentReceiptSchema,
    jsonBody({}),
  );
export const cancelPayment = (id: string) =>
  api(
    `payments/moonpay/orders/${id}/cancel`,
    paymentReceiptSchema,
    jsonBody({}),
  );
export const prepareCheckout = (id: string) =>
  api(
    `payments/moonpay/orders/${id}/checkout`,
    z.object({ allowedIpAddress: z.string() }),
    jsonBody({}),
  );
export const signCheckout = async (id: string, url: string) =>
  (
    await api(
      `payments/moonpay/orders/${id}/sign`,
      z.object({ signature: z.string() }),
      jsonBody({ url }),
    )
  ).signature;
export const fetchPaymentReceipts = (wallet: string) =>
  api(
    `payments/moonpay/receipts?wallet=${encodeURIComponent(wallet)}`,
    z.array(paymentReceiptSchema),
  );

export function readPendingPayment(
  wallet: string,
  siteId: number,
): PaymentOrder | null {
  try {
    const parsed = paymentOrderSchema.safeParse(
      JSON.parse(
        localStorage.getItem(`moonpay_order_${wallet}_${siteId}`) ?? 'null',
      ),
    );
    return parsed.success &&
      parsed.data.wallet === wallet &&
      parsed.data.siteId === siteId &&
      parsed.data.status === 'pending'
      ? parsed.data
      : null;
  } catch {
    return null;
  }
}
export function savePendingPayment(order: PaymentOrder) {
  localStorage.setItem(
    `moonpay_order_${order.wallet}_${order.siteId}`,
    JSON.stringify(order),
  );
}
export function clearPendingPayment(order: PaymentOrder) {
  localStorage.removeItem(`moonpay_order_${order.wallet}_${order.siteId}`);
}
