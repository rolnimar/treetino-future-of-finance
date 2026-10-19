import { useState } from 'react';
import type { VictronDemoItem } from '../victron-types';
import {
  SunIcon,
  BatteryIcon,
  PowerPlugIcon,
  GridIcon,
  WindIcon,
} from '../victron-icons';
import {
  InstallationHeader,
  FlowSummaryBanner,
  StreamingYieldTicker,
  TelemetrySidepanel,
  CashFlowDossier,
  SchematicCard,
  ConduitLine,
} from '../components';

import type { InvestmentRecord } from '../use-victron-investments';

export interface TreetinoLayoutProps {
  demo: VictronDemoItem;
  holding?: InvestmentRecord;
  onClaim?: (
    siteId: number,
    baseAmount: number,
    kaminoBonus: number,
  ) => Promise<void>;
  isClaiming?: boolean;
  claimSuccessText?: string | null;
  claimErrorText?: string | null;
  onBackProject?: () => void;
}

export function TreetinoLayout({
  demo,
  holding,
  onClaim,
  isClaiming,
  claimSuccessText,
  claimErrorText,
  onBackProject,
}: TreetinoLayoutProps) {
  const [flowMode, setFlowMode] = useState<'both' | 'power' | 'funds'>('both');

  // Interactive Simulation Controls
  const initialWind = demo.treeDiagnostics?.windSpeedMs ?? 6.8;
  const initialIrradiance = demo.treeDiagnostics?.solarIrradianceWm2 ?? 640;
  const initialMode =
    demo.treeDiagnostics?.activeAiMode ?? 'Sun Tracking & Venturi Boost';

  const [simWindSpeed, setSimWindSpeed] = useState<number>(initialWind);
  const [simIrradiance, setSimIrradiance] = useState<number>(initialIrradiance);
  const [selectedAiMode, setSelectedAiMode] = useState<string>(initialMode);
  const [isSimulating, setIsSimulating] = useState(false);

  // Physics simulation formulas based on Treetino V1 Technical Specification
  // 12x Ducted VAWT Turbines: Cut-in 2.0 m/s, rated 35 kW at 12.0 m/s, storm brake > 25.0 m/s
  let currentWindWatts = 0;
  if (
    simWindSpeed >= 2.0 &&
    simWindSpeed <= 25.0 &&
    selectedAiMode !== 'Storm Wind Defense (Prapor Folded)'
  ) {
    if (simWindSpeed >= 12.0) {
      currentWindWatts = 35000;
    } else {
      const factor = (simWindSpeed - 2.0) / (12.0 - 2.0);
      currentWindWatts = Math.round(35000 * Math.pow(factor, 2.2));
    }
  }

  // 300 Heliotropic Solar Leaves: 10 kW peak, +32% tracking boost
  const currentSolarWatts =
    selectedAiMode === 'Storm Wind Defense (Prapor Folded)'
      ? Math.min(3500, Math.round(10000 * (simIrradiance / 1000) * 0.35))
      : selectedAiMode === 'Hail Protection (Ground Tilt)'
        ? Math.min(500, Math.round(10000 * (simIrradiance / 1000) * 0.05))
        : Math.min(10000, Math.round(10000 * (simIrradiance / 1000) * 1.32));

  const totalGenWatts = currentSolarWatts + currentWindWatts;

  // Off-taker Client Load: MKovo s.r.o. CNC factory load (~14.8 kW)
  const clientLoadWatts = 14850;
  const netPower = totalGenWatts - clientLoadWatts;

  const batteryState =
    netPower > 0 ? 'Charging' : netPower < 0 ? 'Discharging' : 'Idle';
  const batteryChargeWatts = netPower > 0 ? Math.min(8000, netPower) : 0;
  const gridWatts =
    netPower > 0
      ? -(netPower - batteryChargeWatts) // Exporting to grid (negative)
      : -netPower - Math.min(8000, -netPower); // Importing from grid (positive)

  // Diagnostics
  const calculatedNoise = Math.min(
    34.8,
    Math.round((20.0 + simWindSpeed * 1.1) * 10) / 10,
  );
  const calculatedRpm =
    simWindSpeed >= 2.0 &&
    selectedAiMode !== 'Storm Wind Defense (Prapor Folded)'
      ? Math.round(simWindSpeed * 48)
      : 0;
  const trackingElevation =
    selectedAiMode === 'Storm Wind Defense (Prapor Folded)'
      ? 0
      : selectedAiMode === 'Hail Protection (Ground Tilt)'
        ? -75
        : 44;

  const resetSimulation = () => {
    setSimWindSpeed(initialWind);
    setSimIrradiance(initialIrradiance);
    setSelectedAiMode(initialMode);
    setIsSimulating(false);
  };

  const { dailyTotals, financials } = demo;
  const clientPpaRate = 0.32; // USDC 0.32 / kWh metered corporate PPA
  const dailyDisplacedSavings = (
    dailyTotals.solarYieldKwh * clientPpaRate
  ).toFixed(2);
  const annualPoolDistribution = (
    financials.targetUsdc *
    (financials.projectedApy / 100)
  ).toLocaleString();

  const solarTrend = demo.hourlyData.map((d) => d.solarKwh);
  const loadTrend = demo.hourlyData.map((d) => d.consumptionKwh);
  const batteryTrend = [82, 83, 83.8, 84.2, 84.5];

  return (
    <div className="rounded-3xl border border-black/10 bg-white p-6 sm:p-8 shadow-xs space-y-6">
      {/* 1. REUSABLE INSTALLATION HEADER */}
      <InstallationHeader
        demo={demo}
        flowMode={flowMode}
        onFlowModeChange={setFlowMode}
        badgeOverride="Dual-Modality 45 kW · Biomimetic Tree"
      />

      {/* 2. INTERACTIVE PHYSICS SIMULATION CONTROLS */}
      <div className="rounded-2xl border border-black/10 bg-zinc-50/80 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-3.5">
          <div className="flex items-center gap-2 font-mono">
            <span className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">
              Hardware Physics Simulator
            </span>
            {isSimulating && (
              <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                Active
              </span>
            )}
          </div>
          {isSimulating && (
            <button
              type="button"
              onClick={resetSimulation}
              className="font-mono text-xs font-medium text-[#183d89] hover:underline cursor-pointer"
            >
              Reset to Live Weather
            </button>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-3">
          {/* Slider 1: Wind Speed */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="font-medium text-zinc-800 flex items-center gap-1.5">
                <WindIcon className="h-3.5 w-3.5 text-zinc-500" />
                Wind Speed
              </span>
              <span className="font-semibold text-zinc-950">
                {simWindSpeed.toFixed(1)} m/s ({(simWindSpeed * 3.6).toFixed(1)}{' '}
                km/h)
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="28"
              step="0.2"
              value={simWindSpeed}
              onChange={(e) => {
                setSimWindSpeed(parseFloat(e.target.value));
                setIsSimulating(true);
              }}
              className="w-full accent-[#183d89] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
              <span>0 m/s (Calm)</span>
              <span>12 m/s (Rated)</span>
              <span>28 m/s (Storm)</span>
            </div>
          </div>

          {/* Slider 2: Solar Irradiance */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="font-medium text-zinc-800 flex items-center gap-1.5">
                <SunIcon className="h-3.5 w-3.5 text-amber-500" />
                Solar Irradiance
              </span>
              <span className="font-semibold text-zinc-950">
                {simIrradiance} W/m²
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1100"
              step="10"
              value={simIrradiance}
              onChange={(e) => {
                setSimIrradiance(parseInt(e.target.value, 10));
                setIsSimulating(true);
              }}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
              <span>0 W/m² (Night)</span>
              <span>750 (Sun)</span>
              <span>1,100 W/m²</span>
            </div>
          </div>

          {/* Selector: Smart AI Defense Mode */}
          <div className="space-y-1.5">
            <label className="block text-xs font-mono font-medium text-zinc-800">
              AI Operating Mode
            </label>
            <select
              value={selectedAiMode}
              onChange={(e) => {
                setSelectedAiMode(e.target.value);
                setIsSimulating(true);
              }}
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-1.5 font-mono text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#183d89] cursor-pointer"
            >
              <option value="Sun Tracking & Venturi Boost">
                Sun Tracking & Venturi Boost
              </option>
              <option value="Storm Wind Defense (Prapor Folded)">
                Storm Wind Defense (&gt;25 m/s)
              </option>
              <option value="Hail Protection (Ground Tilt)">
                Hail Protection (Ground Tilt)
              </option>
              <option value="Aerodynamic Synergy (Turbine Flow Optimization)">
                Aerodynamic Flow Optimization
              </option>
            </select>
            <div className="text-[10px] text-zinc-400 font-mono">
              22 actuators positioning 300 leaves
            </div>
          </div>
        </div>
      </div>

      {/* 3. REUSABLE FLOW SUMMARY BANNER */}
      <FlowSummaryBanner
        generation={{
          label: 'Combined Generation',
          value: `${(totalGenWatts / 1000).toFixed(2)} kW Total`,
          subtext: `Solar: ${(currentSolarWatts / 1000).toFixed(2)} kW · Wind: ${(currentWindWatts / 1000).toFixed(2)} kW`,
        }}
        consumption={{
          label: 'MKovo s.r.o. Off-Take',
          value: `${(clientLoadWatts / 1000).toFixed(2)} kW Active`,
          subtext: 'Metered precision CNC tooling machinery',
        }}
        revenueOrSavings={{
          label: 'Metered PPA Revenue',
          value: `+USDC ${dailyDisplacedSavings} / day`,
          subtext: 'Contracted tariff (USDC 0.32/kWh direct corporate PPA)',
        }}
        investorYield={{
          apyPercent: financials.projectedApy,
          annualDistribution: annualPoolDistribution,
          subtext: 'Programmatic USDC distributions streamed on Solana',
        }}
      />

      {/* 4. REUSABLE STREAMING YIELD TICKER */}
      <StreamingYieldTicker
        assetName="Treetino V1 Tree"
        siteId={demo.siteId}
        holding={holding}
        financials={financials}
        onBackProject={onBackProject}
        onClaim={onClaim}
        isClaiming={isClaiming}
        claimSuccessText={claimSuccessText}
        claimErrorText={claimErrorText}
      />

      {/* 5. SCHEMATIC CANVAS + UNCOUPLED TELEMETRY SIDEPANEL */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        {/* LEFT 9 COLS: ELECTRICAL CIRCUIT SCHEMATIC CANVAS */}
        <div className="xl:col-span-9 overflow-x-auto rounded-3xl border border-black/10 bg-zinc-50/50 p-4 sm:p-6 flex items-center shadow-xs">
          <svg
            viewBox="0 0 770 420"
            className="w-full h-auto min-w-[680px] select-none"
          >
            {/* CONDUIT PIPES */}
            {/* Pipe 1: Solar Leaves (235, 105) -> Trunk Core (280, 105) */}
            <ConduitLine
              x1={235}
              y1={105}
              x2={280}
              y2={105}
              flow={
                flowMode !== 'funds' && currentSolarWatts > 0 ? 'amber' : null
              }
            />

            {/* Pipe 2: Trunk Core (490, 105) -> MKovo s.r.o. (535, 105) */}
            <ConduitLine
              x1={490}
              y1={105}
              x2={535}
              y2={105}
              flow={
                flowMode !== 'funds' && clientLoadWatts > 0 ? 'emerald' : null
              }
              fundsFlow={
                flowMode === 'funds' || flowMode === 'both'
                  ? 'reverse-gold'
                  : null
              }
            />

            {/* Pipe 3: Trunk Core bottom (385, 180) -> Trunk Battery top (385, 230) */}
            <ConduitLine
              x1={385}
              y1={180}
              x2={385}
              y2={230}
              flow={
                flowMode !== 'funds'
                  ? batteryChargeWatts > 0
                    ? 'emerald'
                    : batteryState === 'Discharging'
                      ? 'reverse-emerald'
                      : null
                  : null
              }
            />

            {/* Pipe 4: Wind Turbines (235, 305) -> Trunk Battery / DC Bus (280, 305) */}
            <ConduitLine
              x1={235}
              y1={305}
              x2={280}
              y2={305}
              flow={flowMode !== 'funds' && currentWindWatts > 0 ? 'sky' : null}
            />

            {/* Pipe 5: Trunk Battery / DC Bus (490, 305) -> Grid Intertie (535, 305) */}
            <ConduitLine
              x1={490}
              y1={305}
              x2={535}
              y2={305}
              flow={
                flowMode !== 'funds'
                  ? gridWatts < 0
                    ? 'emerald'
                    : gridWatts > 0
                      ? 'reverse-sky'
                      : null
                  : null
              }
            />

            {/* HARDWARE NODES */}
            {/* Card 1.1: 300 Heliotropic Solar Leaves */}
            <SchematicCard
              x={25}
              y={30}
              width={210}
              height={150}
              accent="amber"
              icon={<SunIcon className="h-4 w-4 text-amber-600" />}
              title="Solar Leaves"
              primaryValue={
                currentSolarWatts >= 1000
                  ? `${(currentSolarWatts / 1000).toFixed(2)} kW`
                  : `${currentSolarWatts} W`
              }
              subtext={`Irradiance: ${simIrradiance} W/m²`}
              sparklineData={solarTrend.slice(-10)}
              footerLabel="Elevation:"
              footerValue={`${trackingElevation}° (+32% Boost)`}
            />

            {/* Card 1.2: Biomimetic Trunk Core Hub */}
            <foreignObject x={280} y={30} width={210} height={150}>
              <div className="h-full w-full rounded-2xl border border-black/10 bg-white shadow-xs flex flex-col justify-between overflow-hidden text-center select-none p-3.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    Cerbo GX Core
                  </span>
                  <span className="font-mono text-[10px] text-zinc-400">
                    Synchronized
                  </span>
                </div>
                <div>
                  <div className="font-mono text-2xl font-light text-zinc-950">
                    {(totalGenWatts / 1000).toFixed(2)} kW
                  </div>
                  <div className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider mt-0.5">
                    Microgrid Generation
                  </div>
                </div>
                <div className="border-t border-black/5 pt-1 font-mono text-[10px] text-zinc-400">
                  Dual-Modality Hub
                </div>
              </div>
            </foreignObject>

            {/* Card 1.3: Client Off-Taker (MKovo s.r.o.) */}
            <SchematicCard
              x={535}
              y={30}
              width={210}
              height={150}
              accent="emerald"
              icon={<PowerPlugIcon className="h-4 w-4 text-emerald-700" />}
              title="MKovo s.r.o."
              badge="Corporate PPA"
              primaryValue={`${(clientLoadWatts / 1000).toFixed(2)} kW`}
              subtext="Precision CNC Machining"
              sparklineData={loadTrend.slice(-10)}
              footerLabel="Contracted Tariff:"
              footerValue="USDC 0.32 / kWh"
            />

            {/* Card 2.1: 12 Ducted VAWT Turbines */}
            <SchematicCard
              x={25}
              y={230}
              width={210}
              height={150}
              accent="sky"
              icon={<WindIcon className="h-4 w-4 text-sky-700" />}
              title="VAWT Turbines"
              primaryValue={
                currentWindWatts >= 1000
                  ? `${(currentWindWatts / 1000).toFixed(2)} kW`
                  : `${currentWindWatts} W`
              }
              subtext={`Speed: ${simWindSpeed.toFixed(1)} m/s · ${calculatedRpm} RPM`}
              progressPercent={Math.min(100, (currentWindWatts / 35000) * 100)}
              footerLabel={`Noise: ${calculatedNoise} dB(A)`}
              footerValue="+27% Venturi"
            />

            {/* Card 2.2: Trunk Battery Storage */}
            <SchematicCard
              x={280}
              y={230}
              width={210}
              height={150}
              accent="emerald"
              icon={<BatteryIcon className="h-4 w-4 text-emerald-700" />}
              title="Trunk Battery"
              badge={batteryState}
              primaryValue={`${demo.currentPower.batterySocPercent.toFixed(1)} %`}
              subtext="53.48 V · Lynx BMS"
              sparklineData={batteryTrend}
              progressPercent={demo.currentPower.batterySocPercent}
              footerLabel="Reserve Bank:"
              footerValue="40.0 kWh LFP"
            />

            {/* Card 2.3: Regional Grid Intertie */}
            <SchematicCard
              x={535}
              y={230}
              width={210}
              height={150}
              accent="forest"
              icon={<GridIcon className="h-4 w-4 text-zinc-600" />}
              title="Grid Intertie"
              primaryValue={
                gridWatts < 0
                  ? `${(-gridWatts / 1000).toFixed(2)} kW Export`
                  : gridWatts > 0
                    ? `${(gridWatts / 1000).toFixed(2)} kW Import`
                    : '0.00 kW Balanced'
              }
              subtext={
                gridWatts < 0
                  ? 'Exporting excess power'
                  : gridWatts > 0
                    ? 'Importing grid reserve'
                    : 'Self-sufficient balance'
              }
              footerLabel="Interconnection:"
              footerValue={gridWatts < 0 ? 'Export Active' : 'Connected'}
            />
          </svg>
        </div>

        {/* RIGHT 3 COLS: UNIFIED UNCOUPLED TELEMETRY SIDEPANEL */}
        <div className="xl:col-span-3">
          <TelemetrySidepanel
            demo={demo}
            specialtyTitle="Tree Biomimetics"
            specialtyContent={
              <div className="space-y-2 text-[10px] font-mono text-zinc-600">
                <div className="flex justify-between items-center">
                  <span>Acoustic Noise (10m):</span>
                  <strong className="text-emerald-700">
                    {calculatedNoise} dB(A) (Pass &lt;35)
                  </strong>
                </div>
                <div className="flex justify-between items-center">
                  <span>Ground Footprint:</span>
                  <strong className="text-zinc-950">1.2 m² (12m tree)</strong>
                </div>
                <div className="border-t border-black/10 pt-1.5">
                  <span className="text-zinc-500">Autonomous AI Mode:</span>
                  <div className="font-bold text-t-blue mt-0.5 text-[10px] leading-snug">
                    {selectedAiMode}
                  </div>
                </div>
                <div className="flex justify-between items-center text-zinc-500">
                  <span>Encoder Feedback:</span>
                  <span>RE 30-2-500</span>
                </div>
              </div>
            }
          />
        </div>
      </div>

      {/* 6. REUSABLE COMMERCIAL DOSSIER & CASH FLOW WATERFALL */}
      <CashFlowDossier
        offTakerTitle="MKovo s.r.o. · Precision Tooling"
        offTakerBadge="Active Corporate PPA"
        offTakerDescription="Czech precision metal fabrication facility in Central Bohemia region. Contracted a 10-year direct power purchase agreement (PPA) with Treetino at a fixed indexed rate of USDC 0.32 / kWh to hedge against volatile industrial wholesale tariffs and decarbonize precision CNC machining lines."
        keyDetails={[
          {
            label: 'Conditional Purchase',
            value: 'USDC 705,000',
            subtext: '3 Commercial Units',
          },
          {
            label: 'Contract Term',
            value: '10-Year Take-or-Pay',
            subtext: 'Sub-metered (EM540)',
          },
        ]}
        grossRevenueTitle="USDC 30,080 / Year Gross Revenue"
        waterfallSteps={financials.cashFlowWaterfall}
      />
    </div>
  );
}
