import { ApiProperty } from '@nestjs/swagger';

export class VictronPowerStatsDto {
  @ApiProperty({ description: 'Current solar yield in Watts', example: 438 })
  solarYieldWatts!: number;

  @ApiProperty({
    description: 'Current load consumption in Watts',
    example: 299,
  })
  consumptionWatts!: number;

  @ApiProperty({
    description:
      'Current grid power in Watts (positive = import, negative = export)',
    example: 0,
  })
  gridWatts!: number;

  @ApiProperty({
    description: 'Battery state of charge percentage',
    example: 96.6,
  })
  batterySocPercent!: number;

  @ApiProperty({ description: 'Battery voltage in Volts', example: 53.99 })
  batteryVoltage!: number;

  @ApiProperty({
    description: 'Battery operational state',
    example: 'Charging',
    enum: ['Charging', 'Discharging', 'Idle'],
  })
  batteryState!: string;
}

export class VictronEnergyTotalsDto {
  @ApiProperty({ description: 'Solar yield in kWh', example: 6.28 })
  solarYieldKwh!: number;

  @ApiProperty({ description: 'Consumption in kWh', example: 5.17 })
  consumptionKwh!: number;

  @ApiProperty({ description: 'Grid export in kWh', example: 0 })
  gridExportKwh!: number;

  @ApiProperty({ description: 'Grid import in kWh', example: 0 })
  gridImportKwh!: number;
}

export class VictronEnergyStatsDto {
  @ApiProperty({ type: VictronEnergyTotalsDto })
  today!: VictronEnergyTotalsDto;

  @ApiProperty({ type: VictronEnergyTotalsDto })
  week!: VictronEnergyTotalsDto;

  @ApiProperty({ type: VictronEnergyTotalsDto })
  month!: VictronEnergyTotalsDto;

  @ApiProperty({ type: VictronEnergyTotalsDto })
  year!: VictronEnergyTotalsDto;
}

export class VictronHourlyPointDto {
  @ApiProperty({ example: '14:00' })
  hourLabel!: string;

  @ApiProperty({ example: 4.65 })
  solarKwh!: number;

  @ApiProperty({ example: 1.49 })
  consumptionKwh!: number;

  @ApiProperty({ example: 3.15 })
  gridExportKwh!: number;
}

export class VictronLocationDto {
  @ApiProperty({ example: 'Amsterdam' })
  city!: string;

  @ApiProperty({ example: 'Netherlands' })
  country!: string;

  @ApiProperty({ example: 52.3629 })
  latitude!: number;

  @ApiProperty({ example: 4.89298 })
  longitude!: number;

  @ApiProperty({ example: 'Europe/Amsterdam' })
  timezone!: string;
}

export class VictronDeviceItemDto {
  @ApiProperty({ example: 'VE.Bus System' })
  name!: string;

  @ApiProperty({ example: 'MultiPlus-II 48/3000/35-32' })
  modelName!: string;

  @ApiProperty({ example: 'MultiPlus-II' })
  productName!: string;

  @ApiProperty({ example: 'v3.80', required: false })
  firmwareVersion?: string;

  @ApiProperty({ example: 'inverter', required: false })
  deviceType?: string;
}

export class VictronSystemInfoDto {
  @ApiProperty({ example: 'v3.80' })
  firmwareVersion!: string;

  @ApiProperty({ example: 'Online' })
  status!: string;

  @ApiProperty({ example: 'ESS' })
  systemType!: string;

  @ApiProperty({ example: 'Bulk' })
  systemState!: string;

  @ApiProperty({ example: 48.54 })
  batteryVoltage!: number;

  @ApiProperty({ example: -7.2 })
  batteryCurrentAmps!: number;

  @ApiProperty({ example: 'Grid' })
  acInput1!: string;

  @ApiProperty({ example: 'Generator' })
  acInput2!: string;

  @ApiProperty({ example: '1 ms' })
  dbusRtt!: string;

  @ApiProperty({
    example: 41.67,
    required: false,
    description: 'Estimated battery runtime remaining in hours',
  })
  batteryTimeToGoHours?: number;

