import type { HardwareSpec } from '../../types/investor-dossier';
import { CheckIcon } from '../../victron-icons';

interface HardwareTechnologyCardProps {
  spec?: HardwareSpec;
}

export function HardwareTechnologyCard({ spec }: HardwareTechnologyCardProps) {
  const defaultSpec: HardwareSpec = {
    title: 'WATTINO hBESS: EU Automotive Engineering & Samsung SDI Cells',
    subtitle:
      'Engineered under the Hi-Tech Innovation Cluster (HTIC) – 8 European companies collaborating since 2014 on BMS, PCS inverters, and AI EMS dispatch.',
    provider: 'WATTINO / Treetino corp s.r.o. × Samsung SDI Hungary',
    stats: [
      {
        value: '40+ MWh',
        label: 'Installed BESS Capacity',
        subtext: 'Multiple operational industrial references in Central Europe',
        color: 'text-t-blue',
      },
      {
        value: '85+ MWp',
        label: 'Solar & Grid Projects',
        subtext: 'Utility-scale installations with proprietary AI EMS software',
        color: 'text-zinc-950',
      },
      {
        value: '1.4 GWh',
        label: 'Samsung Hungary Contract',
        subtext:
          '1st-life automotive NCM 622 prismatic cells, up to 4C discharge',
        color: 'text-emerald-700',
      },
      {
        value: '10+10 Years',
        label: 'EU Warranty & Parts',
        subtext:
          '10-year 1-to-1 swap warranty + 10-year guaranteed spare parts',
        color: 'text-t-blue',
      },
    ],
    features: [
      {
        title: '500L Passive Compressor-less Thermal Buffer',
        bullets: [
          'Eliminates power-hungry industrial chillers that consume 8–12% of stored energy.',
          'Operates reliably from -25 °C to +45 °C ambient temperatures with mineral insulation.',
          'Maintains optimal 23–28 °C cell core temperature during intense cycling.',
        ],
      },
      {
        title: 'Modular 50 kW PCS Inverter Segments (N+1 Redundancy)',
        bullets: [
          'Failure of a single 50 kW module drops system capacity by only 0.58%, avoiding outages.',
          'Individual cabinet isolation switchgear enables hot-swap maintenance without shutting down the 8.6 MW array.',
          'Fast bidirectional switching response under 10 ms for FCR primary frequency compliance.',
        ],
      },
      {
        title: 'Class A1 Non-Combustible Fire Safety & Aerosol Suppression',
        bullets: [
          '100 mm mineral wool thermal insulation barrier between each battery cabinet.',
          'Automated potassium aerosol fire suppression system with instant thermal tripping.',
          'No external concrete containment pit required, significantly lowering civil construction CAPEX.',
        ],
      },
      {
        title: 'Victron Cerbo-S GX & Venus OS SCADA Telemetry',
        bullets: [
          'Sub-second telemetry broadcast over Modbus TCP, CAN-bus, and RS485 backbones.',
          'Direct cryptographic handshake with Solana DePIN oracle for transparent investor yield audits.',
          'Dual redundant LTE 4G and dedicated fiber optic communication link to regional dispatch.',
        ],
      },
    ],
    safetyCertifications: [
      'ČSN EN 62619 (Industrial Secondary Lithium Cells Safety)',
      'ČSN EN 62477-1 (Power Conversion System Safety Requirements)',
      'UL 9540A (Thermal Runaway Fire Propagation Test Certified)',
      'ČEPS Grid Code SVR 2024 (FCR / aFRR Qualification)',
      'IP54 Environmental Protection Rating for Exterior Cabinets',
    ],
    warrantySummary:
      '10-year 1-to-1 replacement warranty on battery modules and inverters, backed by Samsung SDI EU guarantee, followed by 10-year guaranteed availability of replacement parts.',
  };

  const activeSpec = spec ?? defaultSpec;

  return (
    <div className="rounded-3xl border border-black/10 bg-white p-6 sm:p-8 shadow-xs space-y-8">
      {/* 1. HEADER */}
      <div className="border-b border-black/10 pb-6">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold tracking-[0.2em] text-t-blue uppercase">
            Hardware & Technology Architecture
          </span>
        </div>
        <h3 className="mt-1 text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
          {activeSpec.title}
        </h3>
        <p className="mt-1 text-xs sm:text-sm text-zinc-600 max-w-3xl leading-relaxed">
          {activeSpec.subtitle}
        </p>
      </div>

      {/* 2. FOUR KEY TECH PILLARS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {activeSpec.stats.map((stat, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-black/10 bg-zinc-50/70 p-4"
          >
            <span
              className={`font-mono text-2xl font-black ${stat.color ?? 'text-zinc-950'}`}
            >
              {stat.value}
            </span>
            <div className="mt-1 font-bold text-xs text-zinc-900">
              {stat.label}
            </div>
            <p className="mt-1 text-[11px] text-zinc-500">{stat.subtext}</p>
          </div>
        ))}
      </div>

      {/* 3. HARDWARE SPEC GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-black/10 p-5 bg-zinc-50/50 space-y-4">
          <h4 className="font-bold text-sm text-zinc-950">
            Key Architectural Advantages & Redundancy
          </h4>
          <div className="space-y-4 text-xs text-zinc-700">
            {activeSpec.features.map((feat, fIdx) => (
              <div key={fIdx} className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-t-blue" />
                  <strong className="text-zinc-950">{feat.title}</strong>
                </div>
                <ul className="pl-4 space-y-1 text-zinc-600 list-disc">
                  {feat.bullets.map((b, bIdx) => (
                    <li key={bIdx}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 p-5 bg-zinc-50/50 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-zinc-950">
              Safety, Standards & Environmental Ratings
            </h4>
            <div className="space-y-2">
              {activeSpec.safetyCertifications.map((cert, cIdx) => (
                <div key={cIdx} className="flex items-start gap-2 text-xs">
                  <CheckIcon className="h-3.5 w-3.5 text-[#183d89] shrink-0 mt-0.5" />
                  <span className="text-zinc-800 font-mono">{cert}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-blue-200/80 bg-blue-50/60 p-4 space-y-1.5">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#183d89]">
              Warranty & Availability SLA
            </span>
            <p className="text-xs text-zinc-700 leading-relaxed">
              {activeSpec.warrantySummary}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
