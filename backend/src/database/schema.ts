import {
  foreignKey,
  index,
  integer,
  boolean,
  pgTable,
  uuid,
  jsonb,
  bigint,
  bigserial,
  text,
  uniqueIndex,
  unique,
} from 'drizzle-orm/pg-core';
import type { TreePhase, InvoicePricing } from '@treetino/contracts';

const uuidPrimaryKey = () => uuid('id').primaryKey().defaultRandom();

export const indexerState = pgTable(
  'indexer_state',
  {
    id: uuidPrimaryKey(),
    stream: text('stream').notNull(),
    startTime: bigint('start_time', { mode: 'number' }).notNull(),
    cursor: text('cursor'),
  },
  (table) => [unique('indexer_state_stream').on(table.stream)],
);

export const indexerSources = pgTable(
  'indexer_sources',
  {
    id: uuidPrimaryKey(),
    rpcUrl: text('rpc_url').notNull(),
    programId: text('program_id').notNull(),
    stream: text('stream')
      .notNull()
      .references(() => indexerState.stream),
  },
  (table) => [
    uniqueIndex('indexer_sources_rpc_program').on(
      table.rpcUrl,
      table.programId,
    ),
  ],
);

export const indexedTransactions = pgTable(
  'indexed_transactions',
  {
    id: uuidPrimaryKey(),
    stream: text('stream')
      .notNull()
      .references(() => indexerState.stream),
    signature: text('signature').notNull(),
    slot: bigint('slot', { mode: 'number' }).notNull(),
    blockTime: bigint('block_time', { mode: 'number' }).notNull(),
    error: jsonb('error_json').$type<unknown>(),
    transaction: jsonb('transaction_json').$type<unknown>(),
  },
  (table) => [
    unique('indexed_transactions_stream_signature').on(
      table.stream,
      table.signature,
    ),
  ],
);

export const indexedEvents = pgTable(
  'indexed_events',
  {
    id: uuidPrimaryKey(),
    sequence: bigserial('sequence', { mode: 'number' }).notNull(),
    stream: text('stream').notNull(),
    signature: text('signature').notNull(),
    eventIndex: integer('event_index').notNull(),
    name: text('name').notNull(),
    data: jsonb('data_json').$type<unknown>().notNull(),
  },
  (table) => [
    uniqueIndex('indexed_events_transaction_event').on(
      table.stream,
      table.signature,
      table.eventIndex,
    ),
    uniqueIndex('indexed_events_sequence').on(table.sequence),
    index('indexed_events_stream_sequence').on(table.stream, table.sequence),
    foreignKey({
      columns: [table.stream, table.signature],
      foreignColumns: [
        indexedTransactions.stream,
        indexedTransactions.signature,
      ],
    }),
  ],
);

export type IndexerState = typeof indexerState.$inferSelect;

export const indexedTrees = pgTable(
  'indexed_trees',
  {
    id: uuidPrimaryKey(),
    stream: text('stream')
      .notNull()
      .references(() => indexerState.stream),
    address: text('address').notNull(),
    treeId: text('tree_id').notNull(),
    creator: text('creator').notNull(),
    supplier: text('supplier').notNull(),
    client: text('client').notNull(),
    reporter: text('reporter').notNull(),
    paymentMint: text('payment_mint').notNull(),
    shareMint: text('share_mint').notNull(),
    fundingTokenAccount: text('funding_token_account').notNull(),
    target: text('target').notNull(),
    raised: text('raised').notNull(),
    phase: text('phase').$type<TreePhase>().notNull(),
    blockTime: bigint('block_time', { mode: 'number' }).notNull(),
    signature: text('signature').notNull(),
  },
  (table) => [
    uniqueIndex('indexed_trees_stream_address').on(table.stream, table.address),
    index('indexed_trees_stream_phase').on(table.stream, table.phase),
  ],
);

export type IndexedTreeInput = Omit<
  typeof indexedTrees.$inferInsert,
  'id' | 'stream' | 'blockTime' | 'signature'
>;

export const admins = pgTable('admins', {
  id: uuidPrimaryKey(),
  wallet: text('wallet').notNull().unique(),
});

export const authChallenges = pgTable(
  'auth_challenges',
  {
    id: uuidPrimaryKey(),
    wallet: text('wallet').notNull(),
    message: text('message').notNull(),
    expiresAt: bigint('expires_at', { mode: 'number' }).notNull(),
  },
  (table) => [index('auth_challenges_expiry').on(table.expiresAt)],
);

export const indexedReports = pgTable(
  'indexed_reports',
  {
    id: uuidPrimaryKey(),
    stream: text('stream')
      .notNull()
      .references(() => indexerState.stream),
    address: text('address').notNull(),
    tree: text('tree').notNull(),
    dayStartTs: text('day_start_ts').notNull(),
    submittedAt: text('submitted_at').notNull(),
    reporter: text('reporter').notNull(),
    wh: jsonb('wh').$type<number[]>().notNull(),
    totalWh: text('total_wh').notNull(),
    invoiceIssued: boolean('invoice_issued').notNull(),
    due: text('due').notNull(),
    paid: text('paid').notNull(),
    pricing: jsonb('pricing').$type<InvoicePricing>(),
    pricingError: text('pricing_error'),
    signature: text('signature').notNull(),
    blockTime: bigint('block_time', { mode: 'number' }).notNull(),
  },
  (table) => [
    uniqueIndex('indexed_reports_stream_address').on(
      table.stream,
      table.address,
    ),
    index('indexed_reports_stream_tree').on(table.stream, table.tree),
  ],
);

