import { Injectable, Logger } from '@nestjs/common';
import type {
  VictronDemosResponseDto,
  VictronDemoItemDto,
  VictronDeviceItemDto,
  VictronEnergyTotalsDto,
  VictronHourlyPointDto,
  VictronLiveWeatherDto,
  VictronTreeDiagnosticsDto,
} from './victron.dto';

interface CachedData {
  data: VictronDemosResponseDto;
  expiresAt: number;
}

const SITE_METADATA = {
  209689: {
    key: 'offgrid' as const,
    title: 'Wind Park Kryry 4.0 MW (Vestas V80)',
    category: 'Utility Wind · High-Voltage Grid Intertie',
    categoryBadge: 'Wind Turbines · 4.0 MW',
    narrative:
      'Two utility-scale 2.0 MW Vestas V80 wind turbines located in the Kryry wind corridor. Feeds clean industrial baseload power directly into the high-voltage transmission grid, generating stable metered feed-in cashflows.',
    investorHighlight:
      'Proven utility-grade wind infrastructure with 20-year grid concession, certified turbine availability >98%, and predictable European green energy cash flows.',
    projectedApy: '14.2%',
    suggestedTargetUsdc: '180000',
    location: {
      city: 'Kryry',
      country: 'Czech Republic',
      latitude: 50.1742,
      longitude: 13.4286,
      timezone: 'Europe/Prague',
    },
    financials: {
      targetUsdc: 180000,
      fundedUsdc: 142000,
      fundedPercent: 78.9,
      sharePriceUsdc: 1.0,
      totalShares: 180000,
      projectedApy: 14.2,
      estDailyRevenueUsdc: 70.03,
      estMonthlyRevenueUsdc: 2130.0,
      estAnnualRevenueUsdc: 25560.0,
      tariffRate:
        'USDC 95.00 / MWh guaranteed grid feed-in tariff (Vestas V80 2× 2.0 MW)',
      revenueModelDescription:
        'Direct power feed-in contract: High-voltage regional grid off-taker purchases all metered wind kilowatt-hours.',
      cashFlowWaterfall: [
        {
          title: 'Gross Wind Energy Revenue',
          percentage: '100%',
          amount: 'USDC 340,000 / yr',
          description:
            'Metered electricity fed into high-voltage grid across 2× Vestas V80 turbines',
        },
        {
          title: 'O&M & Turbine Insurance Reserve',
          percentage: '7.5%',
          amount: '-USDC 25,500 / yr',
          description:
            'Full-scope Vestas service contract, blade inspection, and grid intertie insurance',
        },
        {
          title: 'Net Investor Distribution',
          percentage: '92.5%',
          amount: 'USDC 314,500 / yr',
          description:
            'Direct proportional yield streaming to tokenized share holders on Solana',
        },
      ],
    },
  },
  219742: {
    key: 'ess' as const,
    title: 'BESS Přeštice 8.6 MW (WATTINO hBESS)',
    category: 'Grid Flexibility · ČEPS Standby + Spot Arbitrage',
    categoryBadge: 'BESS 8.6 MW · 35% APY',
    narrative:
      'High-capacity 8.6 MW / 10.0–17.2 MWh battery energy storage system (BESS) directly connected to the 110/22 kV Přeštice substation. Monetizes negative midday solar prices (20% arbitrage) and guaranteed 24/7 grid standby availability fees (15%) from ČEPS, achieving up to 35% projected APY.',
    investorHighlight:
      'Dual-yield European grid battery: 20% spot arbitrage from negative prices + 15% ČEPS standby fee = 35% APY. 2 signed ČEZ connection agreements, 2.95y payback, and 10-year EU replacement warranty.',
    projectedApy: '35.0%',
    suggestedTargetUsdc: '108000',
    location: {
      city: 'Dolni Lukavice (Prestice)',
      country: 'Czech Republic',
      latitude: 49.6192,
      longitude: 13.3414,
      timezone: 'Europe/Prague',
    },
    financials: {
      targetUsdc: 108000,
      fundedUsdc: 84200,
      fundedPercent: 78.0,
      sharePriceUsdc: 1.0,
      totalShares: 108000,
      projectedApy: 35.0,
      estDailyRevenueUsdc: 103.56,
      estMonthlyRevenueUsdc: 3150.0,
      estAnnualRevenueUsdc: 37800.0,
      tariffRate:
        '2× Signed Connection Agreements (#4122602318 & #4122623464) · 20% Spot Arbitrage + 15% ČEPS Standby',
      revenueModelDescription:
        'Dual-income model: 20% from buying negative-priced solar energy and selling at peak spreads + 15% from guaranteed ČEPS 24/7 frequency standby fees.',
      cashFlowWaterfall: [
        {
          title: 'Gross Annual Revenue (Ancillary + Spot)',
          percentage: '100%',
          amount: 'USDC 1.24M / yr',
          description:
            'ČEPS capacity standby + OTE day-ahead & intraday arbitrage',
        },
        {
          title: 'Aggregator & Trader Revenue Share',
          percentage: '12%',
          amount: '-USDC 148k / yr',
          description:
            '12% success-fee for automated market bidding, forecasting, and ČEPS dispatching',
        },
        {
          title: 'Direct Operating Expenses (OPEX)',
          percentage: '5.3%',
          amount: '-USDC 65k / yr',
          description:
            'Preventive service, land lease, insurance, 500L compressor-less thermal buffer management (~1.5% CAPEX)',
        },
        {
          title: 'Clean Annual Operating Profit (EBITDA)',
          percentage: '82.7%',
          amount: 'USDC 1.02M / yr',
          description:
            'Net annual cash flow distributed to project equity and tokenized investors (Var. A Realistic)',
        },
      ],
    },
  },
  374891: {
    key: 'ev' as const,
    title: 'Solar EV Fast-Charging Hub',
    category: 'Machine-to-Machine · High-Velocity Economy',
    categoryBadge: 'EV Fast Charging',
    narrative:
      'Multi-bay commercial EV charging plaza buffered with solar and storage. Processes high daily energy throughput, laying the foundation for autonomous vehicle micro-billing and native energy stablecoins.',
    investorHighlight:
      'High-velocity recurring transaction volume directly from EV fleet operators and retail drivers.',
    projectedApy: '18.5%',
    suggestedTargetUsdc: '100000',
    location: {
      city: 'Paris',
      country: 'France',
      latitude: 48.8575,
      longitude: 2.35138,
      timezone: 'Europe/Paris',
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
      tariffRate:
        'USDC 0.42 / kWh delivered + USDC 2.50 session connection fee per charge',
      revenueModelDescription:
        'Continuous point-of-sale micro-transactions generated across 10 commercial charging bays with automated energy billing.',
      cashFlowWaterfall: [
        {
          title: 'Gross Charging Revenue',
          percentage: '100%',
          amount: 'USDC 18,500.00 / yr',
          description:
            'Commercial charging fees collected across 10 high-power EV charging bays',
        },
        {
          title: 'Site Lease & Payment Processing',
          percentage: '8%',
          amount: '-USDC 1,480.00 / yr',
          description:
            'Commercial parking space lease, hardware warranty, and payment gateway costs',
        },
        {
          title: 'Net Investor Distribution',
          percentage: '92%',
          amount: 'USDC 17,020.00 / yr',
          description:
            'Direct automated yield stream distributed to plaza tokenholders on Solana',
        },
      ],
    },
  },
  100001: {
    key: 'treetino-v1' as const,
    title: 'Treetino V1 · Smart Energy Tree',
    category: 'Biomimetic Dual-Modality · Urban DePIN',
    categoryBadge: 'Solar + Wind Tree',
    narrative:
      'Ultra-high density 12m vertical micro-power plant combining 300 heliotropic solar leaves and 12 ducted VAWT wind turbines on a 1.2 m² footprint. Powers industrial partner MKovo s.r.o. with clean baseload power, streaming metered repayments directly to tokenholders.',
    investorHighlight:
      'Dual-modality 45 kW generation on 1.2 m² ground footprint replacing 300 m² of rooftop solar with 24/7 day-and-night output.',
    projectedApy: '12.8%',
    suggestedTargetUsdc: '235000',
    location: {
      city: 'Prague / Central Bohemia',
      country: 'Czech Republic',
      latitude: 50.0755,
      longitude: 14.4378,
      timezone: 'Europe/Prague',
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
            'Metered electricity payments collected from off-taker MKovo s.r.o. and grid feed-in',
        },
        {
          title: 'O&M, Telemetry & Warranty Reserve',
          percentage: '8%',
          amount: '-USDC 2,406.40 / yr',
          description:
            'Victron Cerbo GX cloud connectivity, actuator inspection, and replacement reserve',
        },
        {
          title: 'Net Investor Distribution',
          percentage: '92%',
          amount: 'USDC 27,673.60 / yr',
          description:
            'Direct programmatic yield distributions streamed to Treetino V1 tokenholders on Solana',
        },
      ],
    },
  },
};