  @ApiProperty({
    example: -2.3,
    required: false,
    description: 'Cumulative battery consumed Amphours',
  })
  batteryConsumedAh?: number;

  @ApiProperty({
    example: 'Stopped',
    required: false,
    description: 'Backup generator operational state',
  })
  generatorState?: string;

  @ApiProperty({
    example: 37.1,
    required: false,
    description: 'Wireless IoT environmental probe temperature in Celsius',
  })
  temperatureProbeCelsius?: number;

  @ApiProperty({
    example: 'TEST PARTER',
    required: false,
    description: 'Hardware label of the wireless temperature probe',
  })
  temperatureProbeName?: string;
}

export class VictronLiveWeatherDto {
  @ApiProperty({ example: 17.8 })
  tempCelsius!: number;

  @ApiProperty({ example: 67 })
  humidityPercent!: number;

  @ApiProperty({ example: 7.6 })
  windSpeedKmh!: number;

  @ApiProperty({ example: 'Partly Cloudy' })
  condition!: string;
}

export class VictronWaterfallStepDto {
  @ApiProperty({ example: 'Gross Energy Revenue' })
  title!: string;

  @ApiProperty({ example: '100%' })
  percentage!: string;

  @ApiProperty({ example: '$7,100 / yr' })
  amount!: string;

  @ApiProperty({
    example: 'Collected via grid feed-in arbitrage and capacity fees',
  })
  description!: string;
}

export class VictronFinancialsDto {
  @ApiProperty({ example: 50000 })
  targetUsdc!: number;

  @ApiProperty({ example: 38500 })
  fundedUsdc!: number;

  @ApiProperty({ example: 77.0 })
  fundedPercent!: number;

  @ApiProperty({ example: 1.0 })
  sharePriceUsdc!: number;

  @ApiProperty({ example: 50000 })
  totalShares!: number;

  @ApiProperty({ example: 14.2 })
  projectedApy!: number;

  @ApiProperty({ example: 19.45 })
  estDailyRevenueUsdc!: number;

  @ApiProperty({ example: 591.67 })
  estMonthlyRevenueUsdc!: number;

  @ApiProperty({ example: 7100 })
  estAnnualRevenueUsdc!: number;

  @ApiProperty({
    example: '$0.35/kWh peak arbitrage spread + grid balancing capacity fees',
  })
  tariffRate!: string;

  @ApiProperty({
    example:
      'Monetizes grid frequency regulation, peak shaving, and energy arbitrage.',
  })
  revenueModelDescription!: string;

  @ApiProperty({ type: [VictronWaterfallStepDto] })
  cashFlowWaterfall!: VictronWaterfallStepDto[];
}

export class VictronTreeDiagnosticsDto {
  @ApiProperty({ example: 7.8, description: 'Ambient wind speed in m/s' })
  windSpeedMs!: number;

  @ApiProperty({ example: 720, description: 'Solar irradiance in W/m²' })
  solarIrradianceWm2!: number;

  @ApiProperty({
    example: 31.4,
    description: 'Measured acoustic noise in dB(A) at 10m',
  })
  noiseDbA!: number;

  @ApiProperty({
    example: 42,
    description: 'Heliotropic leaf elevation angle in degrees',
  })
  leafTrackingAngleDeg!: number;

  @ApiProperty({ example: 420, description: 'Ducted wind turbine rotor RPM' })
  turbineRpm!: number;

  @ApiProperty({
    example: 'Sun Tracking & Venturi Boost',
    description: 'Active smart AI operating mode',
  })
  activeAiMode!: string;

  @ApiProperty({
    example: 'MKovo s.r.o. (Precision Manufacturing)',
    description: 'Commercial off-taker name',
  })
  clientName!: string;

  @ApiProperty({
    example: '$0.32 / kWh metered corporate PPA',
    description: 'Metered energy tariff rate for the client',
  })
  clientTariff!: string;
}

export class VictronDemoItemDto {
  @ApiProperty({ description: 'Victron VRM site ID', example: 209689 })
  siteId!: number;

