import type { InvestmentsMap } from './use-victron-investments';
import type { PaymentReceipt } from '../fintech/moonpay';

// Only completed, backend-verified sandbox payments contribute to demo allocations.
export function mergeDemoPayments(
  base: InvestmentsMap,
  receipts: PaymentReceipt[],
): InvestmentsMap {
  const result = { ...base };
  const seen = new Set<string>();
  for (const receipt of receipts) {
    if (
      receipt.status !== 'completed' ||
      !receipt.transactionId ||
      !receipt.completedAt ||
      !receipt.usdcAllocation ||
      seen.has(receipt.id)
    )
      continue;
    seen.add(receipt.id);
    const allocation = receipt.usdcAllocation;
    const existing = result[receipt.siteId];
    result[receipt.siteId] = {
      ...existing,
      amountUsdc: (existing?.amountUsdc ?? 0) + allocation.amountUsdc,
      investedAt: existing?.investedAt ?? receipt.completedAt,
      lastClaimedAt: existing?.lastClaimedAt ?? receipt.completedAt,
      totalClaimedUsdc: existing?.totalClaimedUsdc ?? 0,
      demoFiatAmountUsdc:
        (existing?.demoFiatAmountUsdc ?? 0) + allocation.amountUsdc,
      demoFiatFeesUsdc:
        (existing?.demoFiatFeesUsdc ?? 0) +
        (receipt.paymentAmounts?.totalFees ?? 0) * allocation.rate,
      demoFiatPaidUsdc:
        (existing?.demoFiatPaidUsdc ?? 0) +
        (receipt.paymentAmounts?.amountPaid ?? receipt.amount) *
          allocation.rate,
    };
  }
  return result;
}