@Injectable()
export class VictronService {
  private readonly logger = new Logger(VictronService.name);
  private cache: CachedData | null = null;
  private token: { value: string; expiresAt: number } | null = null;

  async getDemos(): Promise<VictronDemosResponseDto> {
    if (this.cache && Date.now() < this.cache.expiresAt) {
      return this.cache.data;
    }

    try {
      const data = await this.fetchLiveDemos();
      this.cache = {
        data,
        expiresAt: Date.now() + 30_000, // 30s cache
      };
      return data;
    } catch (err: unknown) {
      this.logger.warn(
        `Failed to fetch live Victron telemetry: ${err instanceof Error ? err.message : String(err)}. Using fallback.`,
      );
      if (this.cache) return this.cache.data;
      return this.getFallbackData();
    }
  }

  private async getAuthToken(): Promise<string> {
    if (this.token && Date.now() < this.token.expiresAt) {
      return this.token.value;
    }
    const res = await fetch(
      'https://vrmapi.victronenergy.com/v2/auth/loginAsDemo',
      {
        method: 'GET',
        headers: { Accept: 'application/json' },
      },
    );
    if (!res.ok)
      throw new Error(`VRM loginAsDemo failed with HTTP ${res.status}`);
    const body = (await res.json()) as { token: string };
    this.token = {
      value: body.token,
      expiresAt: Date.now() + 3600_000, // 1 hour
    };
    return this.token.value;
  }

