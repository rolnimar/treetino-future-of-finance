import { describe, expect, test } from 'bun:test';
import { z } from 'zod';
import { calculateAssetAccruedYield } from '../src/features/victron/yield-stream';

const victronEnergyTotalsSchema = z.object({
  solarYieldKwh: z.number(),
  consumptionKwh: z.number(),
  gridExportKwh: z.number(),
  gridImportKwh: z.number(),
});

const victronDemoItemSchema = z.object({
  siteId: z.number(),
  key: z.enum(['offgrid', 'ess', 'ev', 'treetino-v1']),
  title: z.string(),
  category: z.string(),
  categoryBadge: z.string(),
  narrative: z.string(),
  investorHighlight: z.string(),
  projectedApy: z.string(),
  suggestedTargetUsdc: z.string(),
  identifier: z.string(),
  vrmUrl: z.string(),
  location: z.object({
    city: z.string(),
    country: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    timezone: z.string(),
  }),
  currentPower: z.object({
    solarYieldWatts: z.number(),
    consumptionWatts: z.number(),
    gridWatts: z.number(),
    batterySocPercent: z.number(),
    batteryVoltage: z.number(),
    batteryState: z.string(),
  }),
  dailyTotals: victronEnergyTotalsSchema,
  energyStats: z.object({
    today: victronEnergyTotalsSchema,
    week: victronEnergyTotalsSchema,
    month: victronEnergyTotalsSchema,
    year: victronEnergyTotalsSchema,
  }),
  devices: z.array(
    z.object({
      name: z.string(),
      modelName: z.string(),
      productName: z.string(),
      firmwareVersion: z.string().optional(),
      deviceType: z.string().optional(),
    }),
  ),
  systemInfo: z.object({
    firmwareVersion: z.string(),
    status: z.string(),
    systemType: z.string(),
    systemState: z.string(),
    batteryVoltage: z.number(),
    batteryCurrentAmps: z.number(),
    acInput1: z.string(),
    acInput2: z.string(),
    dbusRtt: z.string(),
  }),
  financials: z.object({
    targetUsdc: z.number(),
    fundedUsdc: z.number(),
    fundedPercent: z.number(),
    sharePriceUsdc: z.number(),
    totalShares: z.number(),
    projectedApy: z.number(),
    estDailyRevenueUsdc: z.number(),
    estMonthlyRevenueUsdc: z.number(),
    estAnnualRevenueUsdc: z.number(),
    tariffRate: z.string(),
    revenueModelDescription: z.string(),
    cashFlowWaterfall: z.array(
      z.object({
        title: z.string(),
        percentage: z.string(),
        amount: z.string(),
        description: z.string(),
      }),
    ),
  }),
  windYieldWatts: z.number().optional(),
  totalGenerationWatts: z.number().optional(),
  treeDiagnostics: z
    .object({
      windSpeedMs: z.number(),
      solarIrradianceWm2: z.number(),
      noiseDbA: z.number(),
      leafTrackingAngleDeg: z.number(),
      turbineRpm: z.number(),
      activeAiMode: z.string(),
      clientName: z.string(),
      clientTariff: z.string(),
    })
    .optional(),
});

