import { ArrowRightIcon } from '../features/victron/victron-icons';

interface TreetinoHardwareShowcaseProps {
  onSelectAsset?: (siteId: number) => void;
  onBackProject?: (siteId: number) => void;
}

interface HardwareAssetCard {
  siteId: number;
  category: string;
  title: string;
  badge: string;
  apy: string;
  dualEngineNote?: string;
  img: string;
  description: string;
  specs: string[];
}

const HARDWARE_ASSETS: HardwareAssetCard[] = [
  {
    siteId: 219742,
    category: 'Grid Battery Storage · Prime Yield',
    title: 'BESS Přeštice 8.6 MW',
    badge: '8.6 MW / 17.2 MWh',
    apy: '35.0% APY',
    dualEngineNote: '20% Arb + 15% Standby',
    img: '/campaigns/ess.jpg',
    description:
      'Monetizes EU grid volatility: charges during negative midday solar prices (20% arbitrage) and earns ČEPS transmission standby fees (15%).',
    specs: ['2× Signed ČEZ PPA', 'Sub-10ms Inverter', '22 kV Substation'],
  },
  {
    siteId: 100001,
    category: 'Biomimetic Kinetic Microgrid',
    title: 'Treetino V1 Energy Tree',
    badge: '35 kWp Peak',
    apy: '12.8% APY',
    img: '/products/main-tree.png',
    description:
      'Sculptural 12m smart tree with 22 sun-tracking leaves and 12 ducted vertical turbines powering industrial CNC fabrication.',
    specs: ['22 Sun-Tracking Leaves', '12 VAWT Turbines', '15-Yr MKovo PPA'],
  },
  {
    siteId: 374891,
    category: 'DePIN Fast EV Mobility',
    title: 'Ultra-Fast EV Charging Plaza',
    badge: '10 High-Power Bays',
    apy: '18.5% APY',
    img: '/products/V1.png',
    description:
      'DC fast charging plaza buffered by solar canopy and storage, settling recurring vehicle micro-transactions via native energy stablecoin.',
    specs: ['10 Charging Bays', 'Native Energy Stablecoin', 'Fleet Concession'],
  },
  {
    siteId: 209689,
    category: 'Utility Wind Turbines',
    title: 'Wind Park Kryry 4.0 MW',
    badge: '2× Vestas V80',
    apy: '14.2% APY',
    img: '/campaigns/wind.jpg',
    description:
      'Two 2.0 MW Vestas V80 industrial wind turbines in Kryry feeding the Czech 22 kV distribution grid under a 20-year ČEZ concession.',
    specs: ['4.0 MW Grid Feed', '20-Year ČEZ Concession', '80m Hub Height'],
  },
];

export function TreetinoHardwareShowcase({
  onSelectAsset,
  onBackProject,
}: TreetinoHardwareShowcaseProps) {
  return (
    <section
      id="hardware-showcase"
      className="relative bg-white text-zinc-950 py-16 sm:py-20 lg:py-24 border-b border-zinc-200/80"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10 sm:mb-12">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[#183d89] mb-2">
              Real Hardware Infrastructure
            </p>
            <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight text-zinc-950">
              Physical Assets Backing Your Yield
            </h2>
            <p className="mt-2 text-sm text-zinc-500 font-normal max-w-2xl leading-relaxed">
              Unlike vaporware crypto projects, every pool token represents real
              physical machinery on the ground with live Victron Cerbo GX
              telemetry and signed utility PPAs.
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-zinc-500 shrink-0">
            <span>4 Operating Asset Classes</span>
            <span>·</span>
            <span className="text-[#183d89] font-bold">12.8% – 35.0% APY</span>
          </div>
        </div>

        {/* 4-Card Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {HARDWARE_ASSETS.map((asset) => (
            <div
              key={asset.siteId}
              className="group flex flex-col justify-between rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-xs hover:border-zinc-300 hover:shadow-lg transition-all duration-300"
            >
              <div className="space-y-4">
                {/* Image Container */}
                <div className="relative aspect-4/3 w-full overflow-hidden rounded-2xl bg-zinc-100 border border-zinc-200/60">
                  <img
                    src={asset.img}
                    alt={asset.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Title & Category */}
                <div>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#183d89]">
                      {asset.category}
                    </span>
                    <span className="font-mono text-sm font-bold text-[#183d89] shrink-0">
                      {asset.apy}
                    </span>
                  </div>
                  <h3 className="mt-1 text-lg font-semibold text-zinc-950 group-hover:text-[#183d89] transition-colors leading-snug">
                    {asset.title}
                  </h3>
                  {asset.dualEngineNote && (
                    <p className="font-mono text-xs text-blue-700 font-medium mt-0.5">
                      {asset.dualEngineNote}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-zinc-600 font-normal leading-relaxed line-clamp-3">
                    {asset.description}
                  </p>
                </div>

                {/* Clean Specs Typography */}
                <p className="font-mono text-[11px] text-zinc-500 pt-1">
                  {asset.specs.join(' · ')}
                </p>
              </div>

              {/* Action Buttons Row */}
              <div className="mt-5 pt-3 border-t border-zinc-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onBackProject) {
                      onBackProject(asset.siteId);
                    } else {
                      onSelectAsset?.(asset.siteId);
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#183d89] to-[#2563eb] hover:from-[#1d4bb5] hover:to-[#3b82f6] py-2 px-3 text-xs font-semibold text-white shadow-2xs transition active:scale-[0.98] cursor-pointer"
                >
                  <span>Invest in Pool</span>
                  <ArrowRightIcon className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => onSelectAsset?.(asset.siteId)}
                  className="rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 px-3 py-2 text-xs font-mono text-zinc-700 transition active:scale-[0.98] cursor-pointer shrink-0"
                  title="Inspect Telemetry"
                >
                  Telemetry ↗
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
