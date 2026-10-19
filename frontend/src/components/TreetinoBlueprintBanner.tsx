import { ArrowRightIcon } from '../features/victron/victron-icons';

interface TreetinoBlueprintBannerProps {
  onExplorePools?: () => void;
  onFaucetClick?: () => void;
  faucetPending?: boolean;
}

export function TreetinoBlueprintBanner({
  onExplorePools,
  onFaucetClick,
  faucetPending,
}: TreetinoBlueprintBannerProps) {
  return (
    <section
      id="how-it-works"
      className="relative overflow-hidden bg-gradient-to-br from-[#081838] via-[#0d224d] to-[#183d89] py-20 sm:py-28 text-white"
    >
      {/* Clean Ambient Radial Glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_50%_35%,rgba(37,99,235,0.22),transparent_70%)]" />

      {/* Subtle Blueprint Contour Texture */}
      <div className="pointer-events-none absolute inset-0 opacity-10 overflow-hidden mix-blend-screen">
        <img
          src="/img/treetino-vrstevnice.png"
          alt=""
          className="h-full w-full object-cover scale-105"
        />
      </div>

      {/* Main Centered Content */}
      <div className="relative z-10 mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
        {/* Eyebrow */}
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-blue-200">
          Real Infrastructure · Zero Vaporware
        </p>

        {/* Main Title */}
        <h2 className="mt-5 text-3xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-white leading-tight">
          Invest in Real Energy Infrastructure From Your Phone
        </h2>

        {/* Lead Paragraph */}
        <p className="mt-4 max-w-2xl text-base sm:text-lg text-zinc-200 font-normal leading-relaxed">
          USDC 3 trillion was added to energy markets last year, yet ordinary
          people only pay the bills. Treetino changes that by tokenizing real
          operating clean power assets — from 35% APY grid batteries to kinetic
          trees and wind turbines — backed by signed utility PPAs, licenses, and
          certified technicians.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={onExplorePools}
            className="flex items-center gap-2 rounded-full bg-white text-[#0c2356] hover:bg-zinc-100 px-8 py-3.5 text-sm font-semibold shadow-2xl transition-all hover:scale-105 active:scale-[0.98] cursor-pointer"
          >
            <span>Explore Active Assets</span>
            <ArrowRightIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={faucetPending}
            onClick={onFaucetClick}
            className="rounded-full border border-white/20 bg-white/10 hover:bg-white/15 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur-md shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {faucetPending
              ? 'Depositing USDC…'
              : '+ Deposit Test Capital (USDC 1,000)'}
          </button>
        </div>

        {/* Platform Metric Ribbon */}
        <div className="mt-14 grid w-full grid-cols-1 sm:grid-cols-3 gap-6 border-t border-white/10 pt-10 text-center font-mono">
          <div>
            <span className="block text-2xl sm:text-3xl font-light text-white">
              USDC 3T+ Added
            </span>
            <span className="mt-1 block text-xs text-blue-200/80 uppercase tracking-wider">
              Global Energy Market Opportunity
            </span>
          </div>
          <div>
            <span className="block text-2xl sm:text-3xl font-light text-white">
              Up to 35.0% APY
            </span>
            <span className="mt-1 block text-xs text-blue-200/80 uppercase tracking-wider">
              Dual-Engine Battery Arbitrage & Standby
            </span>
          </div>
          <div>
            <span className="block text-2xl sm:text-3xl font-light text-white">
              Solana Anchor PDA
            </span>
            <span className="mt-1 block text-xs text-blue-200/80 uppercase tracking-wider">
              Live Victron SCADA Attestations
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