export type IndexedReportInput = Omit<
  typeof indexedReports.$inferInsert,
  'id' | 'stream' | 'signature' | 'blockTime' | 'pricing' | 'pricingError'
>;

// Devnet-only simulated device keys. Never return secretKey from an API.
export const mockReporters = pgTable(
  'mock_reporters',
  {
    id: uuidPrimaryKey(),
    stream: text('stream').notNull(),
    tree: text('tree').notNull(),
    creator: text('creator').notNull(),
    wallet: text('wallet').notNull(),
    secretKey: text('secret_key').notNull(),
    lastSignature: text('last_signature'),
    lastError: text('last_error'),
    balanceLamports: text('balance_lamports'),
    leaseOwner: text('lease_owner'),
    leaseUntil: bigint('lease_until', { mode: 'number' }).notNull().default(0),
  },
  (table) => [
    uniqueIndex('mock_reporters_stream_tree').on(table.stream, table.tree),
  ],
);

export const mockReportJobs = pgTable(
  'mock_report_jobs',
  {
    id: uuidPrimaryKey(),
    reporterId: uuid('reporter_id')
      .notNull()
      .references(() => mockReporters.id),
    report: text('report').notNull(),
    dayStartTs: text('day_start_ts').notNull(),
    rawTransaction: text('raw_transaction').notNull(),
    signature: text('signature').notNull(),
    lastValidBlockHeight: bigint('last_valid_block_height', {
      mode: 'number',
    }).notNull(),
    confirmed: boolean('confirmed').notNull().default(false),
  },
  (table) => [
    uniqueIndex('mock_report_jobs_reporter_day').on(
      table.reporterId,
      table.dayStartTs,
    ),
  ],
);

export interface SpotPriceQuote {
  method: 'quarter-hour';
  date: string;
  intervals: { startTs: string; eurPerMwh: string }[];
  eurCzk: string;
  usdCzk: string;
  exchangeRateDate: string;
  priceSource: string;
  exchangeRateSource: string;
}
export const dailySpotPrices = pgTable('daily_spot_prices', {
  id: uuidPrimaryKey(),
  date: text('date').notNull().unique(),
  quote: jsonb('quote').$type<SpotPriceQuote>().notNull(),
});

export const campaigns = pgTable(
  'campaigns',
  {
    id: uuidPrimaryKey(),
    treeAddress: text('tree_address').notNull(),
    treeId: text('tree_id'),
    title: text('title').notNull(),
    subtitle: text('subtitle'),
    category: text('category').notNull(),
    categoryBadge: text('category_badge').notNull(),
    narrative: text('narrative').notNull(),
    story: text('story'),
    investorHighlight: text('investor_highlight'),
    victronSiteId: integer('victron_site_id'),
    city: text('city').notNull(),
    country: text('country').notNull(),
    projectedApy: text('projected_apy').notNull(),
    tariffRate: text('tariff_rate').notNull(),
    offTakerName: text('off_taker_name').notNull(),
    offTakerDescription: text('off_taker_description'),
    supplierName: text('supplier_name'),
    targetUsdc: text('target_usdc').notNull(),
    createdAt: bigint('created_at', { mode: 'number' }).notNull(),
    updatedAt: bigint('updated_at', { mode: 'number' }).notNull(),
  },
  (table) => [uniqueIndex('campaigns_tree_address').on(table.treeAddress)],
);

export type Campaign = typeof campaigns.$inferSelect;
export type CampaignInput = typeof campaigns.$inferInsert;

// Sandbox payment receipts only. These are demo allocations, not SPL shares.
export interface DemoPaymentAmounts {
  principalCents: number;
  moonpayFeeCents: number;
  networkFeeCents: number;
  extraFeeCents: number;
  totalPaidCents: number;
  checkoutCents: number;
}

export const demoPayments = pgTable('demo_payments', {
  id: uuidPrimaryKey(),
  wallet: text('wallet').notNull(),
  siteId: integer('site_id').notNull(),
  amountCents: integer('amount_cents').notNull(),
  status: text('status').notNull().default('pending'),
  transactionId: text('transaction_id').unique(),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
  completedAt: bigint('completed_at', { mode: 'number' }),
  paymentAmounts: jsonb('payment_amounts').$type<DemoPaymentAmounts>(),
  fiatCurrency: text('fiat_currency').$type<'USD'>().notNull().default('USD'),
  usdcAllocation: jsonb('usdc_allocation').$type<{
    amountUsdc: number;
    rate: number;
    rateDate: string;
    source: 'USD';
  }>(),
});
