import idl from './idl/treetino.json';
import type { Treetino } from './types/treetino';

export type { Treetino };
export {
  TreetinoErrorCode,
  type TreetinoErrorName,
} from './types/treetino_errors';
export const TREETINO_IDL: Treetino = idl as Treetino;
export const TREETINO_PROGRAM_ID = TREETINO_IDL.address;

export interface ApiHealth {
  status: 'ok';
  service: 'treetino-backend';
}

export interface ProtocolInfo {
  name: 'treetino';
  network: 'devnet';
  programId: string;
}

export type TreePhase = 'funding' | 'funded' | 'purchased' | 'active';

export interface TreeInfo {
  id: string;
  address: string;
  treeId: string;
  creator: string;
  supplier: string;
  client: string;
  reporter: string;
  paymentMint: string;
  shareMint: string;
  fundingTokenAccount: string;
  /** Amounts are decimal strings in base units (6 decimals), with 1:1 shares. */
  target: string;
  raised: string;
  remaining: string;
  phase: TreePhase;
  canBuy: boolean;
  updatedAt: string;
  signature: string;
}

export interface TreesResponse {
  trees: TreeInfo[];
  total: number;
}

export interface InvoicePricing {
  date: string;
  /** Absent only on historical invoices calculated with the old daily average. */
  method?: 'quarter-hour';
  intervals?: InvoicePricingInterval[];
  priceSources?: { date: string; url: string }[];
  eurPerMwh?: string;
  eurCzk: string;
  usdCzk: string;
  exchangeRateDate: string;
  czkPerKwh?: string;
  totalCzk: string;
  amount: string | null;
  priceSource: string;
  exchangeRateSource: string;
}

export interface InvoicePricingInterval {
  startTs: string;
  wh: number;
  eurPerMwh: string;
  czkPerKwh: string;
  totalCzk: string;
}

export interface TreeReport {
  id: string;
  address: string;
  tree: string;
  dayStartTs: string;
  submittedAt: string;
  reporter: string;
  wh: number[];
  totalWh: string;
  invoiceIssued: boolean;
  due: string;
  paid: string;
  pricing: InvoicePricing | null;
  pricingError: string | null;
  signature: string;
  updatedAt: string;
}

export interface TreeReportsResponse {
  reports: TreeReport[];
  total: number;
}

export interface MockReporterInfo {
  id: string;
  tree: string;
  wallet: string;
  lastSignature: string | null;
  lastError: string | null;
  balanceLamports: string | null;
}

export interface MockReportResult {
  status: 'submitted' | 'already-submitted' | 'waiting' | 'busy';
  signature: string | null;
  report: string | null;
  dayStartTs: string | null;
  message: string;
}
export interface ReportSimulation {
  tree: string;
  reporter: string;
  dayStartTs: string;
  readyAt: string;
  ready: boolean;
  alreadyReported: boolean;
  wh: number[];
}

export interface CampaignDossier {
  id: string;
  treeAddress: string;
  treeId: string;
  title: string;
  subtitle?: string;
  category: string;
  categoryBadge: string;
  narrative: string;
  story?: string;
  investorHighlight?: string;
  victronSiteId?: number;
  city: string;
  country: string;
  projectedApy: string;
  tariffRate: string;
  offTakerName: string;
  offTakerDescription?: string;
  supplierName?: string;
  targetUsdc: string;
  raisedUsdc?: string;
  phase?: TreePhase;
  canBuy?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface CampaignsResponse {
  campaigns: CampaignDossier[];
  total: number;
}

export interface CreateCampaignDto {
  treeAddress: string;
  treeId?: string;
  title: string;
  subtitle?: string;
  category: string;
  categoryBadge: string;
  narrative: string;
  story?: string;
  investorHighlight?: string;
  victronSiteId?: number;
  city: string;
  country: string;
  projectedApy: string;
  tariffRate: string;
  offTakerName: string;
  offTakerDescription?: string;
  supplierName?: string;
  targetUsdc: string;
}
export { FLAGSHIP_CREATOR, FLAGSHIP_FUNDING } from './flagship-funding';