  private async fetchLiveDemos(): Promise<VictronDemosResponseDto> {
    const token = await this.getAuthToken();
    const headers = {
      Accept: 'application/json',
      'x-authorization': `Bearer ${token}`,
    };

    const targetSiteIds = [209689, 219742, 374891];
    const now = Math.floor(Date.now() / 1000);
    const start = now - 24 * 3600;

    // Fetch installations, devices, overallstats, hourly stats, battery summary, and evcs stats in parallel
    const [installationsRes, bs209689Res, evcs374891Res, ...detailResponses] =
      await Promise.all([
        fetch(
          'https://vrmapi.victronenergy.com/v2/users/22/installations?extended=1',
          { headers },
        ),
        fetch(
          'https://vrmapi.victronenergy.com/v2/installations/209689/widgets/BatterySummary',
          { headers },
        ),
        fetch(
          `https://vrmapi.victronenergy.com/v2/installations/374891/stats?interval=hours&start=${start}&end=${now}&type=evcs`,
          { headers },
        ),
        ...targetSiteIds.map((id) =>
          fetch(
            `https://vrmapi.victronenergy.com/v2/installations/${id}/system-overview`,
            { headers },
          ),
        ),
        ...targetSiteIds.map((id) =>
          fetch(
            `https://vrmapi.victronenergy.com/v2/installations/${id}/overallstats`,
            { headers },
          ),
        ),
        ...targetSiteIds.map((id) =>
          fetch(
            `https://vrmapi.victronenergy.com/v2/installations/${id}/stats?interval=hours&start=${start}&end=${now}&type=kwh`,
            { headers },
          ),
        ),
      ]);

    if (!installationsRes.ok) {
      throw new Error(`Fetch installations failed: ${installationsRes.status}`);
    }

    const installationsData = (await installationsRes.json()) as {
      records: Array<{
        idSite: number;
        name: string;
        identifier: string;
        extended?: Array<{
          code: string;
          rawValue: number | null;
          formattedValue: string;
          description: string;
        }>;
      }>;
    };

    let ttg209689: number | undefined = undefined;
    let ce209689: number | undefined = undefined;
    if (bs209689Res.ok) {
      try {
        const bsJson = (await bs209689Res.json()) as {
          records?: {
            data?: {
              '52'?: { valueFloat?: number };
              '50'?: { valueFloat?: number };
            };
          };
        };
        ttg209689 = bsJson.records?.data?.['52']?.valueFloat;
        ce209689 = bsJson.records?.data?.['50']?.valueFloat;
      } catch {
        // Fallback gracefully
      }
    }

    let ev24hTotal: number | undefined = undefined;
    if (evcs374891Res.ok) {
      try {
        const evJson = (await evcs374891Res.json()) as {
          records?: {
            evE?: Array<[number, number]>;
          };
        };
        const points = evJson.records?.evE ?? [];
        if (points.length > 0) {
          ev24hTotal =
            Math.round(points.reduce((acc, [, val]) => acc + val, 0) * 100) /
            100;
        }
      } catch {
        // Fallback gracefully
      }
    }

    const weatherPromises = targetSiteIds.map((id) => {
      const loc = SITE_METADATA[id as keyof typeof SITE_METADATA]?.location;
      return loc
        ? this.fetchLiveWeather(loc.latitude, loc.longitude)
        : Promise.resolve(undefined);
    });
    const treeLoc = SITE_METADATA[100001].location;
    const [treeWeather, ...weatherList] = await Promise.all([
      this.fetchLiveWeather(treeLoc.latitude, treeLoc.longitude),
      ...weatherPromises,
    ]);

    const sysResponses = detailResponses.slice(0, 3);
    const overallResponses = detailResponses.slice(3, 6);
    const hourlyResponses = detailResponses.slice(6, 9);

    const demoItems: VictronDemoItemDto[] = [];

    for (let i = 0; i < targetSiteIds.length; i++) {
      const siteId = targetSiteIds[i]!;
      const meta = SITE_METADATA[siteId as keyof typeof SITE_METADATA];
      if (!meta) continue;

      const record = installationsData.records.find((r) => r.idSite === siteId);
      const extended = record?.extended ?? [];

      const getAttr = (code: string): number => {
        const found = extended.find((a) => a.code === code);
        return typeof found?.rawValue === 'number'
          ? Math.round(found.rawValue * 10) / 10
          : 0;
      };

      const getAttrString = (code: string): string => {
        const found = extended.find((a) => a.code === code);
        return found?.formattedValue ?? '';
      };

      // Real-time telemetry
      const solarYieldWatts = Math.max(0, getAttr('solar_yield'));
      const consumptionWatts = Math.max(0, getAttr('consumption'));
      const gridWatts = getAttr('from_to_grid');
      const batterySocPercent =
        getAttr('bs') ||
        (siteId === 209689 ? 100.0 : siteId === 219742 ? 28.0 : 51.0);
      const batteryVoltage =
        getAttr('bv') ||
        (siteId === 209689 ? 53.99 : siteId === 219742 ? 48.54 : 52.49);
      const batteryCurrentAmps =
        getAttr('bc') ||
        (siteId === 209689 ? 1.1 : siteId === 219742 ? -7.2 : -0.3);

      const batteryStateRaw =
        getAttrString('bst') || getAttrString('soc_status') || 'Charging';
      const batteryState = batteryStateRaw.toLowerCase().includes('discharg')
        ? 'Discharging'
        : batteryStateRaw.toLowerCase().includes('charg')
          ? 'Charging'
          : 'Idle';

      // Devices from system-overview
      const devices: VictronDeviceItemDto[] = [];
      try {
        const sysRes = sysResponses[i]!;
        if (sysRes.ok) {
          const sysJson = (await sysRes.json()) as {
            records?: {
              devices?: Array<{
                name?: string;
                modelName?: string;
                productName?: string;
                firmwareVersion?: string;
                deviceType?: string;
              }>;
            };
          };
          for (const d of sysJson.records?.devices ?? []) {
            devices.push({
              name: d.name || d.deviceType || 'Device',
              modelName:
                d.modelName || d.productName || d.name || 'Victron Component',
              productName: d.productName || d.name || 'Component',
              firmwareVersion: d.firmwareVersion || undefined,
              deviceType: d.deviceType || undefined,
            });
          }
        }
      } catch {
        // Fallback devices if parse fails
      }

      if (devices.length === 0) {
        devices.push(...this.getFallbackDevices(siteId));
      }

      // Energy breakdown (today, week, month, year) from overallstats
      let energyStats = this.getFallbackEnergyStats(siteId);
      try {
        const overallRes = overallResponses[i]!;
        if (overallRes.ok) {
          const statsJson = (await overallRes.json()) as {
            records?: {
              today?: { totals?: Record<string, number> };
              week?: { totals?: Record<string, number> };
              month?: { totals?: Record<string, number> };
              year?: { totals?: Record<string, number> };
            };
          };

          const parseTotals = (
            t?: Record<string, number>,
          ): VictronEnergyTotalsDto => ({
            solarYieldKwh: Math.round((t?.total_solar_yield ?? 0) * 100) / 100,
            consumptionKwh: Math.round((t?.total_consumption ?? 0) * 100) / 100,
            gridExportKwh: Math.round((t?.grid_history_to ?? 0) * 100) / 100,
            gridImportKwh: Math.round((t?.grid_history_from ?? 0) * 100) / 100,
          });

          if (statsJson.records?.today?.totals) {
            energyStats = {
              today: parseTotals(statsJson.records.today.totals),
              week: parseTotals(statsJson.records.week?.totals),
              month: parseTotals(statsJson.records.month?.totals),
              year: parseTotals(statsJson.records.year?.totals),
            };
          }
        }
      } catch {
        // Keep fallback
      }

      // Hourly data (24-hour interval points)
      let hourlyData: VictronHourlyPointDto[] = [];
      try {
        const hourlyRes = hourlyResponses[i]!;
        if (hourlyRes.ok) {
          const hJson = (await hourlyRes.json()) as {
            records?: {
              kwh?: Array<[number, number]>;
              Pc?: Array<[number, number]>;
              Pg?: Array<[number, number]>;
            };
          };

          const kwhMap = new Map(
            (hJson.records?.kwh || []).map(([ts, val]) => [ts, val]),
          );
          const pcMap = new Map(
            (hJson.records?.Pc || []).map(([ts, val]) => [ts, val]),
          );
          const pgMap = new Map(
            (hJson.records?.Pg || []).map(([ts, val]) => [ts, val]),
          );

          const allTimestamps = Array.from(
            new Set([...kwhMap.keys(), ...pcMap.keys()]),
          ).sort((a, b) => a - b);

          if (allTimestamps.length > 0) {
            hourlyData = allTimestamps.slice(-24).map((ts) => {
              const d = new Date(ts);
              const hourLabel = `${String(d.getHours()).padStart(2, '0')}:00`;
              return {
                hourLabel,
                solarKwh: Math.round((kwhMap.get(ts) || 0) * 100) / 100,
                consumptionKwh: Math.round((pcMap.get(ts) || 0) * 100) / 100,
                gridExportKwh: Math.round((pgMap.get(ts) || 0) * 100) / 100,
              };
            });
          }
        }
      } catch {
        // Keep fallback
      }

      if (hourlyData.length === 0) {
        hourlyData = this.getFallbackHourlyData(siteId);
      }

      const fwVersion = getAttrString('v') || 'v3.80';
      const systemType =
        getAttrString('st') || (siteId === 209689 ? 'Hub-1' : 'ESS');
      const systemState = getAttrString('ss') || getAttrString('S') || 'Bulk';
      const dbusRtt = getAttrString('rtt') || '2 ms';
      const acInput1 =
        getAttrString('si1') || (siteId === 209689 ? 'Generator' : 'Grid');
      const acInput2 =
        getAttrString('si2') || (siteId === 209689 ? 'None' : 'Generator');

      demoItems.push({
        siteId,
        key: meta.key,
        title: meta.title,
        category: meta.category,
        categoryBadge: meta.categoryBadge,
        narrative: meta.narrative,
        investorHighlight: meta.investorHighlight,
        projectedApy: meta.projectedApy,
        suggestedTargetUsdc: meta.suggestedTargetUsdc,
        identifier:
          record?.identifier ??
          (siteId === 209689 ? '48e7da86e0d9' : 'c0619ab27f32'),
        vrmUrl: `https://vrm.victronenergy.com/installation/${siteId}/dashboard`,
        location: meta.location,
        currentPower: {
          solarYieldWatts,
          consumptionWatts,
          gridWatts,
          batterySocPercent,
          batteryVoltage,
          batteryState,
        },
        dailyTotals: energyStats.today,
        energyStats,
        hourlyData,
        devices,
        systemInfo: {
          firmwareVersion: fwVersion,
          status: 'Online',
          systemType,
          systemState,
          batteryVoltage,
          batteryCurrentAmps,
          acInput1,
          acInput2,
          dbusRtt,
          batteryTimeToGoHours:
            siteId === 209689 ? (ttg209689 ?? 35.7) : undefined,
          batteryConsumedAh: siteId === 209689 ? (ce209689 ?? -2.4) : undefined,
          generatorState:
            siteId === 209689 ? getAttrString('gRC') || 'Stopped' : undefined,
          temperatureProbeCelsius:
            siteId === 374891
              ? parseFloat(getAttrString('tsT')) || 37.1
              : undefined,
          temperatureProbeName:
            siteId === 374891
              ? getAttrString('tscn') || 'TEST PARTER'
              : undefined,
        },
        financials: meta.financials,
        liveWeather: weatherList[i],
        evDeliveredKwh24h:
          siteId === 374891 ? (ev24hTotal ?? 265.42) : undefined,
      });
    }

    demoItems.unshift(this.createTreetinoV1DemoItem(treeWeather));

    return {
      demos: demoItems,
      updatedAt: new Date().toISOString(),
      source: 'Victron VRM API & Treetino Simulation Engine',
    };
  }

