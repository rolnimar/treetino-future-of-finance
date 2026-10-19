export interface DossierQuickStat {
  label: string;
  value: string;
  subtext?: string;
  highlight?: boolean;
}

export interface FinancialScenario {
  id: 'conservative' | 'realistic' | 'dynamic';
  label: string;
  description: string;
  grossRevenueCzk: number; // Primary gross revenue in currency units
  svrRevenueCzk: number; // Pillar A revenue (Grid services / Baseload PPA / Direct EV fast charging)
  spotRevenueCzk: number; // Pillar B revenue (Spot arbitrage / Peak shaving / Off-grid tariff)
  aggregatorFeeCzk: number; // Aggregator / operator fee
  opexCzk: number; // Operating costs (servicing, lease, insurance, telemetry)
  ebitdaCzk: number; // Clean net operating profit (EBITDA)
  paybackYearsNoSubsidy: number;
  paybackYearsWithSubsidy: number;
  irr10yNoSubsidy: number;
  irr10yWithSubsidy: number;
  npv10yDiscount7PercentCzk: number;
  cumulative10yCleanProfitCzk: number;
}

export interface CashFlowYearSchedule {
  year: number; // 0 to 10
  label: string;
  svrRevenueMlnCzk: number;
  spotRevenueMlnCzk: number;
  opexAndAggregatorMlnCzk: number;
  ebitdaMlnCzk: number;
  cumCfNoSubsidyMlnCzk: number;
  cumCfWithSubsidyMlnCzk: number;
}

export interface FinancialVariant {
  id: 'var-a' | 'var-b';
  code: string;
  name: string;
  capacityLabel: string;
  durationHours?: string;
  cabinetCount?: number;
  inverterRating: string;
  capexCommercialCzk: number;
  capexSubsidy30Czk: number;
  annualOpexCzk: number;
  scenarios: Record<
    'conservative' | 'realistic' | 'dynamic',
    FinancialScenario
  >;
  cashFlow10y: CashFlowYearSchedule[];
  phase1CapexCommercialCzk?: number;
  phase1CapexSubsidyCzk?: number;
  phase1CapacityMwh?: number;
  phase2CapexCommercialCzk?: number;
  phase2CapexSubsidyCzk?: number;
  phase2CapacityMwh?: number;
}

export interface RevenuePillar {
  title: string;
  sharePercent: string;
  annualRevenueRangeCzk: string;
  summary: string;
  bulletPoints: string[];
}

export interface DiurnalWindow {
  time: string;
  title: string;
  category: 'charge' | 'discharge' | 'balancing';
  priceUsdcMwh: string;
  description: string;
}

export interface CapexBudgetItem {
  index: number;
  title: string;
  phase1VarA: number;
  phase2VarA: number;
  totalVarA: number;
  phase1VarB: number;
  totalVarB: number;
}

export interface ProjectRoadmapStep {
  step: number;
  code: string;
  title: string;
  description: string;
  status: 'completed' | 'in_progress' | 'upcoming';
}

export interface HardwareSpec {
  title: string;
  subtitle: string;
  provider: string;
  stats: Array<{
    value: string;
    label: string;
    subtext: string;
    color?: string;
  }>;
  features: Array<{
    title: string;
    bullets: string[];
  }>;
  safetyCertifications: string[];
  warrantySummary: string;
}

export interface ProjectDocument {
  title: string;
  category: string;
  fileSize: string;
  fileFormat: string;
  downloadPath?: string;
  status: 'verified' | 'certified' | 'signed' | 'approved';
}

export interface ProjectDossier {
  meta: {
    projectName: string;
    siteId: number;
    capacityMw: number;
    capacityLabel: string;
    capacityMwhA: number;
    capacityMwhB: number;
    location: string;
    cadastralArea: string;
    parcelNumber: string;
    dsoName: string;
    voltageLevel: string;
    technologyProvider: string;
    partnerCompany: string;
    investorPerTz: string;
    currency?: 'USDC' | 'CZK';
    currencySymbol?: string;
    currencyScale?: number; // scale multiplier vs internal storage unit if applicable
    currencyUnitLabel?: string; // e.g. "USDC " or "$" or "CZK"
    capexTitle?: string;
    offTakerAgreementTitle?: string;
  };
  contracts: {
    phase1: { name: string; sopNumber: string; capacity: string };
    phase2?: { name: string; sopNumber: string; capacity: string };
  };
  highlights: DossierQuickStat[];
  variants: Record<'var-a' | 'var-b', FinancialVariant>;
  revenuePillars: RevenuePillar[];
  diurnalSchedule: DiurnalWindow[];
  capexBudget: CapexBudgetItem[];
  roadmap: ProjectRoadmapStep[];
  hardwareSpec?: HardwareSpec;
  documents?: ProjectDocument[];
  slides?: Array<{ pageNumber: number; title: string; imagePath: string }>;
  downloadPdfPath: string;
  pdfFilename?: string;
}

export type BessProjectDossier = ProjectDossier;