  @ApiProperty({
    description: 'Internal key',
    example: 'offgrid',
    enum: ['offgrid', 'ess', 'ev', 'treetino-v1'],
  })
  key!: 'offgrid' | 'ess' | 'ev' | 'treetino-v1';

  @ApiProperty({
    description: 'Asset display title',
    example: 'Off-Grid Solar Microgrid',
  })
  title!: string;

  @ApiProperty({
    description: 'Asset category / DePIN archetype',
    example: 'Grassroots DePIN',
  })
  category!: string;

  @ApiProperty({
    description: 'Short badge category',
    example: 'Off-Grid Solar',
  })
  categoryBadge!: string;

  @ApiProperty({ description: 'Strategic investment thesis and narrative' })
  narrative!: string;

  @ApiProperty({ description: 'Key investor value proposition' })
  investorHighlight!: string;

  @ApiProperty({
    description: 'Projected annual percentage yield',
    example: '8.5%',
  })
  projectedApy!: string;

  @ApiProperty({
    description: 'Suggested funding target in EURTree',
    example: '10000',
  })
  suggestedTargetUsdc!: string;

  @ApiProperty({
    description: 'Hardware identifier from Venus OS',
    example: '48e7da86e0d9',
  })
  identifier!: string;

  @ApiProperty({ description: 'Direct URL to official Victron VRM Dashboard' })
  vrmUrl!: string;

  @ApiProperty({
    description: 'Installation geographic location',
    type: VictronLocationDto,
  })
  location!: VictronLocationDto;

  @ApiProperty({
    description: 'Live instantaneous power telemetry',
    type: VictronPowerStatsDto,
  })
  currentPower!: VictronPowerStatsDto;

  @ApiProperty({
    description: 'Cumulative daily energy totals',
    type: VictronEnergyTotalsDto,
  })
  dailyTotals!: VictronEnergyTotalsDto;

  @ApiProperty({
    description: 'Comprehensive energy breakdown over time',
    type: VictronEnergyStatsDto,
  })
  energyStats!: VictronEnergyStatsDto;

  @ApiProperty({
    description: '24-hour hourly energy production and consumption points',
    type: [VictronHourlyPointDto],
  })
  hourlyData!: VictronHourlyPointDto[];

  @ApiProperty({
    description: 'All detected hardware devices connected to Cerbo GX',
    type: [VictronDeviceItemDto],
  })
  devices!: VictronDeviceItemDto[];

  @ApiProperty({
    description: 'Venus OS system and connectivity diagnostics',
    type: VictronSystemInfoDto,
  })
  systemInfo!: VictronSystemInfoDto;

  @ApiProperty({
    description: 'Transparent investment and revenue distribution financials',
    type: VictronFinancialsDto,
  })
  financials!: VictronFinancialsDto;

  @ApiProperty({
    description: 'Real-time weather conditions at site coordinates',
    type: VictronLiveWeatherDto,
    required: false,
  })
  liveWeather?: VictronLiveWeatherDto;

  @ApiProperty({
    description:
      'Total energy delivered directly to EV vehicles in past 24 hours (kWh)',
    example: 265.42,
    required: false,
  })
  evDeliveredKwh24h?: number;

  @ApiProperty({
    description: 'Instantaneous wind turbine generation in Watts',
    example: 14200,
    required: false,
  })
  windYieldWatts?: number;

  @ApiProperty({
    description: 'Instantaneous combined generation (solar + wind) in Watts',
    example: 21040,
    required: false,
  })
  totalGenerationWatts?: number;

  @ApiProperty({
    description: 'Diagnostics specific to dual-modality Treetino trees',
    type: VictronTreeDiagnosticsDto,
    required: false,
  })
  treeDiagnostics?: VictronTreeDiagnosticsDto;
}

export class VictronDemosResponseDto {
  @ApiProperty({
    description: 'List of Victron live demo installations',
    type: [VictronDemoItemDto],
  })
  demos!: VictronDemoItemDto[];

  @ApiProperty({ description: 'ISO timestamp of telemetry fetch' })
  updatedAt!: string;

  @ApiProperty({
    description: 'Source of the data',
    example: 'Victron VRM API (loginAsDemo)',
  })
  source!: string;
}