  private createTreetinoV1DemoItem(
    liveWeather?: VictronLiveWeatherDto,
  ): VictronDemoItemDto {
    const siteId = 100001;
    const meta = SITE_METADATA[siteId]!;

    // Ambient physics (grounded in live Open-Meteo conditions for Prague)
    const windSpeedMs = liveWeather
      ? Math.max(0.5, Math.round((liveWeather.windSpeedKmh / 3.6) * 10) / 10)
      : 6.8;

    // Ducted VAWT aerodynamics: cut-in 2.0 m/s, rated 12.0 m/s (35 kW peak), storm brake > 25 m/s
    let windYieldWatts = 0;
    if (windSpeedMs >= 2.0 && windSpeedMs <= 25.0) {
      if (windSpeedMs >= 12.0) {
        windYieldWatts = 35000;
      } else {
        const factor = (windSpeedMs - 2.0) / (12.0 - 2.0);
        windYieldWatts = Math.round(35000 * Math.pow(factor, 2.2));
      }
    }

    // Heliotropic solar leaves: 300 leaves, 10 kW peak, astronomical tracking +32%
    const solarIrradianceWm2 = liveWeather?.condition?.includes('Clear')
      ? 820
      : liveWeather?.condition?.includes('Cloud')
        ? 580
        : liveWeather?.condition?.includes('Rain')
          ? 220
          : 640;

    const solarYieldWatts = Math.min(
      10000,
      Math.round(10000 * (solarIrradianceWm2 / 1000) * 1.32),
    );

    const totalGenerationWatts = solarYieldWatts + windYieldWatts;

    // Commercial Off-Taker: MKovo s.r.o. CNC precision tooling base load
    const consumptionWatts = 14850;
    const netPower = totalGenerationWatts - consumptionWatts;

    let batteryState: 'Charging' | 'Discharging' | 'Idle' = 'Idle';
    const batterySocPercent = 84.5;
    const batteryVoltage = 53.48;
    let gridWatts = 0;

    if (netPower > 0) {
      batteryState = 'Charging';
      const batteryChargeWatts = Math.min(8000, netPower);
      gridWatts = -(netPower - batteryChargeWatts); // export to regional grid
    } else {
      batteryState = 'Discharging';
      const batteryDischargeWatts = Math.min(8000, -netPower);
      gridWatts = -netPower - batteryDischargeWatts; // import if needed
    }

    // Diagnostics & smart modes
    const noiseDbA = Math.round((21.0 + windSpeedMs * 1.1) * 10) / 10;
    const turbineRpm = windSpeedMs >= 2.0 ? Math.round(windSpeedMs * 48) : 0;
    const leafTrackingAngleDeg = 44;

    let activeAiMode = 'Sun Tracking & Ducted Venturi Boost';
    if (windSpeedMs > 25.0) {
      activeAiMode = 'Storm Wind Defense (Prapor Folded)';
    } else if (solarIrradianceWm2 < 150 && windSpeedMs > 8.0) {
      activeAiMode = 'Aerodynamic Synergy (Turbine Flow Optimization)';
    }

    const treeDiagnostics: VictronTreeDiagnosticsDto = {
      windSpeedMs,
      solarIrradianceWm2,
      noiseDbA,
      leafTrackingAngleDeg,
      turbineRpm,
      activeAiMode,
      clientName: 'MKovo s.r.o. (Precision Manufacturing)',
      clientTariff: 'USDC 0.32 / kWh metered corporate PPA',
    };

    const energyStats = this.getFallbackEnergyStats(siteId);
    const hourlyData = this.getFallbackHourlyData(siteId);
    const devices = this.getFallbackDevices(siteId);

    return {
      siteId,
      key: meta.key,
      title: meta.title,
      category: meta.category,
      categoryBadge: meta.categoryBadge,
      narrative: meta.narrative,
      investorHighlight: meta.investorHighlight,
      projectedApy: meta.projectedApy,
      suggestedTargetUsdc: meta.suggestedTargetUsdc,
      identifier: 'treenet-v1-001',
      vrmUrl: 'https://vrm.victronenergy.com/installation/100001/dashboard',
      location: meta.location,
      currentPower: {
        solarYieldWatts,
        consumptionWatts,
        gridWatts,
        batterySocPercent,
        batteryVoltage,
        batteryState,
      },
      windYieldWatts,
      totalGenerationWatts,
      treeDiagnostics,
      dailyTotals: energyStats.today,
      energyStats,
      hourlyData,
      devices,
      systemInfo: {
        firmwareVersion: 'v3.80-treetino',
        status: 'Online',
        systemType: 'Treetino Dual-Modality Microgrid',
        systemState: 'Synchronized',
        batteryVoltage,
        batteryCurrentAmps: batteryState === 'Charging' ? 14.5 : -12.0,
        acInput1: 'Distribution Grid Intertie',
        acInput2: 'MKovo s.r.o. Dedicated PPA Feed',
        dbusRtt: '1 ms',
      },
      financials: meta.financials,
      liveWeather: liveWeather ?? {
        tempCelsius: 16.5,
        humidityPercent: 62,
        windSpeedKmh: Math.round(windSpeedMs * 3.6 * 10) / 10,
        condition: 'Mainly Clear',
      },
    };
  }

