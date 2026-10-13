import { z } from 'zod';
import bs58 from 'bs58';
import type { TreeInfo } from '@treetino/contracts';
import { parseTokenAmount } from '../chain/amounts';
export const addressSchema = z
  .string()
  .min(32)
  .max(44)
  .refine((value) => {
    try {
      return bs58.decode(value).length === 32;
    } catch {
      return false;
    }
  }, 'Enter a valid Solana address');
export const walletSchema = addressSchema.refine(
  (value) => value !== '11111111111111111111111111111111',
  'The zero address cannot be used',
);
export const u64Schema = z
  .string()
  .regex(/^(0|[1-9][0-9]{0,19})$/, 'Enter a whole number')
  .refine(
    (value) =>
      /^(0|[1-9][0-9]{0,19})$/.test(value) &&
      BigInt(value) <= 18446744073709551615n,
    'Value exceeds u64',
  );
export const positiveU64Schema = u64Schema.refine(
  (value) => value !== '0',
  'Must be greater than zero',
);
/** Converts human EURTree input into exact six-decimal base units. */
export const tokenAmountInput = (zero = false) =>
  z
    .string()
    .trim()
    .superRefine((value, ctx) => {
      try {
        parseTokenAmount(value, zero);
      } catch (error) {
        ctx.addIssue({
          code: 'custom',
          message: error instanceof Error ? error.message : 'Invalid amount',
        });
      }
    })
    .transform((value) => parseTokenAmount(value, zero));
export const phaseSchema = z.enum(['funding', 'funded', 'purchased', 'active']);
export const treeSchema = z.object({
  id: z.uuid(),
  address: addressSchema,
  treeId: u64Schema,
  creator: addressSchema,
  supplier: addressSchema,
  client: addressSchema,
  reporter: addressSchema,
  paymentMint: addressSchema,
  shareMint: addressSchema,
  fundingTokenAccount: addressSchema,
  target: u64Schema,
  raised: u64Schema,
  remaining: u64Schema,
  phase: phaseSchema,
  canBuy: z.boolean(),
  updatedAt: z.iso.datetime(),
  signature: z.string(),
}) satisfies z.ZodType<TreeInfo>;
export const treesResponseSchema = z.object({
  trees: z.array(treeSchema),
  total: z.number().int().nonnegative(),
});
export const adminSchema = z.object({ id: z.uuid(), wallet: walletSchema });
export const challengeSchema = z.object({
  id: z.uuid(),
  message: z.string().min(1),
  expiresAt: z.iso.datetime(),
});
export const sessionSchema = z.object({
  accessToken: z.string().min(1),
  expiresAt: z.iso.datetime(),
  admin: adminSchema,
});
export const protocolSchema = z.object({
  name: z.literal('treetino'),
  network: z.literal('devnet'),
  programId: addressSchema,
});
export const campaignDossierSchema = z.object({
  id: z.string(),
  treeAddress: z.string(),
  treeId: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  category: z.string(),
  categoryBadge: z.string(),
  narrative: z.string(),
  story: z.string().optional(),
  investorHighlight: z.string().optional(),
  victronSiteId: z.number().optional(),
  city: z.string(),
  country: z.string(),
  projectedApy: z.string(),
  tariffRate: z.string(),
  offTakerName: z.string(),
  offTakerDescription: z.string().optional(),
  supplierName: z.string().optional(),
  targetUsdc: z.string(),
  raisedUsdc: z.string().optional(),
  phase: phaseSchema.optional(),
  canBuy: z.boolean().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});
export const campaignsResponseSchema = z.object({
  campaigns: z.array(campaignDossierSchema),
  total: z.number(),
});
export type IndexedTree = z.infer<typeof treeSchema>;
export type AdminSession = z.infer<typeof sessionSchema>;
export const clientSchema = z.object({ wallet: walletSchema });
export const clientSessionSchema = z.object({
  accessToken: z.string().min(1),
  expiresAt: z.iso.datetime(),
  client: clientSchema,
});
export type ClientSession = z.infer<typeof clientSessionSchema>;

export const mockReportResultSchema = z.object({
  status: z.enum(['submitted', 'already-submitted', 'waiting', 'busy']),
  signature: z.string().nullable(),
  report: addressSchema.nullable(),
  dayStartTs: z.string().nullable(),
  message: z.string(),
});
export const reportSimulationSchema = z.object({
  tree: addressSchema,
  reporter: walletSchema,
  dayStartTs: z.string().regex(/^[0-9]+$/),
  readyAt: z.iso.datetime(),
  ready: z.boolean(),
  alreadyReported: z.boolean(),
  wh: z.array(z.number().int()),
});

export const invoiceReportSchema = z.object({
  address: addressSchema,
  dayStartTs: z.string().regex(/^[0-9]+$/),
  totalWh: u64Schema,
  invoiceIssued: z.boolean(),
  due: u64Schema,
  paid: u64Schema,
});
export const invoicePricingSchema = z.object({
  date: z.iso.date(),
  method: z.literal('quarter-hour').optional(),
  intervals: z
    .array(
      z.object({
        startTs: z.string().regex(/^[0-9]+$/),
        wh: z.number().int(),
        eurPerMwh: z.string(),
        czkPerKwh: z.string(),
        totalCzk: z.string(),
      }),
    )
    .optional(),
  priceSources: z
    .array(z.object({ date: z.iso.date(), url: z.url() }))
    .optional(),
  eurPerMwh: z.string().optional(),
  eurCzk: z.string(),
  usdCzk: z.string(),
  exchangeRateDate: z.iso.date(),
  czkPerKwh: z.string().optional(),
  totalCzk: z.string(),
  amount: u64Schema.nullable(),
  priceSource: z.url(),
  exchangeRateSource: z.url(),
});
export const treeReportSchema = invoiceReportSchema.extend({
  id: z.uuid(),
  tree: addressSchema,
  submittedAt: z.string().regex(/^[0-9]+$/),
  reporter: addressSchema,
  wh: z.array(z.number().int()),
  pricing: invoicePricingSchema.nullable(),
  pricingError: z.string().nullable(),
  signature: z.string(),
  updatedAt: z.iso.datetime(),
});
export const treeReportsResponseSchema = z.object({
  reports: z.array(treeReportSchema),
  total: z.number().int().nonnegative(),
});
export const mockReporterSchema = z.object({
  id: z.uuid(),
  tree: addressSchema,
  wallet: walletSchema,
  lastSignature: z.string().nullable(),
  lastError: z.string().nullable(),
  balanceLamports: u64Schema.nullable(),
});
export type IndexedReport = z.infer<typeof treeReportSchema>;
export type CampaignDossier = z.infer<typeof campaignDossierSchema>;
