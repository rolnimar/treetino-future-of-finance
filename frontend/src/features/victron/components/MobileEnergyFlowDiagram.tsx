import { useState } from 'react';
import type { VictronDemoItem } from '../victron-types';
import {
  BatteryIcon,
  PowerPlugIcon,
  GridIcon,
  SunIcon,
  ShieldCheckIcon,
  FroniusIcon,
  WindIcon,
  Sparkline,
} from '../victron-icons';

interface MobileEnergyFlowDiagramProps {
  demo: VictronDemoItem;
  className?: string;
}

export function MobileEnergyFlowDiagram({
  demo,
  className = '',
}: MobileEnergyFlowDiagramProps) {
  const [selectedSecondaryIndex, setSelectedSecondaryIndex] = useState(0);

  const isBess = demo.key === 'ess';
  const isEv = demo.key === 'ev';

  // Configurable nodes for each asset archetype
  const getNodes = () => {
    if (isBess) {
      return {
        top: {
          icon: <GridIcon className="h-4 w-4 text-zinc-600" />,
          title: '110/22 kV Substation',
          badge: 'ČEZ Distribuce',
          primary: '6,200 kW Export',
          subtext: 'Přeštice Substation · Parcel 450/2',
          statLabel: 'Arbitrage Spread:',
          statValue: '€95 – €98 / MWh',
          sparkline: [-6200, -6150, -5800, -6200, -6200],
        },
        conduitLabel: '22 kV MV Influx · 6.2 MW',
        hub: {
          badge: '50 Cabinets',
          title: 'WATTINO hBESS Hub',
          primary: 'PCS 175–200 kW',
          subtext: 'Individual 50 kW segment breakers',
          mode: 'Operation: Peak Discharge',
          irr: `${demo.financials.projectedApy}% p.a. Project IRR`,
        },
        bottomLeft: {
          icon: <BatteryIcon className="h-4 w-4 text-emerald-600 shrink-0" />,
          title: 'Samsung SDI',
          badge: '1st-Life',
          primary: '68.4% SoC',
          subtext: '666 VDC · 17 MWh',
          footer: '10+10y EU Warranty',
          percent: 68.4,
        },
        bottomRight: {
          icon: <SunIcon className="h-4 w-4 text-amber-600 shrink-0" />,
          title: 'Cerbo-S GX',
          badge: 'Venus OS',
          primary: '10 ms RTT',
          subtext: 'Modbus TCP / CAN',
          footer: 'ČEPS Certified',
        },
        secondary: [
          {
            id: 'ems',
            label: 'WATTINO AI EMS',
            tag: '< 10 ms',
            title: 'WATTINO AI EMS & Algorithmic Bidding',
            icon: <PowerPlugIcon className="h-4 w-4 text-emerald-600" />,
            badge: 'Spot & SVR Bidding',
            metric: '< 10 ms Response',
            detail: 'FCR ±200mHz & aFRR 15min evening peak dispatch',
            footer: 'Mode: Evening Peak aFRR+',
          },
          {
            id: 'trafo',
            label: '0.4/22 kV Trafo',
            tag: '8,600 kVA',
            title: '0.4 / 22 kV MV Transformer Station',
            icon: <FroniusIcon className="h-4 w-4 text-amber-600" />,
            badge: 'ČEZ Agrmt #4122602318',
            metric: '8,600 kVA Reserved',
            detail: 'Block transformers & MV switchgear with 22 kV cabling',
            footer: 'Interconnect: 22 kV MV Cabling',
          },
          {
            id: 'thermal',
            label: '500L Thermal',
            tag: '31.8 °C',
            title: '500L Thermal Storage Buffer Tank',
            icon: <PowerPlugIcon className="h-4 w-4 text-rose-600" />,
            badge: 'Compressor-less',
            metric: '31.8 °C Optimal',
            detail: 'Passive liquid cooling with 8–12% internal energy savings',
            footer: 'Parasitic Savings: 8–12%',
          },
          {
            id: 'safety',
            label: 'Fire Safety A1',
            tag: 'IP54',
            title: 'Class A1 Fire Suppression Perimeter',
            icon: <ShieldCheckIcon className="h-4 w-4 text-emerald-600" />,
            badge: 'Class A1 (100 mm)',
            metric: 'Aerosol Extinguish',
            detail: '100 mm mineral wool barrier with IP54 perimeter enclosure',
            footer: 'Enclosure: IP54 Perimeter',
          },
        ],
      };
    }

    if (isEv) {
      return {
        top: {
          icon: <GridIcon className="h-4 w-4 text-zinc-600" />,
          title: 'High-Power Grid Feed',
          badge: '22 kV MV Grid',
          primary: '350 kW Ultra-Fast',
          subtext: 'Dedicated MV Transformer substation',
          statLabel: 'Peak Tariff:',
          statValue: '€0.34 / kWh retail',
          sparkline: [280, 310, 340, 350, 320],
        },
        conduitLabel: 'Ultra-Fast DC Bus · 800V',
        hub: {
          badge: '8 Dispensers',
          title: 'Kempower / Victron EV Hub',
          primary: 'Dynamic Load Balancing',
          subtext: 'CCS2 liquid-cooled 500A cables',
          mode: 'Operation: Multi-Vehicle Fast Charge',
          irr: `${demo.financials.projectedApy}% p.a. Project IRR`,
        },
        bottomLeft: {
          icon: <BatteryIcon className="h-4 w-4 text-emerald-600" />,
          title: 'BESS Buffer Rack',
          badge: 'Peak Shaving',
          primary: '84.0% SoC',
          subtext: '400 kWh LFP Storage',
          footer: 'Zero Demand Charges',
          percent: 84.0,
        },
        bottomRight: {
          icon: <SunIcon className="h-4 w-4 text-blue-600" />,
          title: 'OCPP 2.0.1 Gateway',
          badge: 'Solana Pay Native',
          primary: 'Instant Pay',
          subtext: 'Micro-settlement per second',
          footer: '1:1 EURTree Settlement',
        },
        secondary: [
          {
            id: 'pv',
            label: 'Solar Canopy',
            tag: '120 kWp',
            title: 'Bifacial Solar Parking Canopy',
            icon: <SunIcon className="h-4 w-4 text-amber-500" />,
            badge: 'Bifacial Glass',
            metric: '120 kWp Solar',
            detail: 'Provides shaded parking and direct DC vehicle charging',
            footer: 'Self-consumption: 92%',
          },
          {
            id: 'ems',
            label: 'Smart Queuing',
            tag: 'AI Dispatch',
            title: 'Autonomous Vehicle Dispatch Engine',
            icon: <PowerPlugIcon className="h-4 w-4 text-emerald-600" />,
            badge: 'Smart Queuing',
            metric: '< 2 min Wait',
            detail: 'Optimizes dynamic power distribution between cars',
            footer: 'Throughput: 48 cars/day',
          },
        ],
      };
    }

    // Default: Treetino V1 Smart Tree
    return {
      top: {
        icon: <WindIcon className="h-4 w-4 text-cyan-600" />,
        title: 'Dual Energy Influx',
        badge: 'Solar & Wind Hybrid',
        primary: '49.0 kW Combined',
        subtext: '28.4 kW Solar Leaves + 20.6 kW Wind Turbines',
        statLabel: 'PPA Tariff:',
        statValue: '€0.28 / kWh (MKovo)',
        sparkline: [32, 41, 45, 48, 49],
      },
      conduitLabel: 'Clean Hybrid DC Bus · 48V',
      hub: {
        badge: 'Dual Generation',
        title: 'Treetino Smart Energy Core',
        primary: 'Victron MultiPlus-II Hub',
        subtext: 'Dual MPPT + 3-Phase Synchronized Inverters',
        mode: 'Operation: Microgrid Island & Export',
        irr: `${demo.financials.projectedApy}% p.a. Project IRR`,
      },
      bottomLeft: {
        icon: <BatteryIcon className="h-4 w-4 text-emerald-600" />,
        title: 'Victron Smart Lithium',
        badge: 'LiFePO4 Racks',
        primary: '92.5% SoC',
        subtext: '48V · 60 kWh Storage',
        footer: '5,000+ Deep Cycles',
        percent: 92.5,
      },
      bottomRight: {
        icon: <SunIcon className="h-4 w-4 text-amber-600" />,
        title: 'Cerbo-S GX Gateway',
        badge: 'Venus OS D-Bus',
        primary: '10 ms RTT',
        subtext: 'Signed On-Chain Oracles',
        footer: '96 Daily Solana Snaps',
      },
      secondary: [
        {
          id: 'leaves',
          label: 'Solar Leaves',
          tag: '28.4 kW',
          title: '36 Kinetic Photovoltaic Leaves',
          icon: <SunIcon className="h-4 w-4 text-amber-500" />,
          badge: 'SunPower Maxeon',
          metric: '28.4 kW Generation',
          detail:
            'Aerodynamic tilt angles optimized for year-round sun capture',
          footer: 'Efficiency: 24.2%',
        },
        {
          id: 'turbines',
          label: 'Wind Turbines',
          tag: '20.6 kW',
          title: 'Silent Savonius Vertical Turbines',
          icon: <WindIcon className="h-4 w-4 text-cyan-600" />,
          badge: 'Omnidirectional',
          metric: '20.6 kW Kinetic',
          detail: 'Starts rotating at gentle 1.8 m/s wind speeds',
          footer: 'Low Noise: < 32 dB',
        },
      ],
    };
  };

  const nodes = getNodes();
  const activeSecondary =
    nodes.secondary[selectedSecondaryIndex] || nodes.secondary[0];

  return (
    <div
      className={`rounded-3xl border border-zinc-200/80 bg-white p-4 sm:p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-4 select-none text-zinc-950 ${className}`}
    >
      {/* 1. Mobile Header & Operational Status */}
      <div className="flex items-center justify-between border-b border-zinc-200/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-sm font-bold text-zinc-950 uppercase tracking-tight">
              Hardware Circuit Architecture
            </h3>
          </div>
          <p className="text-[11px] font-mono text-zinc-500 mt-0.5">
            Physical edge telemetry & electrical power flows
          </p>
        </div>

        <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 font-mono text-[10px] font-bold text-emerald-700">
          Live Operational
        </span>
      </div>

      {/* 2. Vertical Native Mobile Flow Pipeline */}
      <div className="flex flex-col items-center w-full space-y-1">
        {/* NODE 1: Grid Influx & Arbitrage */}
        <div className="w-full rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-bold text-zinc-900">
              <span className="p-1 rounded-lg bg-white border border-zinc-200 text-[#183d89]">
                {nodes.top.icon}
              </span>
              <span>{nodes.top.title}</span>
            </div>
            <span className="rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 font-mono text-[9px] font-bold text-[#183d89]">
              {nodes.top.badge}
            </span>
          </div>

          <div className="mt-2 flex items-baseline justify-between">
            <div>
              <div className="font-mono text-xl font-extrabold text-zinc-950">
                {nodes.top.primary}
              </div>
              <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                {nodes.top.subtext}
              </p>
            </div>
            {nodes.top.sparkline && (
              <div className="shrink-0">
                <Sparkline
                  data={nodes.top.sparkline}
                  color="#183d89"
                  width={60}
                  height={22}
                />
              </div>
            )}
          </div>

          <div className="mt-2.5 pt-2 border-t border-zinc-200/80 flex items-center justify-between text-[11px] font-mono">
            <span className="text-zinc-500">{nodes.top.statLabel}</span>
            <strong className="text-[#183d89] font-bold">
              {nodes.top.statValue}
            </strong>
          </div>
        </div>

        {/* Animated Conduit 1: Grid to Central Hub with Live Electrical Flow */}
        <div className="flex flex-col items-center justify-center my-0.5 w-full">
          <svg className="w-16 h-6 overflow-visible">
            <line
              x1="32"
              y1="0"
              x2="32"
              y2="24"
              stroke="#183d89"
              strokeWidth="3"
              className="animate-conduit-flow"
            />
          </svg>
          <span className="px-3 py-0.5 rounded-full bg-[#183d89] text-white font-mono text-[9px] font-bold shadow-xs">
            {nodes.conduitLabel}
          </span>
          <svg className="w-16 h-6 overflow-visible">
            <line
              x1="32"
              y1="0"
              x2="32"
              y2="24"
              stroke="#183d89"
              strokeWidth="3"
              className="animate-conduit-flow"
            />
          </svg>
        </div>

        {/* NODE 2: Central Power Conversion Hub (Hero Card) */}
        <div className="w-full rounded-2xl bg-[#183d89] text-white p-4 shadow-md">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-blue-100">
              {nodes.hub.title}
            </span>
            <span className="rounded-md bg-white/15 border border-white/20 px-2 py-0.5 font-mono text-[9px] font-bold text-white">
              {nodes.hub.badge}
            </span>
          </div>

          <div className="mt-2">
            <div className="font-mono text-2xl font-black text-white tracking-tight">
              {nodes.hub.primary}
            </div>
            <p className="text-[11px] text-blue-100 mt-0.5">
              {nodes.hub.subtext}
            </p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-white/20 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-300 font-bold">
                {nodes.hub.mode}
              </span>
            </div>
            <span className="text-blue-100 font-bold">{nodes.hub.irr}</span>
          </div>
        </div>

        {/* Animated Conduit 2: Split to Battery & Edge Computer with Live Circuit Vectors */}
        <div className="flex flex-col items-center justify-center my-0.5 w-full">
          <svg className="w-full h-8 overflow-visible">
            {/* Center drop line */}
            <line
              x1="50%"
              y1="0"
              x2="50%"
              y2="12"
              stroke="#183d89"
              strokeWidth="3"
              className="animate-conduit-flow"
            />
            {/* Horizontal bus bar */}
            <line
              x1="25%"
              y1="12"
              x2="75%"
              y2="12"
              stroke="#94a3b8"
              strokeWidth="2.5"
            />
            {/* Left drop line to battery */}
            <line
              x1="25%"
              y1="12"
              x2="25%"
              y2="30"
              stroke="#059669"
              strokeWidth="2.5"
              className="animate-conduit-flow"
            />
            {/* Right drop line to cerbo */}
            <line
              x1="75%"
              y1="12"
              x2="75%"
              y2="30"
              stroke="#d97706"
              strokeWidth="2.5"
              className="animate-conduit-flow"
            />
          </svg>
        </div>

        {/* ROW: Node 3 (Battery) & Node 4 (Edge Computer) Side-by-Side */}
        <div className="grid grid-cols-2 gap-2.5 w-full">
          {/* Card 3: Storage */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3 shadow-2xs flex flex-col justify-between text-zinc-950">
            <div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-bold text-zinc-900 truncate">
                  {nodes.bottomLeft.icon}
                  <span className="text-[11px]">{nodes.bottomLeft.title}</span>
                </div>
              </div>
              <div className="mt-2 font-mono text-lg font-black text-emerald-700">
                {nodes.bottomLeft.primary}
              </div>
              <p className="text-[10px] text-zinc-500 font-mono mt-0.5 truncate">
                {nodes.bottomLeft.subtext}
              </p>
              {nodes.bottomLeft.percent && (
                <div className="mt-2 h-1.5 w-full bg-zinc-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full"
                    style={{ width: `${nodes.bottomLeft.percent}%` }}
                  />
                </div>
              )}
            </div>
            <div className="mt-2.5 pt-1.5 border-t border-emerald-100 text-[9px] font-mono text-zinc-500 truncate">
              {nodes.bottomLeft.footer}
            </div>
          </div>

          {/* Card 4: Edge Computer */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-3 shadow-2xs flex flex-col justify-between text-zinc-950">
            <div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-bold text-zinc-900 truncate">
                  {nodes.bottomRight.icon}
                  <span className="text-[11px]">{nodes.bottomRight.title}</span>
                </div>
              </div>
              <div className="mt-2 font-mono text-lg font-black text-amber-700">
                {nodes.bottomRight.primary}
              </div>
              <p className="text-[10px] text-zinc-500 font-mono mt-0.5 truncate">
                {nodes.bottomRight.subtext}
              </p>
            </div>
            <div className="mt-2.5 pt-1.5 border-t border-amber-100 text-[9px] font-mono text-zinc-500 truncate">
              {nodes.bottomRight.footer}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Secondary Supporting Systems Inspector */}
      {nodes.secondary.length > 0 && (
        <div className="pt-2 border-t border-zinc-200/80 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-900">
            <span>Supporting Subsystems</span>
            <span className="font-mono text-[10px] text-zinc-400">
              Tap to inspect
            </span>
          </div>

          {/* Segmented Pill Selector */}
          <div className="grid grid-cols-2 gap-1.5">
            {nodes.secondary.map((sec, idx) => (
              <button
                key={sec.id}
                type="button"
                onClick={() => setSelectedSecondaryIndex(idx)}
                className={`py-2 px-2.5 rounded-xl font-mono text-[10px] font-semibold transition cursor-pointer text-left flex items-center justify-between border ${
                  selectedSecondaryIndex === idx
                    ? 'bg-[#183d89] text-white border-[#183d89] shadow-xs'
                    : 'bg-zinc-50 text-zinc-700 border-zinc-200/80 hover:bg-zinc-100'
                }`}
              >
                <span className="truncate">{sec.label}</span>
                <span
                  className={`text-[9px] rounded-md px-1.5 py-0.5 shrink-0 ml-1 font-bold ${
                    selectedSecondaryIndex === idx
                      ? 'bg-white/20 text-white'
                      : 'bg-zinc-200 text-zinc-700'
                  }`}
                >
                  {sec.tag}
                </span>
              </button>
            ))}
          </div>

          {/* Selected Subsystem Detail Card */}
          {activeSecondary && (
            <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-3 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-bold text-zinc-900">
                  {activeSecondary.icon}
                  <span className="text-xs">{activeSecondary.title}</span>
                </div>
                <span className="rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 font-mono text-[9px] font-bold text-[#183d89]">
                  {activeSecondary.badge}
                </span>
              </div>
              <div className="font-mono text-base font-extrabold text-zinc-950">
                {activeSecondary.metric}
              </div>
              <p className="text-[11px] text-zinc-600">
                {activeSecondary.detail}
              </p>
              <div className="pt-2 border-t border-zinc-200 text-[10px] text-[#183d89] font-bold font-mono">
                {activeSecondary.footer}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