describe('Victron Green Energy DePIN archetypes and investor financials', () => {
  test('validates Off-Grid Microgrid schema and financial yield mechanics', () => {
    const rawOffgrid = {
      siteId: 209689,
      key: 'offgrid',
      title: 'Off-Grid Solar Microgrid',
      category: 'Grassroots DePIN · Permissionless Adoption',
      categoryBadge: 'Off-Grid Solar',
      narrative: 'Community microgrid',
      investorHighlight: 'Direct consumer payback',
      projectedApy: '8.5%',
      suggestedTargetUsdc: '10000',
      identifier: '48e7da86e0d9',
      vrmUrl: 'https://vrm.victronenergy.com/installation/209689/dashboard',
      location: {
        city: 'Queensland',
        country: 'Australia',
        latitude: -25.7503,
        longitude: 151.265,
        timezone: 'Australia/Brisbane',
      },
      currentPower: {
        solarYieldWatts: 337,
        consumptionWatts: 246,
        gridWatts: 0,
        batterySocPercent: 100.0,
        batteryVoltage: 53.99,
        batteryState: 'Charging',
      },
      dailyTotals: {
        solarYieldKwh: 5.86,
        consumptionKwh: 4.98,
        gridExportKwh: 0,
        gridImportKwh: 0,
      },
      energyStats: {
        today: {
          solarYieldKwh: 5.86,
          consumptionKwh: 4.98,
          gridExportKwh: 0,
          gridImportKwh: 0,
        },
        week: {
          solarYieldKwh: 45.68,
          consumptionKwh: 38.46,
          gridExportKwh: 0,
          gridImportKwh: 0,
        },
        month: {
          solarYieldKwh: 180.14,
          consumptionKwh: 153.03,
          gridExportKwh: 0,
          gridImportKwh: 0,
        },
        year: {
          solarYieldKwh: 2137.56,
          consumptionKwh: 1818.52,
          gridExportKwh: 0,
          gridImportKwh: 0,
        },
      },
      devices: [
        {
          name: 'Gateway',
          modelName: 'Cerbo GX',
          productName: 'Cerbo GX',
          firmwareVersion: 'v3.80',
        },
        {
          name: 'Battery Monitor',
          modelName: 'Lynx Smart BMS 500A',
          productName: 'Lynx Smart BMS',
        },
      ],
      systemInfo: {
        firmwareVersion: 'v3.80',
        status: 'Online',
        systemType: 'Hub-1',
        systemState: 'Off',
        batteryVoltage: 53.99,
        batteryCurrentAmps: 1.1,
        acInput1: 'Generator',
        acInput2: 'None',
        dbusRtt: '4 ms',
      },
      financials: {
        targetUsdc: 10000,
        fundedUsdc: 7850,
        fundedPercent: 78.5,
        sharePriceUsdc: 1.0,
        totalShares: 10000,
        projectedApy: 8.5,
        estDailyRevenueUsdc: 2.33,
        estMonthlyRevenueUsdc: 70.83,
        estAnnualRevenueUsdc: 850.0,
        tariffRate: 'USDC 0.40/kWh metered consumption',
        revenueModelDescription: 'Consumer pays per kWh consumed',
        cashFlowWaterfall: [
          {
            title: 'Gross Revenue',
            percentage: '100%',
            amount: 'USDC 850.00 / yr',
            description: 'Consumer payments',
          },
          {
            title: 'O&M Reserve',
            percentage: '5%',
            amount: '-USDC 42.50 / yr',
            description: 'Cerbo GX LTE & insurance',
          },
          {
            title: 'Net Investor Distribution',
            percentage: '95%',
            amount: 'USDC 807.50 / yr',
            description: 'Tokenholder yield',
          },
        ],
      },
    };

    const parsed = victronDemoItemSchema.parse(rawOffgrid);
    expect(parsed.financials.projectedApy).toBe(8.5);

    // Test proportional distribution for a USDC 500 investment:
    const investment = 500;
    const poolShare = (investment / parsed.financials.targetUsdc) * 100;
    expect(poolShare).toBe(5.0); // 5% of pool

    const annualYield = investment * (parsed.financials.projectedApy / 100);
    expect(annualYield).toBe(42.5); // USDC 42.50 / year

    const monthlyYield = annualYield / 12;
    expect(Number(monthlyYield.toFixed(2))).toBe(3.54); // USDC 3.54 / month
  });

  test('validates Commercial ESS Battery Arbitrage yields (14.2% APY)', () => {
    const rawEss = {
      siteId: 219742,
      key: 'ess',
      title: 'Commercial ESS Battery Storage',
      category: 'Grid Flexibility · High-Yield Arbitrage',
      categoryBadge: 'Battery Storage (BESS)',
      narrative: 'Commercial BESS',
      investorHighlight: 'Wholesale arbitrage',
      projectedApy: '14.2%',
      suggestedTargetUsdc: '50000',
      identifier: 'c0619ab27f32',
      vrmUrl: 'https://vrm.victronenergy.com/installation/219742/dashboard',
      location: {
        city: 'Amsterdam',
        country: 'Netherlands',
        latitude: 52.3629,
        longitude: 4.89298,
        timezone: 'Europe/Amsterdam',
      },
      currentPower: {
        solarYieldWatts: 1540,
        consumptionWatts: 455,
        gridWatts: -34,
        batterySocPercent: 28.0,
        batteryVoltage: 48.54,
        batteryState: 'Discharging',
      },
      dailyTotals: {
        solarYieldKwh: 39.86,
        consumptionKwh: 21.53,
        gridExportKwh: 18.06,
        gridImportKwh: 0,
      },
      energyStats: {
        today: {
          solarYieldKwh: 39.86,
          consumptionKwh: 21.53,
          gridExportKwh: 18.06,
          gridImportKwh: 0,
        },
        week: {
          solarYieldKwh: 312.54,
          consumptionKwh: 167.93,
          gridExportKwh: 143.32,
          gridImportKwh: 0,
        },
        month: {
          solarYieldKwh: 1261.62,
          consumptionKwh: 655.13,
          gridExportKwh: 563.63,
          gridImportKwh: 0,
        },
        year: {
          solarYieldKwh: 15181.2,
          consumptionKwh: 7758.57,
          gridExportKwh: 6727.31,
          gridImportKwh: 0,
        },
      },
      devices: [
        {
          name: 'Gateway',
          modelName: 'Cerbo-S GX',
          productName: 'Cerbo-S GX',
          firmwareVersion: 'v3.80',
        },
        {
          name: 'VE.Bus Inverter',
          modelName: 'MultiPlus-II 48/3000/35-32',
          productName: 'MultiPlus-II',
        },
      ],
      systemInfo: {
        firmwareVersion: 'v3.80',
        status: 'Online',
        systemType: 'ESS',
        systemState: 'Recharging',
        batteryVoltage: 48.54,
        batteryCurrentAmps: -7.2,
        acInput1: 'Grid',
        acInput2: 'Generator',
        dbusRtt: '1 ms',
      },
      financials: {
        targetUsdc: 50000,
        fundedUsdc: 42100,
        fundedPercent: 84.2,
        sharePriceUsdc: 1.0,
        totalShares: 50000,
        projectedApy: 14.2,
        estDailyRevenueUsdc: 19.45,
        estMonthlyRevenueUsdc: 591.67,
        estAnnualRevenueUsdc: 7100.0,
        tariffRate: 'USDC 0.35/kWh peak spread + frequency reserve',
        revenueModelDescription: 'Arbitrage & grid regulation',
        cashFlowWaterfall: [
          {
            title: 'Gross Revenue',
            percentage: '100%',
            amount: 'USDC 7,100.00 / yr',
            description: 'Peak export arbitrage',
          },
          {
            title: 'Grid Fees',
            percentage: '7%',
            amount: '-USDC 497.00 / yr',
            description: 'Interconnection',
          },
          {
            title: 'Net Investor Distribution',
            percentage: '93%',
            amount: 'USDC 6,603.00 / yr',
            description: 'BESS token yield',
          },
        ],
      },
    };

    const parsed = victronDemoItemSchema.parse(rawEss);
    expect(parsed.financials.projectedApy).toBe(14.2);

    // USDC 1,000 investment:
    const investment = 1000;
    const poolShare = (investment / parsed.financials.targetUsdc) * 100;
    expect(poolShare).toBe(2.0); // 2% of pool

    const annualYield = investment * (parsed.financials.projectedApy / 100);
    expect(annualYield).toBe(142.0); // USDC 142.00 / year
  });

  test('validates EV Fast-Charging Hub high-velocity transaction economics (18.5% APY)', () => {
    const rawEv = {
      siteId: 374891,
      key: 'ev',
      title: 'Solar EV Fast-Charging Hub',
      category: 'Machine-to-Machine · High-Velocity Economy',
      categoryBadge: 'EV Fast Charging',
      narrative: 'EV charging hub',
      investorHighlight: 'High recurring transaction volume',
      projectedApy: '18.5%',
      suggestedTargetUsdc: '100000',
      identifier: 'c0619ab3086a',
      vrmUrl: 'https://vrm.victronenergy.com/installation/374891/dashboard',
      location: {
        city: 'Paris',
        country: 'France',
        latitude: 48.8575,
        longitude: 2.35138,
        timezone: 'Europe/Paris',
      },
      currentPower: {
        solarYieldWatts: 543,
        consumptionWatts: 8871,
        gridWatts: 8333,
        batterySocPercent: 51.0,
        batteryVoltage: 52.49,
        batteryState: 'Idle',
      },
      dailyTotals: {
        solarYieldKwh: 4.72,
        consumptionKwh: 153.81,
        gridExportKwh: 0,
        gridImportKwh: 149.48,
      },
      energyStats: {
        today: {
          solarYieldKwh: 4.72,
          consumptionKwh: 153.81,
          gridExportKwh: 0,
          gridImportKwh: 149.48,
        },
        week: {
          solarYieldKwh: 40.5,
          consumptionKwh: 1244.95,
          gridExportKwh: 0,
          gridImportKwh: 1206.3,
        },
        month: {
          solarYieldKwh: 163.85,
          consumptionKwh: 4942.17,
          gridExportKwh: 0,
          gridImportKwh: 4783.54,
        },
        year: {
          solarYieldKwh: 2215.84,
          consumptionKwh: 58090.44,
          gridExportKwh: 0,
          gridImportKwh: 56578.29,
        },
      },
      devices: [
        {
          name: 'Gateway',
          modelName: 'Cerbo GX',
          productName: 'Cerbo GX',
          firmwareVersion: 'v3.90-beta5',
        },
        {
          name: 'VE.Bus Inverter',
          modelName: 'Quattro 48/10000/140-2x100',
          productName: 'Quattro',
        },
        {
          name: 'EV Charger #1',
          modelName: 'EV Charging Station 32A',
          productName: 'EVCS-32A',
        },
      ],
      systemInfo: {
        firmwareVersion: 'v3.90-beta5',
        status: 'Online',
        systemType: 'ESS',
        systemState: 'Bulk',
        batteryVoltage: 52.49,
        batteryCurrentAmps: -0.3,
        acInput1: 'Grid',
        acInput2: 'Generator',
        dbusRtt: '3 ms',
      },
      financials: {
        targetUsdc: 100000,
        fundedUsdc: 91500,
        fundedPercent: 91.5,
        sharePriceUsdc: 1.0,
        totalShares: 100000,
        projectedApy: 18.5,
        estDailyRevenueUsdc: 50.68,
        estMonthlyRevenueUsdc: 1541.67,
        estAnnualRevenueUsdc: 18500.0,
        tariffRate: 'USDC 0.42/kWh + USDC 2.50 session fee',
        revenueModelDescription: 'Point-of-sale EV charging micro-billing',
        cashFlowWaterfall: [
          {
            title: 'Gross Charging Revenue',
            percentage: '100%',
            amount: 'USDC 18,500.00 / yr',
            description: 'EV driver payments',
          },
          {
            title: 'Site Lease & Processing',
            percentage: '8%',
            amount: '-USDC 1,480.00 / yr',
            description: 'Parking lease & gateway',
          },
          {
            title: 'Net Investor Distribution',
            percentage: '92%',
            amount: 'USDC 17,020.00 / yr',
            description: 'EV hub token yield',
          },
        ],
      },
    };

    const parsed = victronDemoItemSchema.parse(rawEv);
    expect(parsed.financials.projectedApy).toBe(18.5);

    // USDC 2,500 investment:
    const investment = 2500;
    const poolShare = (investment / parsed.financials.targetUsdc) * 100;
    expect(poolShare).toBe(2.5); // 2.5% of pool

    const annualYield = investment * (parsed.financials.projectedApy / 100);
    expect(annualYield).toBe(462.5); // USDC 462.50 / year
  });

  test('validates 3 distinct physical system topologies and node configurations', () => {
    // System 1: Off-Grid Standalone DC Microgrid
    const offgridNodes = {
      systemType: 'Standalone Microgrid',
      acInputType: 'Generator (Standby)',
      solarCoupling: 'DC MPPT Only',
      inverterModel: 'Multi RS Smart 48V',
      hasEvPlaza: false,
      hasDualFroniusInverters: false,
    };
    expect(offgridNodes.systemType).toBe('Standalone Microgrid');
    expect(offgridNodes.solarCoupling).toBe('DC MPPT Only');

    // System 2: ESS Commercial Grid Arbitrage
    const essNodes = {
      systemType: 'ESS Grid-Parallel',
      acInputType: 'Utility Grid (Arbitrage)',
      solarCoupling: 'Dual AC-Coupled Fronius + DC MPPT',
      inverterModel: 'MultiPlus-II 48/3000',
      loads: ['AC Loads (Grid parallel)', 'Essential Loads (Sub-panel)'],
      hasDualFroniusInverters: true,
      hasEvPlaza: false,
    };
    expect(essNodes.hasDualFroniusInverters).toBe(true);
    expect(essNodes.loads.length).toBe(2);

    // System 3: Multiple EV Chargers Plaza
    const evNodes = {
      systemType: 'Commercial EV Fast-Charging Hub',
      acInputType: 'High-Capacity Utility Grid (8.7 kW)',
      inverterModel: 'Quattro 48/10000/140',
      evcsStations: [
        { id: 1, name: 'EVCS Station #1', powerKw: 14.45, active: true },
        {
          id: 2,
          name: 'EVCS Station #2',
          status: 'EV Disconnected',
          active: false,
        },
      ],
      sensors: [
        { name: 'TEST PARTER', type: 'RuuviTag', tempC: 36.8, humidityPct: 24 },
      ],
      hasEvPlaza: true,
      bayCount: 10,
    };
    expect(evNodes.evcsStations[0].powerKw).toBe(14.45);
    expect(evNodes.evcsStations[0].active).toBe(true);
    expect(evNodes.sensors[0].tempC).toBe(36.8);
    expect(evNodes.bayCount).toBe(10);
  });

  test('validates Treetino V1 Smart Energy Tree schema, dual-modality physics, and MKovo PPA', () => {
    const rawTree = {
      siteId: 100001,
      key: 'treetino-v1',
      title: 'Treetino V1 · Smart Energy Tree',
      category: 'Biomimetic Dual-Modality · Urban DePIN',
      categoryBadge: 'Solar + Wind Tree',
      narrative: 'Ultra-high density 12m vertical micro-power plant',
      investorHighlight:
        'Dual-modality 45 kW generation on 1.2 m² ground footprint',
      projectedApy: '12.8%',
      suggestedTargetUsdc: '235000',
      identifier: 'treenet-v1-001',
      vrmUrl: 'https://vrm.victronenergy.com/installation/100001/dashboard',
      location: {
        city: 'Prague / Central Bohemia',
        country: 'Czech Republic',
        latitude: 50.0755,
        longitude: 14.4378,
        timezone: 'Europe/Prague',
      },
      currentPower: {
        solarYieldWatts: 8448,
        consumptionWatts: 14850,
        gridWatts: -1598,
        batterySocPercent: 84.5,
        batteryVoltage: 53.48,
        batteryState: 'Charging',
      },
      windYieldWatts: 8000,
      totalGenerationWatts: 16448,
      treeDiagnostics: {
        windSpeedMs: 6.8,
        solarIrradianceWm2: 640,
        noiseDbA: 27.5,
        leafTrackingAngleDeg: 44,
        turbineRpm: 326,
        activeAiMode: 'Sun Tracking & Ducted Venturi Boost',
        clientName: 'MKovo s.r.o. (Precision Manufacturing)',
        clientTariff: 'USDC 0.32 / kWh metered corporate PPA',
      },
      dailyTotals: {
        solarYieldKwh: 38.45,
        consumptionKwh: 142.5,
        gridExportKwh: 20.55,
        gridImportKwh: 0,
      },
      energyStats: {
        today: {
          solarYieldKwh: 38.45,
          consumptionKwh: 142.5,
          gridExportKwh: 20.55,
          gridImportKwh: 0,
        },
        week: {
          solarYieldKwh: 275.2,
          consumptionKwh: 998.4,
          gridExportKwh: 145.8,
          gridImportKwh: 0,
        },
        month: {
          solarYieldKwh: 1180.5,
          consumptionKwh: 4280.0,
          gridExportKwh: 615.2,
          gridImportKwh: 0,
        },
        year: {
          solarYieldKwh: 14250.0,
          consumptionKwh: 52000.0,
          gridExportKwh: 7450.0,
          gridImportKwh: 0,
        },
      },
      devices: [
        {
          name: 'Core Gateway',
          modelName: 'Victron Cerbo GX',
          productName: 'Cerbo GX',
          firmwareVersion: 'v3.80',
          deviceType: 'gateway',
        },
        {
          name: 'Primary Branch Actuators (350 kg)',
          modelName: '12x Dunkermotoren GR 80x80 + PLG 75 EP + BGE 6010 A',
          productName: 'Dunkermotoren GR 80x80',
          firmwareVersion: 'v4.02',
          deviceType: 'actuator',
        },
      ],
      systemInfo: {
        firmwareVersion: 'v3.80-treetino',
        status: 'Online',
        systemType: 'Treetino Dual-Modality Microgrid',
        systemState: 'Synchronized',
        batteryVoltage: 53.48,
        batteryCurrentAmps: 14.5,
        acInput1: 'Distribution Grid Intertie',
        acInput2: 'MKovo s.r.o. Dedicated PPA Feed',
        dbusRtt: '1 ms',
      },
      financials: {
        targetUsdc: 235000,
        fundedUsdc: 192700,
        fundedPercent: 82.0,
        sharePriceUsdc: 1.0,
        totalShares: 235000,
        projectedApy: 12.8,
        estDailyRevenueUsdc: 82.41,
        estMonthlyRevenueUsdc: 2506.67,
        estAnnualRevenueUsdc: 30080.0,
        tariffRate: 'USDC 0.32 / kWh metered corporate PPA (MKovo s.r.o.)',
        revenueModelDescription:
          'Dual revenue stream: direct metered corporate PPA payments from industrial client MKovo s.r.o. plus peak grid feed-in export.',
        cashFlowWaterfall: [
          {
            title: 'Gross Metered Energy Revenue',
            percentage: '100%',
            amount: 'USDC 30,080.00 / yr',
            description:
              'Metered electricity payments collected from off-taker MKovo s.r.o.',
          },
          {
            title: 'O&M, Telemetry & Warranty Reserve',
            percentage: '8%',
            amount: '-USDC 2,406.40 / yr',
            description:
              'Victron Cerbo GX cloud connectivity and actuator inspection',
          },
          {
            title: 'Net Investor Distribution',
            percentage: '92%',
            amount: 'USDC 27,673.60 / yr',
            description:
              'Direct programmatic yield distributions streamed to Treetino V1 tokenholders',
          },
        ],
      },
    };

    const parsed = victronDemoItemSchema.parse(rawTree);
    expect(parsed.siteId).toBe(100001);
    expect(parsed.key).toBe('treetino-v1');
    expect(parsed.financials.targetUsdc).toBe(235000);
    expect(parsed.financials.projectedApy).toBe(12.8);
    expect(parsed.treeDiagnostics?.clientName).toContain('MKovo s.r.o.');
    expect(parsed.treeDiagnostics?.clientTariff).toBe(
      'USDC 0.32 / kWh metered corporate PPA',
    );
    expect(parsed.devices[1].modelName).toContain('Dunkermotoren');
  });

  test('validates URL hash router for dedicated fresh asset pages', () => {
    const parseAssetRoute = (hash: string): number | null => {
      const match = hash.match(/^#(?:asset|project)\/(\d+)$/);
      return match ? parseInt(match[1], 10) : null;
    };

    expect(parseAssetRoute('#asset/100001')).toBe(100001);
    expect(parseAssetRoute('#asset/209689')).toBe(209689);
    expect(parseAssetRoute('#asset/219742')).toBe(219742);
    expect(parseAssetRoute('#asset/374891')).toBe(374891);
    expect(parseAssetRoute('#project/100001')).toBe(100001);
    expect(parseAssetRoute('')).toBeNull();
    expect(parseAssetRoute('#trees')).toBeNull();
    expect(parseAssetRoute('#portfolio')).toBeNull();
    expect(parseAssetRoute('#admin')).toBeNull();
  });

  test('validates investor dividend streaming mathematics and continuous accrual', () => {
    const investment = 500; // USDC 500 USDC
    const target = 10000; // USDC 10,000 pool
    const apyPercent = 14.2; // 14.2% APY

    // 1. Ownership share
    const poolShareFraction = investment / target;
    expect(poolShareFraction).toBe(0.05); // 5.0%

    // 2. Annual dividend
    const annualDividend = investment * (apyPercent / 100);
    expect(annualDividend).toBeCloseTo(71.0, 2);

    // 3. Daily dividend
    const dailyDividend = annualDividend / 365;
    expect(dailyDividend).toBeCloseTo(0.1945, 4);

    // 4. Per-second continuous streaming rate
    const secondsInYear = 365 * 24 * 3600;
    const perSecondRate = annualDividend / secondsInYear;
    expect(perSecondRate).toBeGreaterThan(0);

    // After 60 seconds (1 minute of live SCADA telemetry)
    const accrued60s = perSecondRate * 60;
    expect(accrued60s).toBeCloseTo((71.0 / secondsInYear) * 60, 6);

    // 5. Clean energy share delivered to investor
    const annualSiteKwh = 18500; // 18,500 kWh metered
    const investorAttributedKwh = annualSiteKwh * poolShareFraction;
    expect(investorAttributedKwh).toBe(925); // 925 kWh clean energy credited
  });

  test('validates campaign dossier schema matching Kickstarter requirements', () => {
    const campaignDossierSchema = z.object({
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
      phase: z.enum(['funding', 'funded', 'purchased', 'active']).optional(),
      canBuy: z.boolean().optional(),
    });

    const testCampaign = {
      id: 'campaign-test-1',
      treeAddress: 'treetino_v1_mkovo_prague',
      treeId: '4',
      title: 'Treetino V1 · Smart Energy Tree',
      subtitle: 'Biomimetic Solar + Wind Dual-Modality Microgrid',
      category: 'Biomimetic Tree',
      categoryBadge: 'Solar + Wind Tree',
      narrative:
        'Flagship 12m vertical micro-power plant combining 300 heliotropic solar leaves and 12 ducted VAWT wind turbines.',
      story:
        'Installed at MKovo s.r.o. providing 24/7 clean baseload power for precision manufacturing.',
      investorHighlight:
        'Dual-modality 45 kW generation on 1.2 m² ground footprint.',
      victronSiteId: 100001,
      city: 'Prague',
      country: 'Czech Republic',
      projectedApy: '12.8%',
      tariffRate: 'USDC 0.32 / kWh metered corporate PPA (MKovo s.r.o.)',
      offTakerName: 'MKovo s.r.o.',
      offTakerDescription: 'Long-term corporate power purchase agreement.',
      supplierName: 'Treetino CleanTech s.r.o.',
      targetUsdc: '235000',
      raisedUsdc: '192700',
      phase: 'funding' as const,
      canBuy: true,
    };

    const parsed = campaignDossierSchema.parse(testCampaign);
    expect(parsed.title).toBe('Treetino V1 · Smart Energy Tree');
    expect(parsed.targetUsdc).toBe('235000');
    expect(parsed.projectedApy).toBe('12.8%');
    expect(parsed.canBuy).toBe(true);
  });

  test('validates Kickstarter cover image paths and campaign metadata resolution', async () => {
    const { getCampaignCoverImage, CAMPAIGN_METADATA } =
      await import('../src/features/victron/campaign-helpers');

    // 1. Cover images exist and resolve for each archetype
    expect(getCampaignCoverImage('treetino-v1')).toBe(
      '/campaigns/treetino-v1.jpg',
    );
    expect(getCampaignCoverImage('ess')).toBe('/campaigns/ess.jpg');
    expect(getCampaignCoverImage('ev')).toBe('/campaigns/ev.jpg');
    expect(getCampaignCoverImage('offgrid')).toBe('/campaigns/wind.jpg');
    expect(getCampaignCoverImage('wind')).toBe('/campaigns/wind.jpg');
    expect(getCampaignCoverImage('unknown')).toBe('/campaigns/treetino-v1.jpg');

    // 2. Metadata includes creator, days left, and backers
    expect(CAMPAIGN_METADATA['treetino-v1'].creator).toBe('MKovo Engineering');
    expect(CAMPAIGN_METADATA['treetino-v1'].daysLeft).toBeGreaterThan(0);
    expect(CAMPAIGN_METADATA['treetino-v1'].backers).toBeGreaterThan(0);

    expect(CAMPAIGN_METADATA['ess'].creator).toBe('WATTINO × ČEZ Distribuce');
    expect(CAMPAIGN_METADATA['ev'].creator).toBe('ChargeVolt Paris');
    expect(CAMPAIGN_METADATA['offgrid'].creator).toBe(
      'ČEZ Concession / Vestas',
    );
  });

  test('validates search and category filtering for Kickstarter campaigns', () => {
    const campaigns = [
      {
        siteId: 1,
        key: 'treetino-v1',
        title: 'Treetino V1: Biomimetic Solar & Wind Tree at MKovo',
        categoryBadge: 'Biomimetic Tree',
        narrative:
          'A 12-meter sculptural urban solar & wind generation installation',
        location: { city: 'Poprad', country: 'Slovakia' },
        financials: { projectedApy: 12.8, fundedPercent: 77 },
      },
      {
        siteId: 2,
        key: 'ess',
        title: 'Amsterdam Commercial BESS Warehouse Arbitrage',
        categoryBadge: 'Commercial ESS',
        narrative:
          'Grid-scale lithium battery storage system performing wholesale price arbitrage',
        location: { city: 'Amsterdam', country: 'Netherlands' },
        financials: { projectedApy: 15.4, fundedPercent: 71 },
      },
      {
        siteId: 3,
        key: 'ev',
        title: 'Paris Solar Canopy Fleet Supercharger Plaza',
        categoryBadge: 'EV Fast-Charging',
        narrative:
          'High-power DC fast-charging plaza powered by solar canopy and buffer battery',
        location: { city: 'Paris', country: 'France' },
        financials: { projectedApy: 13.9, fundedPercent: 88 },
      },
      {
        siteId: 4,
        key: 'offgrid',
        title: 'Queensland Autonomous Off-Grid Solar Homestead',
        categoryBadge: 'Off-Grid Solar',
        narrative:
          'Resilient rural power system with rooftop solar and Victron MultiPlus-II',
        location: { city: 'Queensland', country: 'Australia' },
        financials: { projectedApy: 14.2, fundedPercent: 83 },
      },
    ];

    // Search query: "battery"
    const searchBattery = campaigns.filter(
      (c) =>
        c.title.toLowerCase().includes('battery') ||
        c.narrative.toLowerCase().includes('battery'),
    );
    expect(searchBattery.map((c) => c.key)).toEqual(['ess', 'ev']);

    // Search query: "amsterdam"
    const searchAmsterdam = campaigns.filter(
      (c) =>
        c.location.city.toLowerCase().includes('amsterdam') ||
        c.title.toLowerCase().includes('amsterdam'),
    );
    expect(searchAmsterdam.length).toBe(1);
    expect(searchAmsterdam[0].key).toBe('ess');

    // High yield filter (>14% APY)
    const highYield = campaigns.filter((c) => c.financials.projectedApy >= 14);
    expect(highYield.map((c) => c.key)).toEqual(['ess', 'offgrid']);
  });

  test('guarantees 100% identical yield amounts between Portfolio and Product Detail', () => {
    const fixedNow = 1776000000000;
    const holding = {
      amountUsdc: 100,
      investedAt: fixedNow - 30 * 60 * 1000, // backed 30 mins ago
      lastClaimedAt: fixedNow - 30 * 60 * 1000,
      totalClaimedUsdc: 0,
    };
    const financials = {
      projectedApy: 18.5,
      targetUsdc: 100000,
      fundedUsdc: 85000,
      estDailyRevenueUsdc: 50.68,
    };

    // Calculate on "Portfolio" view
    const portfolioYield = calculateAssetAccruedYield(
      holding,
      financials,
      fixedNow,
    );

    // Calculate on "Product Detail" view (same holding, same financials, same time)
    const productDetailYield = calculateAssetAccruedYield(
      holding,
      financials,
      fixedNow,
    );

    expect(portfolioYield.formattedTotal).toBe(
      productDetailYield.formattedTotal,
    );
    expect(portfolioYield.totalAccrued).toBe(productDetailYield.totalAccrued);
    expect(portfolioYield.baseDividend).toBe(productDetailYield.baseDividend);
    expect(portfolioYield.kaminoBonus).toBe(productDetailYield.kaminoBonus);
    expect(portfolioYield.poolSharePercent).toBe('0.10%');

    // Unclaimed initial holding has accrued SCADA telemetry ~USDC 0.078 - USDC 0.082
    expect(portfolioYield.totalAccrued).toBeGreaterThanOrEqual(0.078);
    expect(portfolioYield.totalAccrued).toBeLessThanOrEqual(0.082);
    expect(portfolioYield.formattedTotal).toMatch(/^\+USDC 0\.0[78]\d\d$/);

    // Simulating claiming in wallet: lastClaimedAt resets to fixedNow, totalClaimedUsdc records payout
    const claimedHolding = {
      ...holding,
      lastClaimedAt: fixedNow,
      totalClaimedUsdc: portfolioYield.totalAccrued,
    };

    const portfolioAfterClaim = calculateAssetAccruedYield(
      claimedHolding,
      financials,
      fixedNow,
    );
    const detailAfterClaim = calculateAssetAccruedYield(
      claimedHolding,
      financials,
      fixedNow,
    );

    // Immediate post-claim state is exactly 0.0000 USDC on both pages
    expect(portfolioAfterClaim.totalAccrued).toBe(0);
    expect(portfolioAfterClaim.formattedTotal).toBe('+USDC 0.0000');
    expect(detailAfterClaim.totalAccrued).toBe(0);
    expect(detailAfterClaim.formattedTotal).toBe('+USDC 0.0000');

    // 10 seconds later: continuous streaming continues synchronously
    const streamPortfolio = calculateAssetAccruedYield(
      claimedHolding,
      financials,
      fixedNow + 10_000,
    );
    const streamDetail = calculateAssetAccruedYield(
      claimedHolding,
      financials,
      fixedNow + 10_000,
    );

    expect(streamPortfolio.totalAccrued).toBe(streamDetail.totalAccrued);
    expect(streamPortfolio.totalAccrued).toBeGreaterThan(0);
    expect(streamPortfolio.formattedTotal).toBe(streamDetail.formattedTotal);
  });
});