  private getFallbackDevices(siteId: number): VictronDeviceItemDto[] {
    if (siteId === 100001) {
      return [
        {
          name: 'Core Gateway',
          modelName: 'Victron Cerbo GX',
          productName: 'Cerbo GX',
          firmwareVersion: 'v3.80',
          deviceType: 'gateway',
        },
        {
          name: 'Hybrid Inverter / Charger',
          modelName: 'MultiPlus-II 48/5000/70-50 230V',
          productName: 'MultiPlus-II',
          firmwareVersion: 'v506',
          deviceType: 'inverter',
        },
        {
          name: 'Solar MPPT Charge Controller',
          modelName: 'SmartSolar MPPT 250/100-Tr VE.Can',
          productName: 'SmartSolar MPPT',
          firmwareVersion: 'v1.61',
          deviceType: 'charger',
        },
        {
          name: 'Ducted VAWT Wind Controller',
          modelName: 'Treetino 48V/35kW Dynamic Rectifier & Dump Load',
          productName: 'VAWT Wind Controller',
          firmwareVersion: 'v2.14',
          deviceType: 'wind_charger',
        },
        {
          name: 'Battery Monitor & Storage',
          modelName: 'Lynx Smart BMS 500A (40 kWh LiFePO4)',
          productName: 'Lynx Smart BMS',
          firmwareVersion: 'v1.12',
          deviceType: 'battery_monitor',
        },
        {
          name: 'Primary Branch Actuators (350 kg)',
          modelName: '12x Dunkermotoren GR 80x80 + PLG 75 EP + BGE 6010 A',
          productName: 'Dunkermotoren GR 80x80',
          firmwareVersion: 'v4.02',
          deviceType: 'actuator',
        },
        {
          name: 'Secondary Branch Actuators (60 kg)',
          modelName: '10x Dunkermotoren GR 42x40 + PLG 52 HT + BGE 6005 A',
          productName: 'Dunkermotoren GR 42x40',
          firmwareVersion: 'v4.02',
          deviceType: 'actuator',
        },
        {
          name: 'Optical Sun Tracker & Wind Anemometer',
          modelName: 'Ultrasonic 2D Anemometer + Optical Lux Array',
          productName: 'Treetino Sensor Pod',
          firmwareVersion: 'v1.08',
          deviceType: 'sensor',
        },
        {
          name: 'Client Billing Sub-Meter',
          modelName: 'Carlo Gavazzi EM540 (MKovo s.r.o. Dedicated Sub-Meter)',
          productName: 'EM540',
          firmwareVersion: 'v2.01',
          deviceType: 'grid_meter',
        },
      ];
    }
    if (siteId === 209689) {
      return [
        {
          name: 'Gateway',
          modelName: 'Cerbo GX',
          productName: 'Cerbo GX',
          firmwareVersion: 'v3.80',
          deviceType: 'gateway',
        },
        {
          name: 'Battery Monitor',
          modelName: 'Lynx Smart BMS 500A',
          productName: 'Lynx Smart BMS',
          deviceType: 'battery_monitor',
        },
        {
          name: 'Inverter/Charger',
          modelName: 'Multi RS Smart 48V/6000VA/100A',
          productName: 'Multi RS Smart',
          deviceType: 'inverter',
        },
      ];
    }
    if (siteId === 219742) {
      return [
        {
          name: 'SCADA Controller & Gateway',
          modelName: 'Cerbo-S GX Industrial (Venus OS)',
          productName: 'WATTINO SCADA Gateway',
          firmwareVersion: 'v3.82-ind',
          deviceType: 'gateway',
        },
        {
          name: 'AI EMS Energy Management Dispatcher',
          modelName: 'WATTINO AI EMS Cloud Node',
          productName: 'WATTINO AI EMS (SVR + Spot)',
          firmwareVersion: 'v2.4.1',
          deviceType: 'gateway',
        },
        {
          name: 'BESS Power Conversion Inverters',
          modelName: 'WATTINO PCS 100/200 kW Bi-directional Array (50 Units)',
          productName: 'WATTINO PCS Inverter',
          deviceType: 'inverter',
        },
        {
          name: 'Automotive Lithium Battery Modules',
          modelName:
            'Samsung SDI Hungary NCM 622 Automotive (10.0 MWh - 50 Cabinets)',
          productName: 'Samsung SDI NCM 622 (4C Rated)',
          deviceType: 'battery',
        },
        {
          name: 'HV/MV Substation Interconnection',
          modelName:
            'Transformer Station 0.4 / 22 kV (ČEZ Distribuce SOP #4122602318)',
          productName: 'Transformer 0.4/22 kV & MV Switchgear',
          deviceType: 'grid_meter',
        },
        {
          name: 'Thermal Buffer Management',
          modelName: 'WATTINO 500L Thermal Energy Accumulator (-25°C to +45°C)',
          productName: 'Liquid Thermal Management System',
          deviceType: 'charger',
        },
        {
          name: 'Fire Protection & Safety System',
          modelName:
            'A1 Class Mineral Insulation (100mm) + Aerosol Fire Suppression',
          productName: 'Integrated Fire Safety System',
          deviceType: 'safety',
        },
      ];
    }
    return [
      {
        name: 'Gateway',
        modelName: 'Cerbo GX',
        productName: 'Cerbo GX',
        firmwareVersion: 'v3.90-beta5',
        deviceType: 'gateway',
      },
      {
        name: 'VE.Bus Inverter',
        modelName: 'Quattro 48/10000/140-2x100',
        productName: 'Quattro',
        deviceType: 'inverter',
      },
      {
        name: 'Battery Monitor',
        modelName: 'Lynx Shunt 1000A VE.Can',
        productName: 'Lynx Shunt',
        deviceType: 'battery_monitor',
      },
      {
        name: 'Solar Charger',
        modelName: 'SmartSolar MPPT VE.Can 250/100 rev2 (Bay A)',
        productName: 'SmartSolar MPPT',
        deviceType: 'charger',
      },
      {
        name: 'Solar Charger',
        modelName: 'SmartSolar MPPT VE.Can 250/100 rev2 (Bay B)',
        productName: 'SmartSolar MPPT',
        deviceType: 'charger',
      },
      {
        name: 'Solar Charger',
        modelName: 'SmartSolar MPPT RS 450/200',
        productName: 'SmartSolar RS',
        deviceType: 'charger',
      },
      {
        name: 'PV Inverter',
        modelName: 'Fronius Symo 10.0-3-M (Plaza Main)',
        productName: 'Fronius Symo',
        deviceType: 'pv_inverter',
      },
      {
        name: 'Grid Meter',
        modelName: 'Energy Meter VM-3P75CT',
        productName: 'VM-3P75CT',
        deviceType: 'grid_meter',
      },
      {
        name: 'Temperature Sensor',
        modelName: 'RuuviTag wireless environmental probe',
        productName: 'RuuviTag',
        deviceType: 'sensor',
      },
      {
        name: 'EV Charger #1',
        modelName: 'Victron EV Charging Station 32A',
        productName: 'EVCS-32A',
        deviceType: 'ev_charger',
      },
      {
        name: 'EV Charger #2',
        modelName: 'Victron EV Charging Station 32A',
        productName: 'EVCS-32A',
        deviceType: 'ev_charger',
      },
      {
        name: 'EV Charger #3',
        modelName: 'Victron EV Charging Station 32A',
        productName: 'EVCS-32A',
        deviceType: 'ev_charger',
      },
      {
        name: 'EV Charger #4',
        modelName: 'Victron EV Charging Station 32A NS',
        productName: 'EVCS-32A-NS',
        deviceType: 'ev_charger',
      },
    ];
  }

