import { z } from 'zod';

export const victronEnergyTotalsSchema = z.object({
  solarYieldKwh: z.number(),
  consumptionKwh: z.number(),
  gridExportKwh: z.number(),
  gridImportKwh: z.number(),
});

export const victronHourlyPointSchema = z.object({
  hourLabel: z.string(),
  solarKwh: z.number(),
  consumptionKwh: z.number(),
  gridExportKwh: z.number(),
});

export type VictronEnergyTotals = z.infer<typeof victronEnergyTotalsSchema>;
export type VictronHourlyPoint = z.infer<typeof victronHourlyPointSchema>;

export const victronDeviceSchema = z.object({
  name: z.string(),
  modelName: z.string(),
  productName: z.string(),
  firmwareVersion: z.string().optional(),
  deviceType: z.string().optional(),
});

export type VictronDevice = z.infer<typeof victronDeviceSchema>;

export const victronCashFlowItemSchema = z.object({
  title: z.string(),
  percentage: z.string(),
  amount: z.string(),
  description: z.string(),
});

export type VictronCashFlowItem = z.infer<typeof victronCashFlowItemSchema>;
export type VictronWaterfallStep = VictronCashFlowItem;

export const victronDemoItemSchema = z.object({
  usage: z
    .object({
      tariffUsdcPerKwh: z.number(),
      connectionFeeUsdc: z.number(),
      powerKw: z.number(),
    })
    .optional(),
  revenue: z
    .object({
      receivedUsdc: z.number(),
      paidSessions: z.number(),
      energyKwh: z.number(),
    })
    .optional(),
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
  hourlyData: z.array(victronHourlyPointSchema).default([]),
  devices: z.array(victronDeviceSchema),
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
    batteryTimeToGoHours: z.number().optional(),
    batteryConsumedAh: z.number().optional(),
    generatorState: z.string().optional(),
    temperatureProbeCelsius: z.number().optional(),
    temperatureProbeName: z.string().optional(),
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
    cashFlowWaterfall: z.array(victronCashFlowItemSchema),
  }),
  liveWeather: z
    .object({
      tempCelsius: z.number(),
      humidityPercent: z.number(),
      windSpeedKmh: z.number(),
      condition: z.string(),
    })
    .optional(),
  evDeliveredKwh24h: z.number().optional(),
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

export type VictronDemoItem = z.infer<typeof victronDemoItemSchema>;

export const victronDemosResponseSchema = z.object({
  demos: z.array(victronDemoItemSchema),
  updatedAt: z.string(),
  source: z.string(),
});

export type VictronDemosResponse = z.infer<typeof victronDemosResponseSchema>;
