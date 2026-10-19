import { expect, test } from 'bun:test';
import { mergeDemoPayments } from '../src/features/victron/demo-payment-investments';
import type { PaymentReceipt } from '../src/features/fintech/moonpay';

const receipt: PaymentReceipt = {
  id: crypto.randomUUID(),
  wallet: 'wallet',
  siteId: 1,
  amount: 500,
  currency: 'USD',
  usdcAllocation: {
    amountUsdc: 500,
    rate: 1,
    rateDate: '2026-10-19',
    source: 'USD',
  },
  status: 'completed',
  transactionId: crypto.randomUUID(),
  completedAt: 1234,
  simulated: true,
};

test('verified fiat allocations survive refresh without duplicate credit or changing local holdings', () => {
  const base = {
    1: {
      amountUsdc: 100,
      investedAt: 1000,
      lastClaimedAt: 1000,
      totalClaimedUsdc: 5,
    },
  };
  const once = mergeDemoPayments(base, [receipt]);
  expect(mergeDemoPayments(base, [receipt, receipt])).toEqual(once);
  expect(mergeDemoPayments(base, [receipt])).toEqual(once);
  expect(once[1]).toMatchObject({
    amountUsdc: 600,
    demoFiatAmountUsdc: 500,
    investedAt: 1000,
    totalClaimedUsdc: 5,
  });
  expect(base[1].amountUsdc).toBe(100);
  expect(mergeDemoPayments({}, [receipt])[1].amountUsdc).toBe(500);
});

test('failed, pending and incomplete receipts add no holding', () => {
  for (const change of [
    { status: 'failed' as const },
    { status: 'pending' as const },
    { transactionId: null },
    { completedAt: null },
    { usdcAllocation: null },
  ]) {
    expect(mergeDemoPayments({}, [{ ...receipt, ...change }])).toEqual({});
  }
});

test('portfolio counts net principal and shows paid amount and fees separately', () => {
  const paid: PaymentReceipt = {
    ...receipt,
    amount: 95.72,
    usdcAllocation: {
      amountUsdc: 95.72,
      rate: 1,
      rateDate: '2026-10-19',
      source: 'USD',
    },
    checkoutAmount: 100,
    paymentAmounts: {
      amountPaid: 100,
      totalFees: 4.28,
      netInvested: 95.72,
      moonpayFee: 3.99,
      networkFee: 0.29,
      extraFee: 0,
    },
  };
  expect(mergeDemoPayments({}, [paid, paid])[1]).toMatchObject({
    amountUsdc: 95.72,
    demoFiatAmountUsdc: 95.72,
    demoFiatPaidUsdc: 100,
    demoFiatFeesUsdc: 4.28,
  });
});
