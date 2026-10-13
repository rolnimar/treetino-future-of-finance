import { useState } from 'react';
import type { VictronDemoItem } from '../victron-types';
import {
  BatteryIcon,
  PowerPlugIcon,
  GridIcon,
  FroniusIcon,
  SunIcon,
  EvChargerIcon,
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

export interface EvLayoutProps {
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

export function EvLayout({
  demo,
  holding,
  onClaim,
  isClaiming,
  claimSuccessText,
  claimErrorText,
  onBackProject,
}: EvLayoutProps) {
  const [flowMode, setFlowMode] = useState<'both' | 'power' | 'funds'>('both');

  const { currentPower, dailyTotals, financials } = demo;

  const annualPoolDistribution = (
    financials.targetUsdc *
    (financials.projectedApy / 100)
  ).toLocaleString();
  const dailyDisplacedSavings = (
    (demo.evDeliveredKwh24h ?? 288.59) * 0.42 +
    32 * 2.5
  ).toFixed(2);

  const gridTrend = [6500, 7200, 8100, 8500, currentPower.gridWatts || 8717];
  const acLoadTrend = [580, 610, 595, 620, 607];
  const essentialTrend = [7400, 7800, 8300, 7950, 8109];
  const batteryTrend = [55, 53, 52, 51.5, currentPower.batterySocPercent];
  const solarTrend = demo.hourlyData.map((d) => d.solarKwh);

  return (
    <div className="rounded-3xl border border-black/10 bg-white p-6 sm:p-8 shadow-xs space-y-6">
      {/* 1. REUSABLE INSTALLATION HEADER */}
      <InstallationHeader
        demo={demo}
        flowMode={flowMode}
        onFlowModeChange={setFlowMode}
      />

      {/* 2. REUSABLE FLOW SUMMARY BANNER */}
      <FlowSummaryBanner
        generation={{
          label: 'Canopy Solar Generation',
          value: `${dailyTotals.solarYieldKwh.toFixed(2)} kWh Today`,
          subtext: `Live canopy output: ${currentPower.solarYieldWatts.toFixed(0)} W`,
        }}
        consumption={{
          label: 'Plaza EV Charging Load',
          value: '10.34 kW Active',
          subtext: `Past 24h: ${(demo.evDeliveredKwh24h ?? 288.59).toFixed(2)} kWh delivered`,
        }}
        revenueOrSavings={{
          label: 'High-Velocity EV Revenue',
          value: `+€${dailyDisplacedSavings} / day`,
          subtext: '10 Bays (€0.42/kWh + €2.50 session fee)',
        }}
        investorYield={{
          apyPercent: financials.projectedApy,
          annualDistribution: annualPoolDistribution,
          subtext: 'High-frequency transaction streaming on Solana',
        }}
      />

      {/* 3. REUSABLE STREAMING YIELD TICKER */}
      <StreamingYieldTicker
        assetName="Solar EV Fast-Charging Hub"
        siteId={demo.siteId}
        holding={holding}
        financials={financials}
        onBackProject={onBackProject}
        onClaim={onClaim}
        isClaiming={isClaiming}
        claimSuccessText={claimSuccessText}
        claimErrorText={claimErrorText}
      />

      {/* 4. SCHEMATIC CANVAS + UNCOUPLED TELEMETRY SIDEPANEL */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        <div className="xl:col-span-9 space-y-4">
          <div className="overflow-x-auto rounded-3xl border border-black/10 bg-zinc-50/50 p-4 sm:p-6 flex items-center shadow-xs">
            <svg
              viewBox="0 0 770 745"
              className="w-full h-auto min-w-[720px] select-none"
            >
              {/* CONDUIT PIPES LAYER */}
              {/* 1. Grid bottom (130, 170) down to EVCS #1 top (130, 205) */}
              <ConduitLine
                x1={130}
                y1={170}
                x2={130}
                y2={205}
                flow={flowMode !== 'funds' ? 'rose' : null}
                fundsFlow={
                  flowMode === 'funds' || flowMode === 'both' ? 'gold' : null
                }
              />

              {/* 2. EVCS #1 right (235, 280) to Quattro Inverter left (280, 280) */}
              <ConduitLine
                x1={235}
                y1={280}
                x2={280}
                y2={280}
                flow={flowMode !== 'funds' ? 'rose' : null}
              />

              {/* 3. AC Loads bottom (385, 170) down to Quattro AC-In top (385, 205) */}
              <ConduitLine
                x1={385}
                y1={170}
                x2={385}
                y2={205}
                flow={flowMode !== 'funds' ? 'emerald' : null}
              />

              {/* 4. Quattro AC-Out right (490, 280) to EVCS #2 left (535, 280) */}
              <ConduitLine
                x1={490}
                y1={280}
                x2={535}
                y2={280}
                flow={flowMode !== 'funds' ? 'sky' : null}
                fundsFlow={
                  flowMode === 'funds' || flowMode === 'both'
                    ? 'reverse-gold'
                    : null
                }
              />

              {/* 5. Branch up from AC-Out (512, 280) to Essential Loads (535, 170) */}
              <path
                d="M 512 280 V 170 H 535"
                className="vrm-conduit-outer"
                fill="none"
              />
              <path
                d="M 512 280 V 170 H 535"
                className="vrm-conduit-inner"
                fill="none"
              />
              {flowMode !== 'funds' && (
                <path
                  d="M 512 280 V 170 H 535"
                  className="vrm-flow-sky"
                  fill="none"
                />
              )}

              {/* 6. Branch down from AC-Out (512, 280) to PV Inverter #2 (535, 465) */}
              <path
                d="M 512 280 V 465 H 535"
                className="vrm-conduit-outer"
                fill="none"
              />
              <path
                d="M 512 280 V 465 H 535"
                className="vrm-conduit-inner"
                fill="none"
              />
              {flowMode !== 'funds' && (
                <path
                  d="M 535 465 H 512 V 280"
                  className="vrm-flow-amber"
                  fill="none"
                />
              )}

              {/* 7. Quattro bottom (385, 355) down to Battery top (385, 390) */}
              <ConduitLine
                x1={385}
                y1={355}
                x2={385}
                y2={390}
                flow={flowMode !== 'funds' ? 'emerald' : null}
              />

              {/* 8. Battery bottom (385, 540) down to y:650 and right to PV Charger (535, 650) */}
              <path
                d="M 385 540 V 650 H 535"
                className="vrm-conduit-outer"
                fill="none"
              />
              <path
                d="M 385 540 V 650 H 535"
                className="vrm-conduit-inner"
                fill="none"
              />
              {flowMode !== 'funds' && (
                <path
                  d="M 535 650 H 385 V 540"
                  className="vrm-flow-amber"
                  fill="none"
                />
              )}

              {/* 9. PV Inverter #1 top (130, 390) up to EVCS #1 bottom (130, 355) */}
              <ConduitLine
                x1={130}
                y1={390}
                x2={130}
                y2={355}
                flow={flowMode !== 'funds' ? 'amber' : null}
              />

              {/* Junction Dots */}
              <circle
                cx="130"
                cy="280"
                r="6"
                fill="#e11d48"
                stroke="#ffffff"
                strokeWidth="2.5"
              />
              <circle
                cx="512"
                cy="280"
                r="6"
                fill="#0284c7"
                stroke="#ffffff"
                strokeWidth="2.5"
              />

              {/* HARDWARE NODES LAYER (10 Authentic Victron Devices) */}

              {/* ROW 1: GRID SUPPLY, AC LOADS, ESSENTIAL LOADS */}
              {/* Card 1.1: GRID SUPPLY */}
              <SchematicCard
                x={25}
                y={20}
                width={210}
                height={150}
                accent="rose"
                icon={<GridIcon className="h-4 w-4 text-rose-700" />}
                title="Grid Supply"
                badge="3-Phase 400V"
                primaryValue={`${(currentPower.gridWatts || 8717).toFixed(0)} W`}
                subtext="Fast-feed grid intertie"
                sparklineData={gridTrend}
                footerLabel="Grid Meter:"
                footerValue="VM-3P75CT"
              />

              {/* Card 1.2: AC LOADS */}
              <SchematicCard
                x={280}
                y={20}
                width={210}
                height={150}
                accent="emerald"
                icon={<PowerPlugIcon className="h-4 w-4 text-emerald-700" />}
                title="AC Loads"
                badge="Auxiliary"
                primaryValue="607 W"
                subtext="Canopy lighting & HVAC"
                sparklineData={acLoadTrend}
                footerLabel="Billed Tariff:"
                footerValue="-€0.07 / hr"
              />

              {/* Card 1.3: ESSENTIAL LOADS */}
              <SchematicCard
                x={535}
                y={20}
                width={210}
                height={150}
                accent="sky"
                icon={<PowerPlugIcon className="h-4 w-4 text-sky-700" />}
                title="Essential Loads"
                badge="EV Bus"
                primaryValue="8109 W"
                subtext="Dedicated EV charging bus"
                sparklineData={essentialTrend}
                footerLabel="Throughput:"
                footerValue="+€3.41 / hr"
              />

              {/* ROW 2: EVCS STATION #1, QUATTRO HUB, EVCS STATION #2 */}
              {/* Card 2.1: EVCS STATION #1 (ACTIVE 14.45 kW) */}
              <SchematicCard
                x={25}
                y={205}
                width={210}
                height={150}
                accent="sky"
                icon={<EvChargerIcon className="h-4 w-4 text-sky-600" />}
                title="EVCS Bay #1"
                badge="Active 32A"
                primaryValue="14.45 kW"
                subtext="Fast charging in progress"
                footerLabel="Session Rate:"
                footerValue="€0.42 / kWh"
              />

              {/* Card 2.2: QUATTRO INVERTER HUB */}
              <foreignObject x={280} y={205} width={210} height={150}>
                <div className="h-full w-full rounded-2xl border-2 border-black/10 bg-t-blue text-white p-3.5 shadow-md flex flex-col justify-between overflow-hidden select-none">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-sky-200">
                      48V
                    </span>
                    <span className="rounded bg-white/20 px-2 py-0.5 font-mono text-[9px] font-bold text-white">
                      Quattro 48/10000
                    </span>
                  </div>
                  <div>
                    <div className="font-mono text-base font-black text-white">
                      Bulk · 140A
                    </div>
                    <div className="mt-0.5 font-mono text-xs font-extrabold text-sky-200">
                      {financials.projectedApy}% APY Yield
                    </div>
                  </div>
                  <div className="border-t border-white/20 pt-1 font-mono text-[10px] text-white/80 text-center">
                    Plaza Fast-Charging Hub
                  </div>
                </div>
              </foreignObject>

              {/* Card 2.3: EVCS STATION #2 (STANDBY) */}
              <SchematicCard
                x={535}
                y={205}
                width={210}
                height={150}
                accent="forest"
                icon={<EvChargerIcon className="h-4 w-4 text-zinc-600" />}
                title="EVCS Bay #2"
                badge="Standby"
                primaryValue="EV Ready"
                subtext="Awaiting incoming vehicle"
                footerLabel="Station State:"
                footerValue="Available"
              />

              {/* ROW 3: PV INVERTER 1 (WEST), BUFFER BATTERY, PV INVERTER 2 (EAST) */}
              {/* Card 3.1: PV INVERTER #1 (Canopy West) */}
              <SchematicCard
                x={25}
                y={390}
                width={210}
                height={150}
                accent="amber"
                icon={<FroniusIcon className="h-4 w-4" />}
                title="PV Inverter"
                badge="Canopy West"
                primaryValue="0 W"
                subtext="Canopy West Array"
                sparklineData={[0, 0, 0, 0, 0]}
                footerLabel="Grid Coupling:"
                footerValue="AC-In Side"
              />

              {/* Card 3.2: BUFFER BATTERY (Lynx Shunt) */}
              <SchematicCard
                x={280}
                y={390}
                width={210}
                height={150}
                accent="emerald"
                icon={<BatteryIcon className="h-4 w-4 text-emerald-700" />}
                title="Buffer Storage"
                badge="Lynx Shunt"
                primaryValue={`${currentPower.batterySocPercent.toFixed(1)} %`}
                subtext="52.49 V · 1000A Shunt"
                sparklineData={batteryTrend}
                progressPercent={currentPower.batterySocPercent}
                footerLabel="Reserve Bank:"
                footerValue="48V High-Rate"
              />

              {/* Card 3.3: PV INVERTER #2 (Canopy East) */}
              <SchematicCard
                x={535}
                y={390}
                width={210}
                height={150}
                accent="amber"
                icon={<FroniusIcon className="h-4 w-4" />}
                title="PV Inverter"
                badge="Canopy East"
                primaryValue="118 W"
                subtext="Canopy East Array"
                sparklineData={[80, 95, 110, 105, 118]}
                footerLabel="Island Bus:"
                footerValue="AC-Out Side"
              />

              {/* ROW 4: PV CHARGER MPPT */}
              {/* Card 4.3: PV CHARGER (SmartSolar MPPT RS 450/200) */}
              <SchematicCard
                x={535}
                y={575}
                width={210}
                height={150}
                accent="amber"
                icon={<SunIcon className="h-4 w-4 text-amber-600" />}
                title="Solar Charger"
                badge="SmartSolar"
                primaryValue="31 W"
                subtext="MPPT RS 450/200"
                sparklineData={
                  solarTrend.length > 0
                    ? solarTrend.slice(-10)
                    : [15, 20, 28, 25, 31]
                }
                footerLabel="DC Coupling:"
                footerValue="Battery Direct"
              />
            </svg>
          </div>

          {/* 10-BAY COMMERCIAL FAST-CHARGING PLAZA STATUS GRID */}
          <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-black/10 pb-3">
              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Dispenser Array
                </span>
                <h4 className="text-base font-bold text-zinc-950">
                  10x Commercial Fast-Charging Bays (32A Three-Phase Plaza)
                </h4>
              </div>
              <span className="font-mono text-xs font-semibold text-emerald-700">
                4 of 10 Bays Active Dispensing
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
              {[
                { bay: 1, kw: '22 kW', status: 'Active', active: true },
                { bay: 2, kw: '22 kW', status: 'Active', active: true },
                { bay: 3, kw: '22 kW', status: 'Active', active: true },
                { bay: 4, kw: '22 kW', status: 'Active', active: true },
                { bay: 5, kw: 'Ready', status: 'Available', active: false },
                { bay: 6, kw: 'Ready', status: 'Available', active: false },
                { bay: 7, kw: 'Ready', status: 'Available', active: false },
                { bay: 8, kw: 'Ready', status: 'Available', active: false },
                { bay: 9, kw: 'Ready', status: 'Available', active: false },
                { bay: 10, kw: 'Ready', status: 'Available', active: false },
              ].map((item) => (
                <div
                  key={item.bay}
                  className={`rounded-2xl border p-3 flex flex-col justify-between ${
                    item.active
                      ? 'border-sky-300 bg-sky-50/80 shadow-xs'
                      : 'border-black/10 bg-zinc-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="font-bold text-zinc-900">
                      Bay #{item.bay}
                    </span>
                    <span
                      className={`h-2 w-2 rounded-full ${
                        item.active ? 'bg-sky-500 animate-pulse' : 'bg-zinc-300'
                      }`}
                    />
                  </div>
                  <div className="my-1.5 font-mono text-sm font-black text-zinc-950">
                    {item.kw}
                  </div>
                  <div className="text-[10px] font-mono text-zinc-500">
                    {item.active ? 'Session in progress' : 'Ready to plug'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT 3 COLS: UNIFIED UNCOUPLED TELEMETRY SIDEPANEL */}
        <div className="xl:col-span-3">
          <TelemetrySidepanel
            demo={demo}
            specialtyTitle="Plaza IoT & RuuviTag"
            specialtyBadge="10 Bays"
            specialtyContent={
              <div className="space-y-1.5 text-[10px] font-mono text-zinc-600">
                <div className="flex justify-between items-center">
                  <span>Environmental Probe:</span>
                  <strong className="text-emerald-700 text-xs">
                    {demo.systemInfo.temperatureProbeCelsius ?? 36.2} °C
                  </strong>
                </div>
                <div className="text-zinc-500">
                  RuuviTag wireless environmental probe (TEST PARTER)
                </div>
                <div className="border-t border-black/10 pt-1 flex justify-between items-center text-zinc-500">
                  <span>Charging Protocol:</span>
                  <span className="font-bold text-emerald-700">
                    M2M Billing
                  </span>
                </div>
              </div>
            }
          />
        </div>
      </div>

      {/* 5. REUSABLE COMMERCIAL DOSSIER & CASH FLOW WATERFALL */}
      <CashFlowDossier
        offTakerTitle="Solar EV Fast-Charging Hub & Fleet Plaza"
        offTakerBadge="Point-of-Sale PPA"
        offTakerDescription="Multi-bay commercial EV charging plaza buffered with solar and storage in Paris, France. Processes high daily energy throughput, laying the foundation for autonomous vehicle micro-billing and native energy stablecoins."
        keyDetails={[
          {
            label: 'Delivered (24h)',
            value: `${demo.evDeliveredKwh24h ?? 288.59} kWh`,
            subtext: '10 commercial bays',
          },
          {
            label: 'Billing Velocity',
            value: '€0.42 / kWh',
            subtext: '+€2.50 session fee',
          },
        ]}
        grossRevenueTitle="€18,500.00 / Year Gross Revenue"
        waterfallSteps={financials.cashFlowWaterfall}
      />
    </div>
  );
}
