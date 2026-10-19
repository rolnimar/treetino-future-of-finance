import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import {
  type VictronDemoItem,
  victronDemosResponseSchema,
} from './victron-types';
import {
  type CampaignDossier,
  campaignsResponseSchema,
} from '../../lib/schemas';

function inferKey(category: string): 'offgrid' | 'ess' | 'ev' | 'treetino-v1' {
  const lower = category.toLowerCase();
  if (lower.includes('tree') || lower.includes('biomimetic'))
    return 'treetino-v1';
  if (
    lower.includes('battery') ||
    lower.includes('ess') ||
    lower.includes('bess') ||
    lower.includes('arbitrage')
  )
    return 'ess';
  if (
    lower.includes('ev') ||
    lower.includes('charger') ||
    lower.includes('charging') ||
    lower.includes('mobility')
  )
    return 'ev';
  return 'offgrid';
}

function campaignToDemoItem(
  c: CampaignDossier,
  index: number,
  baseDemo?: VictronDemoItem,
): VictronDemoItem {
  if (baseDemo) {
    const parsedTarget =
      parseFloat(c.targetUsdc) || baseDemo.financials.targetUsdc;
    const parsedRaised = c.raisedUsdc
      ? parseFloat(c.raisedUsdc)
      : baseDemo.financials.fundedUsdc;
    const fundedPercent =
      parsedTarget > 0 ? Math.min(100, (parsedRaised / parsedTarget) * 100) : 0;
    const parsedApy =
      parseFloat(c.projectedApy) || baseDemo.financials.projectedApy;

    return {
      ...baseDemo,
      identifier: c.treeAddress,
      title: c.title,
      category: c.category,
      categoryBadge: c.categoryBadge,
      narrative: c.narrative,
      investorHighlight: c.investorHighlight ?? baseDemo.investorHighlight,
      location: {
        ...baseDemo.location,
        city: c.city,
        country: c.country,
      },
      financials: {
        ...baseDemo.financials,
        targetUsdc: parsedTarget,
        fundedUsdc: parsedRaised,
        fundedPercent: Math.round(fundedPercent * 10) / 10,
        projectedApy: parsedApy,
        tariffRate: c.tariffRate,
      },
    };
  }

  // Synthesize demo item for newly created campaign without existing demo base
  const numericSiteId =
    c.victronSiteId ?? 500000 + (parseInt(c.treeId, 10) || index + 1);
  const target = parseFloat(c.targetUsdc) || 25000;
  const raised = c.raisedUsdc ? parseFloat(c.raisedUsdc) : 0;
  const apy = parseFloat(c.projectedApy) || 12.5;
  const fundedPercent =
    target > 0 ? Math.min(100, Math.round((raised / target) * 1000) / 10) : 0;
  const annualRev = target * (apy / 100);

  return {
    siteId: numericSiteId,
    key: inferKey(c.category),
    title: c.title,
    category: c.category,
    categoryBadge: c.categoryBadge,
    narrative: c.narrative,
    investorHighlight:
      c.investorHighlight ??
      'Verified clean energy hardware streaming metered dividend yield directly to tokenholders.',
    projectedApy: `${apy}%`,
    suggestedTargetUsdc: target.toString(),
    identifier: c.treeAddress,
    vrmUrl: 'https://vrm.victronenergy.com',
    location: {
      city: c.city,
      country: c.country,
      latitude: 48.8566,
      longitude: 2.3522,
      timezone: 'Europe/Paris',
    },
    currentPower: {
      solarYieldWatts: 3850,
      consumptionWatts: 2420,
      gridWatts: 0,
      batterySocPercent: 88,
      batteryVoltage: 51.8,
      batteryState: 'Float Charging',
    },
    dailyTotals: {
      solarYieldKwh: 32.4,
      consumptionKwh: 26.8,
      gridExportKwh: 5.6,
      gridImportKwh: 0,
    },
    energyStats: {
      today: {
        solarYieldKwh: 32.4,
        consumptionKwh: 26.8,
        gridExportKwh: 5.6,
        gridImportKwh: 0,
      },
      week: {
        solarYieldKwh: 228.0,
        consumptionKwh: 184.0,
        gridExportKwh: 44.0,
        gridImportKwh: 0,
      },
      month: {
        solarYieldKwh: 980.0,
        consumptionKwh: 790.0,
        gridExportKwh: 190.0,
        gridImportKwh: 0,
      },
      year: {
        solarYieldKwh: 12400.0,
        consumptionKwh: 9950.0,
        gridExportKwh: 2450.0,
        gridImportKwh: 0,
      },
    },
    hourlyData: [],
    devices: [
      {
        name: 'Cerbo GX Gateway',
        modelName: 'Cerbo GX (Venus OS)',
        productName: 'Victron System Controller',
        firmwareVersion: 'v3.52',
      },
      {
        name: 'Inverter / Charger',
        modelName: 'MultiPlus-II 48/5000/70',
        productName: 'Victron Pure Sine Inverter',
        firmwareVersion: 'v510',
      },
      {
        name: 'Solar MPPT',
        modelName: 'SmartSolar MPPT 250/100-Tr VE.Can',
        productName: 'Victron Solar Charge Controller',
        firmwareVersion: 'v1.64',
      },
    ],
    systemInfo: {
      firmwareVersion: 'v3.52',
      status: 'Online · Operational',
      systemType: 'Cerbo GX',
      systemState: 'Energy Storage System (ESS)',
      batteryVoltage: 51.8,
      batteryCurrentAmps: 14.2,
      acInput1: 'Active (230V / 50Hz)',
      acInput2: 'None',
      dbusRtt: '12ms',
    },
    financials: {
      targetUsdc: target,
      fundedUsdc: raised,
      fundedPercent,
      sharePriceUsdc: 1.0,
      totalShares: target,
      projectedApy: apy,
      estDailyRevenueUsdc: Math.round((annualRev / 365) * 100) / 100,
      estMonthlyRevenueUsdc: Math.round((annualRev / 12) * 100) / 100,
      estAnnualRevenueUsdc: Math.round(annualRev * 100) / 100,
      tariffRate: c.tariffRate,
      revenueModelDescription: `Automated revenue settlement: ${c.offTakerName} pays metered PPA invoices directly into the smart contract vault.`,
      cashFlowWaterfall: [
        {
          title: 'Gross Energy Revenue',
          percentage: '100%',
          amount: `USDC ${annualRev.toLocaleString()} / yr`,
          description: `Metered tariff collected from off-taker ${c.offTakerName}`,
        },
        {
          title: 'O&M & Telemetry Reserve',
          percentage: '6%',
          amount: `-USDC ${Math.round(annualRev * 0.06).toLocaleString()} / yr`,
          description:
            'Cerbo GX LTE connectivity, hardware warranty, and routine inspection',
        },
        {
          title: 'Net Investor Distribution',
          percentage: '94%',
          amount: `USDC ${Math.round(annualRev * 0.94).toLocaleString()} / yr`,
          description:
            'Direct proportional yield streaming to tokenholders on Solana',
        },
      ],
    },
  };
}

