import { expect, test } from 'bun:test';
import { mergeFundingPositions } from '../src/features/victron/funding-investments';
import { mergeDemoPayments } from '../src/features/victron/demo-payment-investments';
import type { PaymentReceipt } from '../src/features/fintech/moonpay';

test('confirmed USDC positions survive reload and combine with card allocations without duplicate credit', () => {
  const positions = [{ siteId: 219742, amountUsdc: 25, observedAt: 1000 }];
  const base = {
    219742: {
      amountUsdc: 0,
      investedAt: 900,
      lastClaimedAt: 950,
      totalClaimedUsdc: 2,
    },
  };
  const card: PaymentReceipt = {
    id: crypto.randomUUID(),
    wallet: 'wallet',
    siteId: 219742,
    amount: 20,
    currency: 'USD',
    status: 'completed',
    transactionId: 'provider-tx',
    completedAt: 1100,
    simulated: true,
    usdcAllocation: {
      amountUsdc: 20,
      rate: 1,
      rateDate: '2026-10-19',
      source: 'USD',
    },
  };
  const held = mergeDemoPayments(
    mergeFundingPositions(base, [...positions, ...positions]),
    [card, card],
  );
  expect(held[219742]).toMatchObject({
    amountUsdc: 45,
    onchainAmountUsdc: 25,
    demoFiatAmountUsdc: 20,
    totalClaimedUsdc: 2,
    lastClaimedAt: 950,
  });
  expect(
    mergeDemoPayments(mergeFundingPositions(base, positions), [card]),
  ).toEqual(held);
  expect(base[219742].amountUsdc).toBe(0);
  expect(mergeFundingPositions({}, positions)[219742].amountUsdc).toBe(25);
  expect(
    mergeFundingPositions({}, [{ ...positions[0], amountUsdc: 0 }]),
  ).toEqual({});
});
