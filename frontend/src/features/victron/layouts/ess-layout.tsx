import { useState } from 'react';
import type { VictronDemoItem } from '../victron-types';
import {
  BatteryIcon,
  PowerPlugIcon,
  GridIcon,
  FroniusIcon,
  SunIcon,
  ShieldCheckIcon,
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
import { MobileEnergyFlowDiagram } from '../components/MobileEnergyFlowDiagram';

import type { InvestmentRecord } from '../use-victron-investments';

export interface EssLayoutProps {
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

export function EssLayout({
  demo,
  holding,
  onClaim,
  isClaiming,
  claimSuccessText,
  claimErrorText,
  onBackProject,
}: EssLayoutProps) {
  const [flowMode, setFlowMode] = useState<'both' | 'power' | 'funds'>('both');

  const { currentPower, financials } = demo;

  // Real BESS Přeštice 8.6 MW operational rates from co-founder documentation
  const spotArbitrageSpreadUsdc = 'USDC 95 – USDC 98 / MWh';
  const isGridExporting = (currentPower.gridWatts ?? 0) <= 0;

  const gridTrend = [
    -6200,
    -6150,
    -5800,
    -6200,
    currentPower.gridWatts || -6200,
  ];
  const essentialTrend = [
    120,
    115,
    125,
    118,
    currentPower.consumptionWatts || 120,
  ];
  const batteryTrend = [72, 70, 69, 68, currentPower.batterySocPercent];
  const solarTrend = demo.hourlyData.map((d) => d.solarKwh);

  return (
    <div className="rounded-3xl border-none md:border md:border-black/10 bg-transparent md:bg-white p-0 sm:p-8 shadow-none md:shadow-xs space-y-6">
      {/* 0. LIVE INDUSTRIAL OPERATION ALERT BANNER ("ALREADY WORKING") */}
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/80 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-pulse mt-1 shrink-0" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-800">
                OPERATIONAL STATUS: FULL COMMERCIAL OPERATION · ČEPS ANCILLARY
                BALANCING CERTIFIED
              </span>
              <span className="font-mono text-xs font-semibold text-emerald-900">
                · 22 kV MV Grid Synchronized
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-700">
              Direct interconnect into{' '}
              <strong>110/22 kV Přeštice Substation</strong> (Parcel No. 450/2)
              with <strong>8.6 MW</strong> reserved capacity (2× signed ČEZ
              Distribuce Connection Agreements). WATTINO PCS inverter response{' '}
              <strong>&lt; 10 ms</strong> for secondary frequency restoration
              (aFRR+ / aFRR-) and primary containment (FCR).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center shrink-0">
          <a
            href="/downloads/BESS_Prestice_8.6MW_Wattino_Financial_Plan.pdf"
            download="BESS_Prestice_8.6MW_Wattino_Financial_Plan.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#183d89] hover:bg-[#132f6b] !text-white px-3.5 py-2 font-mono text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <span className="!text-white">Download PDF (12 Pages)</span>
            <svg
              className="h-3.5 w-3.5 !text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </a>
        </div>
      </div>

      {/* 1. REUSABLE INSTALLATION HEADER */}
      <InstallationHeader
        demo={demo}
        flowMode={flowMode}
        onFlowModeChange={setFlowMode}
      />

      {/* 2. REUSABLE FLOW SUMMARY BANNER */}
      <FlowSummaryBanner
        generation={{
          label: 'Net Arbitrage Spread',
          value: spotArbitrageSpreadUsdc,
          subtext:
            'Negative midday prices (down to -USDC 60) → evening peak (USDC 180–USDC 320+/MWh)',
        }}
        consumption={{
          label: 'Active Storage Output',
          value: '6,200 kW (6.2 MW) Export',
          subtext:
            'Phase I full dispatch into 22 kV MV grid + holding SVR reserve',
        }}
        revenueOrSavings={{
          label: 'Gross Daily Revenue Run-Rate',
          value: '+USDC 3,390 / day',
          subtext: 'Combined ČEPS capacity & activation + OTE intraday spread',
        }}
        investorYield={{
          apyPercent: financials.projectedApy,
          annualDistribution: 'USDC 1.02M / yr',
          subtext: 'Clean net EBITDA after 12% aggregator success fee & OPEX',
        }}
      />

      {/* 3. REUSABLE STREAMING YIELD TICKER */}
      <StreamingYieldTicker
        assetName="BESS Přeštice 8.6 MW"
        siteId={demo.siteId}
        holding={holding}
        financials={financials}
        onBackProject={onBackProject}
        onClaim={onClaim}
        isClaiming={isClaiming}
        claimSuccessText={claimSuccessText}
        claimErrorText={claimErrorText}
      />

      {/* 4. HARDWARE SCHEMATIC: MOBILE NATIVE VS DESKTOP DUAL VIEW */}
      {/* 4a. Mobile-Native Vertical Architecture (< xl) */}
      <div className="xl:hidden">
        <MobileEnergyFlowDiagram demo={demo} />
      </div>

      {/* 4b. Desktop Circuit Canvas + Telemetry Sidepanel (>= xl) */}
      <div className="hidden xl:grid grid-cols-12 gap-5 items-stretch">
        {/* LEFT 9 COLS: ELECTRICAL CIRCUIT SCHEMATIC CANVAS */}
        <div className="col-span-9 rounded-3xl border border-black/10 bg-zinc-50/50 p-6 shadow-xs">
          <svg viewBox="0 0 770 570" className="w-full h-auto select-none">
            {/* CONDUIT PIPES LAYER */}
            {/* 1. AC-In Conduit: Grid drop from (130, 170) down to (130, 285) */}
            <ConduitLine
              x1={130}
              y1={170}
              x2={130}
              y2={285}
              flow={
                flowMode !== 'funds'
                  ? isGridExporting
                    ? 'reverse-emerald'
                    : 'rose'
                  : null
              }
              fundsFlow={
                flowMode === 'funds' || flowMode === 'both' ? 'gold' : null
              }
            />

            {/* 2. AC-In Conduit: PV Inverter 1 right (235, 285) through junction (130, 285) to MultiPlus left (280, 285) */}
            <ConduitLine
              x1={235}
              y1={285}
              x2={280}
              y2={285}
              flow={flowMode !== 'funds' ? 'amber' : null}
            />

            {/* 3. AC Loads tap: AC Loads bottom (385, 170) down to MultiPlus AC-In top (385, 210) */}
            <ConduitLine x1={385} y1={170} x2={385} y2={210} flow={null} />

            {/* 4. AC-Out Conduit: MultiPlus right (490, 285) to PV Inverter 2 left (535, 285) */}
            <ConduitLine
              x1={490}
              y1={285}
              x2={535}
              y2={285}
              flow={flowMode !== 'funds' ? 'sky' : null}
            />

            {/* 5. AC-Out Branch up to Essential Loads: from junction (512, 285) up to (512, 170) and right to (535, 170) */}
            <path
              d="M 512 285 V 170 H 535"
              className="vrm-conduit-outer"
              fill="none"
            />
            <path
              d="M 512 285 V 170 H 535"
              className="vrm-conduit-core"
              fill="none"
            />

            {/* 6. DC Bus: MultiPlus bottom (385, 360) down to Battery top (385, 400) */}
            <ConduitLine
              x1={385}
              y1={360}
              x2={385}
              y2={400}
              flow={flowMode !== 'funds' ? 'reverse-emerald' : null}
              fundsFlow={
                flowMode === 'funds' || flowMode === 'both' ? 'gold' : null
              }
            />

            {/* 7. DC Bus: Battery right (490, 475) to MPPT left (535, 475) */}
            <ConduitLine
              x1={490}
              y1={475}
              x2={535}
              y2={475}
              flow={flowMode !== 'funds' ? 'amber' : null}
            />

            {/* T-JUNCTION CONNECTOR DOTS */}
            <circle
              cx="130"
              cy="285"
              r="6"
              fill="#059669"
              stroke="#ffffff"
              strokeWidth="2.5"
            />
            <circle
              cx="512"
              cy="285"
              r="6"
              fill="#0284c7"
              stroke="#ffffff"
              strokeWidth="2.5"
            />

            {/* HARDWARE NODES LAYER (Industrial BESS Přeštice Components) */}

            {/* ROW 1: GRID, AI EMS, 500L THERMAL BUFFER */}
            {/* Card 1.1: ČEZ 22 kV SUBSTATION CONNECTION */}
            <SchematicCard
              x={25}
              y={20}
              width={210}
              height={150}
              accent="forest"
              icon={<GridIcon className="h-4 w-4 text-zinc-600" />}
              title="110/22 kV Substation"
              badge="ČEZ Distribuce"
              primaryValue="6,200 kW Export"
              subtext="Přeštice Substation (Parcel 450/2)"
              sparklineData={gridTrend}
              footerLabel="Arbitrage Spread:"
              footerValue={spotArbitrageSpreadUsdc}
            />

            {/* Card 1.2: WATTINO AI EMS (SVR + Spot Bidding) */}
            <SchematicCard
              x={280}
              y={20}
              width={210}
              height={150}
              accent="emerald"
              icon={<PowerPlugIcon className="h-4 w-4 text-emerald-700" />}
              title="WATTINO AI EMS"
              badge="Spot & SVR Bidding"
              primaryValue="< 10 ms Response"
              subtext="FCR ±200mHz & aFRR 15min"
              sparklineData={[10, 8, 9, 8, 7]}
              footerLabel="Mode:"
              footerValue="Evening Peak aFRR+"
            />

            {/* Card 1.3: 500L THERMAL STORAGE TANK */}
            <SchematicCard
              x={535}
              y={20}
              width={210}
              height={150}
              accent="rose"
              icon={<PowerPlugIcon className="h-4 w-4 text-rose-700" />}
              title="500L Thermal Buffer"
              badge="Compressor-less"
              primaryValue="31.8 °C (Optimal)"
              subtext="Passive liquid cooling (-25 to +45 °C)"
              sparklineData={essentialTrend}
              footerLabel="Parasitic Savings:"
              footerValue="8–12% internal energy"
            />

            {/* ROW 2: 0.4/22 kV TRAFO, WATTINO PCS HUB, CLASS A1 FIRE SAFETY */}
            {/* Card 2.1: TRAFOSTANICE 0.4 / 22 kV */}
            <SchematicCard
              x={25}
              y={210}
              width={210}
              height={150}
              accent="amber"
              icon={<FroniusIcon className="h-4 w-4" />}
              title="0.4 / 22 kV Transformer"
              badge="Agreement #4122602318"
              primaryValue="8,600 kVA Reserved"
              subtext="Block transformers & MV switchgear"
              sparklineData={[-6200, -6200, -6200, -6200, -6200]}
              footerLabel="Interconnect:"
              footerValue="22 kV MV Cabling"
            />

            {/* Card 2.2: WATTINO hBESS PCS INVERTERS */}
            <foreignObject x={280} y={210} width={210} height={150}>
              <div className="h-full w-full rounded-2xl border-2 border-black/10 bg-t-blue text-white p-3.5 shadow-md flex flex-col justify-between overflow-hidden select-none">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-sky-200">
                    WATTINO hBESS
                  </span>
                  <span className="rounded bg-white/20 px-2 py-0.5 font-mono text-[9px] font-bold text-white">
                    50 Cabinets
                  </span>
                </div>
                <div>
                  <div className="font-mono text-base font-black text-white">
                    PCS 175–200 kW
                  </div>
                  <p className="text-[10px] text-white/80 mt-0.5">
                    Individual 50 kW segment breakers
                  </p>
                </div>
                <div className="rounded-lg bg-black/20 p-1.5 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-white/80">Operation:</span>
                  <span className="font-bold text-emerald-300">
                    Peak Discharge
                  </span>
                </div>
                <div className="border-t border-white/20 pt-1 flex items-center justify-between font-mono text-[10px] text-white/80">
                  <span>Project IRR:</span>
                  <strong className="text-sky-200">
                    {financials.projectedApy}% p.a.
                  </strong>
                </div>
              </div>
            </foreignObject>

            {/* Card 2.3: FIRE SAFETY CLASS A1 */}
            <SchematicCard
              x={535}
              y={210}
              width={210}
              height={150}
              accent="amber"
              icon={<ShieldCheckIcon className="h-4 w-4 text-emerald-600" />}
              title="Fire Safety System"
              badge="Class A1 (100 mm)"
              primaryValue="Aerosol Extinguish"
              subtext="100 mm mineral wool barrier"
              sparklineData={[0, 0, 0, 0, 0]}
              footerLabel="Enclosure:"
              footerValue="IP54 Perimeter"
            />

            {/* ROW 3: SAMSUNG SDI EU AUTOMOTIVE RACKS & CERBO-S GX GATEWAY */}
            {/* Card 3.2: SAMSUNG SDI BATTERY RACKS */}
            <SchematicCard
              x={280}
              y={400}
              width={210}
              height={150}
              accent="emerald"
              icon={<BatteryIcon className="h-4 w-4 text-emerald-700" />}
              title="Samsung SDI EU"
              badge="1st-Life Automotive"
              primaryValue="68.4% SoC"
              subtext="666 VDC · 10.0–17.2 MWh"
              sparklineData={batteryTrend}
              progressPercent={68.4}
              footerLabel="Warranty:"
              footerValue="10+10 Years EU Guarantee"
            />

            {/* Card 3.3: CERBO-S GX SCADA GATEWAY */}
            <SchematicCard
              x={535}
              y={400}
              width={210}
              height={150}
              accent="amber"
              icon={<SunIcon className="h-4 w-4 text-amber-600" />}
              title="Cerbo-S GX SCADA"
              badge="Venus OS D-Bus"
              primaryValue="10 ms RTT"
              subtext="Modbus TCP / CAN / RS485"
              sparklineData={solarTrend.slice(-10)}
              footerLabel="Dispatch:"
              footerValue="ČEPS Certified"
            />
          </svg>
        </div>

        {/* RIGHT 3 COLS: UNIFIED UNCOUPLED TELEMETRY SIDEPANEL */}
        <div className="xl:col-span-3">
          <TelemetrySidepanel
            demo={demo}
            specialtyTitle="ČEPS SVR + OTE Arbitrage"
            specialtyBadge="BESS 8.6 MW"
            specialtyContent={
              <div className="space-y-1.5 text-[10px] font-mono text-zinc-600">
                <div className="flex justify-between items-center">
                  <span>Reserved Capacity:</span>
                  <strong className="text-zinc-950 text-xs">
                    8.6 MW (2× ČEZ Contracts)
                  </strong>
                </div>
                <div className="flex justify-between items-center">
                  <span>Storage Capacity:</span>
                  <strong className="text-emerald-700 text-xs">
                    10.0 – 17.2 MWh
                  </strong>
                </div>
                <div className="text-zinc-500">
                  EU Technology WATTINO hBESS (Samsung SDI EU)
                </div>
                <div className="border-t border-black/10 pt-1 flex justify-between items-center text-zinc-500">
                  <span>Grid Regulation Response:</span>
                  <span className="font-bold text-emerald-700">
                    &lt; 10 ms (FCR / aFRR)
                  </span>
                </div>
              </div>
            }
          />
        </div>
      </div>

      {/* 5. REUSABLE COMMERCIAL DOSSIER & CASH FLOW WATERFALL */}
      <CashFlowDossier
        offTakerTitle="ČEPS a.s. & OTE Spot Market (ČEZ Distribuce 22 kV)"
        offTakerBadge="2× Signed Connection Agreements"
        offTakerDescription="Utility-scale 8.6 MW battery storage at parcel 472 in Dolní Lukavice. Holds 2 signed ČEZ connection agreements (#4122602318 Phase I 6.2 MW and #4122623464 Phase II 2.4 MW). Operates dual revenue streams: ČEPS transmission grid frequency balancing (FCR, aFRR) and algorithmic 15-minute intraday power arbitrage on the OTE exchange."
        keyDetails={[
          {
            label: 'Reserved Grid Power',
            value: '8.6 MW',
            subtext: '22 kV MV ČEZ Distribuce',
          },
          {
            label: 'Net Spread Margin',
            value: spotArbitrageSpreadUsdc,
            subtext: 'After 92% DC efficiency',
          },
          {
            label: 'Simple Payback',
            value: '2.95 – 4.22 Years',
            subtext: 'With 30% Grant / 100% Commercial',
          },
          {
            label: '10-Year Project IRR',
            value: '21.8% – 31.5% p.a.',
            subtext: 'Equity IRR > 35%',
          },
        ]}
        grossRevenueTitle="USDC 1.24M / yr Gross Annual Run-Rate (Var. A Realistic)"
        waterfallSteps={financials.cashFlowWaterfall}
      />
    </div>
  );
}
