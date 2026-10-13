import { z } from 'zod';
import {
  tokenAmountInput,
  positiveU64Schema,
  treeSchema,
  invoiceReportSchema,
} from '../../lib/schemas';

export const spendLimit = (balance: string, remaining: string) => {
  const available = BigInt(balance);
  const funding = BigInt(remaining);
  return (available < funding ? available : funding).toString();
};
export const buySharesFormSchema = (balance: string, remaining: string) =>
  z.object({
    amount: tokenAmountInput()
      .refine(
        (value) => BigInt(value) <= BigInt(balance),
        'Insufficient EURTree balance',
      )
      .refine(
        (value) => BigInt(value) <= BigInt(remaining),
        'Amount exceeds remaining tree funding',
      ),
  });
export const faucetFormSchema = z.object({ amount: tokenAmountInput() });
export const publicActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('claimRewards'), tree: treeSchema }),
  z.object({ action: z.literal('giveMeMoney'), amount: positiveU64Schema }),
  z.object({
    action: z.literal('buyShares'),
    amount: positiveU64Schema,
    tree: treeSchema,
  }),
  z.object({
    action: z.literal('payInvoice'),
    amount: positiveU64Schema,
    tree: treeSchema,
    report: invoiceReportSchema,
  }),
]);
export type PublicAction = z.infer<typeof publicActionSchema>;