  private getFallbackHourlyData(siteId: number): VictronHourlyPointDto[] {
    const hours = [
      '00:00',
      '01:00',
      '02:00',
      '03:00',
      '04:00',
      '05:00',
      '06:00',
      '07:00',
      '08:00',
      '09:00',
      '10:00',
      '11:00',
      '12:00',
      '13:00',
      '14:00',
      '15:00',
      '16:00',
      '17:00',
      '18:00',
      '19:00',
      '20:00',
      '21:00',
      '22:00',
      '23:00',
    ];
    if (siteId === 100001) {
      // 24-hour dual-modality profile: continuous wind base + daytime heliotropic solar peak + MKovo industrial shift load
      const solarProfile = [
        0, 0, 0, 0, 0, 0.2, 1.1, 2.8, 5.2, 7.8, 9.4, 9.8, 9.5, 8.9, 7.1, 4.8,
        2.2, 0.8, 0.1, 0, 0, 0, 0, 0,
      ];
      const windProfile = [
        6.2, 6.8, 7.1, 7.5, 7.2, 6.9, 6.5, 6.8, 7.4, 8.1, 8.8, 9.2, 9.5, 9.1,
        8.6, 8.2, 8.0, 8.5, 9.1, 9.4, 8.8, 7.9, 7.2, 6.5,
      ];
      const loadProfile = [
        4.5, 4.5, 4.2, 4.2, 5.8, 9.5, 14.8, 16.2, 16.5, 16.8, 17.0, 16.5, 15.8,
        16.2, 16.8, 16.5, 15.2, 14.8, 11.2, 8.5, 6.2, 5.0, 4.5, 4.5,
      ];
      return hours.map((hourLabel, i) => {
        const generation = solarProfile[i]! + windProfile[i]!;
        const load = loadProfile[i]!;
        const exportKwh = Math.max(
          0,
          Math.round((generation - load) * 100) / 100,
        );
        return {
          hourLabel,
          solarKwh: Math.round(generation * 100) / 100,
          consumptionKwh: load,
          gridExportKwh: exportKwh,
        };
      });
    }
    if (siteId === 219742) {
      // BESS Přeštice 8.6 MW: SVR + Spot Co-optimized Stacking Profile (Slide 9)
      // 00:00-05:00: Night charging + aFRR-
      // 07:00-09:00: Morning peak discharge + SVR
      // 11:00-15:00: Midday solar oversupply charging (negative prices)
      // 17:00-21:00: Evening peak discharge + aFRR+ (180-320+ EUR/MWh)
      const chargeProfile = [
        3.2, 3.8, 4.1, 3.6, 2.8, 0.4, 0, 0, 0, 0.2, 0.8, 4.5, 6.2, 5.8, 4.2,
        0.5, 0, 0, 0, 0, 0, 0.2, 1.4, 2.5,
      ];
      const exportProfile = [
        0, 0, 0, 0, 0, 0.5, 2.8, 5.9, 5.4, 1.2, 0, 0, 0, 0, 0, 0, 1.2, 4.8, 6.2,
        6.2, 5.1, 2.4, 0.5, 0,
      ];
      return hours.map((hourLabel, i) => ({
        hourLabel,
        solarKwh: 0,
        consumptionKwh: chargeProfile[i]!,
        gridExportKwh: exportProfile[i]!,
      }));
    }
    if (siteId === 374891) {
      // EV Plaza high throughput
      const solarProfile = [
        0, 0, 0, 0, 0, 0.05, 0.1, 0.3, 0.5, 0.7, 0.8, 0.85, 0.8, 0.7, 0.5, 0.3,
        0.1, 0.05, 0, 0, 0, 0, 0, 0,
      ];
      const loadProfile = [
        2.1, 1.5, 1.2, 1.1, 1.8, 3.5, 6.2, 8.9, 9.4, 8.8, 7.9, 8.2, 9.1, 8.5,
        7.8, 8.9, 9.8, 10.5, 11.2, 9.8, 7.5, 5.1, 3.8, 2.8,
      ];
      return hours.map((hourLabel, i) => ({
        hourLabel,
        solarKwh: solarProfile[i]!,
        consumptionKwh: loadProfile[i]!,
        gridExportKwh: 0,
      }));
    }
    // Off-grid residential
    const solarProfile = [
      0, 0, 0, 0, 0, 0.05, 0.2, 0.45, 0.7, 0.85, 0.95, 0.98, 0.92, 0.8, 0.6,
      0.35, 0.15, 0.05, 0, 0, 0, 0, 0, 0,
    ];
    const loadProfile = [
      0.15, 0.12, 0.12, 0.11, 0.14, 0.22, 0.35, 0.42, 0.31, 0.25, 0.22, 0.28,
      0.31, 0.24, 0.22, 0.29, 0.38, 0.45, 0.48, 0.41, 0.32, 0.24, 0.19, 0.16,
    ];
    return hours.map((hourLabel, i) => ({
      hourLabel,
      solarKwh: solarProfile[i]!,
      consumptionKwh: loadProfile[i]!,
      gridExportKwh: 0,
    }));
  }