export function useEnrichedCampaigns() {
  const demosQuery = useQuery({
    queryKey: ['victron-energy-assets-v3'],
    queryFn: ({ signal }) =>
      api('victron/demos', victronDemosResponseSchema, { signal }),
    refetchInterval: 15_000,
  });

  const campaignsQuery = useQuery({
    queryKey: ['campaigns-list'],
    queryFn: ({ signal }) =>
      api('campaigns', campaignsResponseSchema, { signal }),
    refetchInterval: 15_000,
  });

  const baseDemos = demosQuery.data?.demos ?? [];
  const campaigns = campaignsQuery.data?.campaigns ?? [];

  // Merge campaigns with base demos
  const demos: VictronDemoItem[] = [];
  const matchedCampaignIds = new Set<string>();

  // 1. Process base demos and enrich with campaigns
  for (const base of baseDemos) {
    const matched = campaigns.find(
      (c) =>
        (c.victronSiteId && c.victronSiteId === base.siteId) ||
        c.treeAddress === base.identifier,
    );

    if (matched) {
      matchedCampaignIds.add(matched.id);
      demos.push(campaignToDemoItem(matched, 0, base));
    } else {
      demos.push(base);
    }
  }

  // 2. Add any newly created custom campaigns that don't match base demos
  let customIdx = 0;
  for (const c of campaigns) {
    if (!matchedCampaignIds.has(c.id)) {
      demos.push(campaignToDemoItem(c, customIdx++));
    }
  }

  // Canonical priority sort aligning with pitch:
  // 1. Batteries (35% APY - core yield product)
  // 2. Treetino V1 Trees (signature biomimetic)
  // 3. EV Charging Plaza (stablecoin settlement)
  // 4. Industrial Wind Turbines (4.0 MW utility)
  const priorityOrder: Record<string, number> = {
    ess: 1,
    'treetino-v1': 2,
    ev: 3,
    offgrid: 4,
    wind: 4,
  };
  demos.sort(
    (a, b) => (priorityOrder[a.key] ?? 99) - (priorityOrder[b.key] ?? 99),
  );

  return {
    demos,
    isPending: demosQuery.isPending && campaignsQuery.isPending,
    isLoading: demosQuery.isLoading || campaignsQuery.isLoading,
    error: demosQuery.error ?? campaignsQuery.error,
    updatedAt: demosQuery.data?.updatedAt ?? new Date().toISOString(),
    refetch: async () => {
      await Promise.all([demosQuery.refetch(), campaignsQuery.refetch()]);
    },
  };
}
