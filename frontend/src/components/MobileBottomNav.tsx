import type { SVGProps } from 'react';

interface MobileBottomNavProps {
  currentView: 'explore' | 'portfolio' | 'client' | 'admin' | 'pitch';
  selectedSiteId: number | null;
  backedCount: number;
  onNavigate: (
    view: 'explore' | 'portfolio' | 'client' | 'admin' | 'pitch',
  ) => void;
  onOpenHardware?: () => void;
}

function CompassIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      {...props}
    >
      <circle cx={12} cy={12} r={10} strokeWidth={1.75} />
      <polygon
        points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"
        fill="currentColor"
        fillOpacity={0.2}
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WalletIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 12V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-5zm0 0h-4a2 2 0 00-2 2v0a2 2 0 002 2h4v-4z"
      />
    </svg>
  );
}

function BatteryChipIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
      {...props}
    >
      <rect x="2" y="6" width="16" height="12" rx="2.5" />
      <path strokeLinecap="round" d="M20 10v4M6 10v4M10 10v4M14 10v4" />
    </svg>
  );
}

function SparklesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
      />
    </svg>
  );
}

function HardwareHostIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
      />
    </svg>
  );
}

export function MobileBottomNav({
  currentView,
  selectedSiteId,
  backedCount,
  onNavigate,
  onOpenHardware,
}: MobileBottomNavProps) {
  const isExplore = currentView === 'explore' && selectedSiteId === null;
  const isPortfolio = currentView === 'portfolio';
  const isClient = currentView === 'client';
  const isPitch = currentView === 'pitch';

  return (
    <nav
      aria-label="Mobile navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-2xl border-t border-zinc-200/80 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="grid grid-cols-5 h-16 max-w-md mx-auto px-1">
        {/* Tab 1: Explore */}
        <button
          type="button"
          onClick={() => onNavigate('explore')}
          className={`flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
            isExplore
              ? 'text-[#183d89] font-semibold'
              : 'text-zinc-400 hover:text-zinc-700'
          }`}
        >
          <div className="relative">
            <CompassIcon className="h-5.5 w-5.5" />
            {isExplore && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-[#183d89]" />
            )}
          </div>
          <span className="text-[10px] tracking-tight">Explore</span>
        </button>

        {/* Tab 2: Portfolio */}
        <button
          type="button"
          onClick={() => onNavigate('portfolio')}
          className={`flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
            isPortfolio
              ? 'text-[#183d89] font-semibold'
              : 'text-zinc-400 hover:text-zinc-700'
          }`}
        >
          <div className="relative">
            <WalletIcon className="h-5.5 w-5.5" />
            {backedCount > 0 && (
              <span className="absolute -top-1 -right-2 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[#183d89] text-[9px] font-mono font-bold text-white shadow-2xs">
                {backedCount}
              </span>
            )}
            {isPortfolio && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-[#183d89]" />
            )}
          </div>
          <span className="text-[10px] tracking-tight">Portfolio</span>
        </button>

        {/* Tab 3: Host Hardware (0% Capex) */}
        <button
          type="button"
          onClick={() => onNavigate('client')}
          className={`flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
            isClient
              ? 'text-[#183d89] font-semibold'
              : 'text-zinc-400 hover:text-zinc-700'
          }`}
        >
          <div className="relative">
            <HardwareHostIcon className="h-5.5 w-5.5" />
            <span className="absolute -top-1 -right-2 rounded-full bg-blue-100 text-[#183d89] border border-blue-200 px-1 text-[8px] font-mono font-bold">
              0%
            </span>
            {isClient && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-[#183d89]" />
            )}
          </div>
          <span className="text-[10px] tracking-tight">Host Asset</span>
        </button>

        {/* Tab 4: Hardware / SCADA */}
        <button
          type="button"
          onClick={() => {
            if (onOpenHardware) {
              onOpenHardware();
            } else {
              onNavigate('explore');
              setTimeout(() => {
                document
                  .getElementById('campaigns')
                  ?.scrollIntoView({ behavior: 'smooth' });
              }, 150);
            }
          }}
          className="flex flex-col items-center justify-center gap-1 text-zinc-400 hover:text-zinc-700 transition-all cursor-pointer"
        >
          <div className="relative">
            <BatteryChipIcon className="h-5.5 w-5.5" />
          </div>
          <span className="text-[10px] tracking-tight">Hardware</span>
        </button>

        {/* Tab 5: Pitch Deck */}
        <button
          type="button"
          onClick={() => onNavigate('pitch')}
          className={`flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
            isPitch
              ? 'text-[#183d89] font-semibold'
              : 'text-zinc-400 hover:text-zinc-700'
          }`}
        >
          <div className="relative">
            <SparklesIcon className="h-5.5 w-5.5" />
            {isPitch && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-[#183d89]" />
            )}
          </div>
          <span className="text-[10px] tracking-tight">Pitch</span>
        </button>
      </div>
    </nav>
  );
}