  private getFallbackEnergyStats(siteId: number) {
    if (siteId === 100001) {
      return {
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
      };
    }
    if (siteId === 209689) {
      return {
        today: {
          solarYieldKwh: 5.85,
          consumptionKwh: 4.97,
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
      };
    }
    if (siteId === 219742) {
      return {
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
      };
    }
    return {
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
    };
  }

  private getFallbackData(): VictronDemosResponseDto {
    const siteIds = [209689, 219742, 374891];
    const demos: VictronDemoItemDto[] = siteIds.map((siteId) => {
      const meta = SITE_METADATA[siteId as keyof typeof SITE_METADATA]!;
      const energyStats = this.getFallbackEnergyStats(siteId);
      const devices = this.getFallbackDevices(siteId);
      const hourlyData = this.getFallbackHourlyData(siteId);

      const currentPower =
        siteId === 209689
          ? {
              solarYieldWatts: 337,
              consumptionWatts: 246,
              gridWatts: 0,
              batterySocPercent: 100.0,
              batteryVoltage: 53.99,
              batteryState: 'Charging',
            }
          : siteId === 219742
            ? {
                solarYieldWatts: 1540,
                consumptionWatts: 455,
                gridWatts: -34,
                batterySocPercent: 28.0,
                batteryVoltage: 48.54,
                batteryState: 'Discharging',
              }
            : {
                solarYieldWatts: 543,
                consumptionWatts: 8871,
                gridWatts: 8333,
                batterySocPercent: 51.0,
                batteryVoltage: 52.49,
                batteryState: 'Idle',
              };

      return {
        siteId,
        key: meta.key,
        title: meta.title,
        category: meta.category,
        categoryBadge: meta.categoryBadge,
        narrative: meta.narrative,
        investorHighlight: meta.investorHighlight,
        projectedApy: meta.projectedApy,
        suggestedTargetUsdc: meta.suggestedTargetUsdc,
        identifier: siteId === 209689 ? '48e7da86e0d9' : 'c0619ab27f32',
        vrmUrl: `https://vrm.victronenergy.com/installation/${siteId}/dashboard`,
        location: meta.location,
        currentPower,
        dailyTotals: energyStats.today,
        energyStats,
        hourlyData,
        devices,
        systemInfo: {
          firmwareVersion: siteId === 374891 ? 'v3.90-beta5' : 'v3.80',
          status: 'Online',
          systemType: siteId === 209689 ? 'Hub-1' : 'ESS',
          systemState: 'Bulk',
          batteryVoltage: currentPower.batteryVoltage,
          batteryCurrentAmps:
            siteId === 209689 ? 1.1 : siteId === 219742 ? -7.2 : -0.3,
          acInput1: siteId === 209689 ? 'Generator' : 'Grid',
          acInput2: siteId === 209689 ? 'None' : 'Generator',
          dbusRtt: '2 ms',
          batteryTimeToGoHours: siteId === 209689 ? 35.7 : undefined,
          batteryConsumedAh: siteId === 209689 ? -2.4 : undefined,
          generatorState: siteId === 209689 ? 'Stopped' : undefined,
          temperatureProbeCelsius: siteId === 374891 ? 37.1 : undefined,
          temperatureProbeName: siteId === 374891 ? 'TEST PARTER' : undefined,
        },
        financials: meta.financials,
        liveWeather: {
          tempCelsius:
            siteId === 209689 ? 20.3 : siteId === 219742 ? 16.1 : 17.8,
          humidityPercent: siteId === 209689 ? 75 : siteId === 219742 ? 73 : 67,
          windSpeedKmh: siteId === 209689 ? 8.0 : siteId === 219742 ? 6.8 : 7.6,
          condition: siteId === 374891 ? 'Mainly Clear' : 'Partly Cloudy',
        },
        evDeliveredKwh24h: siteId === 374891 ? 265.42 : undefined,
      };
    });

    demos.unshift(this.createTreetinoV1DemoItem());

    return {
      demos,
      updatedAt: new Date().toISOString(),
      source: 'Victron VRM Telemetry (Cached Snapshot)',
    };
  }

  private async fetchLiveWeather(
    lat: number,
    lon: number,
  ): Promise<VictronLiveWeatherDto | undefined> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`,
        { signal: controller.signal },
      );
      clearTimeout(timeout);
      if (!res.ok) return undefined;
      const json = (await res.json()) as {
        current?: {
          temperature_2m?: number;
          relative_humidity_2m?: number;
          wind_speed_10m?: number;
          weather_code?: number;
        };
      };
      if (!json.current) return undefined;
      const code = json.current.weather_code ?? 0;
      let condition = 'Partly Cloudy';
      if (code === 0) condition = 'Clear Sky';
      else if (code === 1) condition = 'Mainly Clear';
      else if (code === 2) condition = 'Partly Cloudy';
      else if (code === 3) condition = 'Overcast';
      else if (code >= 45 && code <= 48) condition = 'Foggy';
      else if (code >= 51 && code <= 67) condition = 'Rain';
      else if (code >= 71 && code <= 77) condition = 'Snow';
      else if (code >= 80 && code <= 82) condition = 'Rain Showers';
      else if (code >= 95) condition = 'Thunderstorm';

      return {
        tempCelsius: Math.round((json.current.temperature_2m ?? 18) * 10) / 10,
        humidityPercent: Math.round(json.current.relative_humidity_2m ?? 65),
        windSpeedKmh: Math.round((json.current.wind_speed_10m ?? 8) * 10) / 10,
        condition,
      };
    } catch {
      return undefined;
    }
  }
}
