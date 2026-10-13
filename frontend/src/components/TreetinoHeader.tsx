import { useState, useEffect } from 'react';
import { BaseWalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { LogoType } from './LogoType';

const walletLabels = {
  'no-wallet': 'Connect Wallet',
  'has-wallet': 'Connect Wallet',
  connecting: 'Connecting…',
  'change-wallet': 'Change Wallet',
  'copy-address': 'Copy Address',
  copied: 'Copied!',
  disconnect: 'Disconnect',
};

interface TreetinoHeaderProps {
  currentView: 'explore' | 'portfolio' | 'client' | 'admin' | 'pitch';
  selectedSiteId: number | null;
  backedCount: number;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onClearSearch?: () => void;
  onNavigate: (
    view: 'explore' | 'portfolio' | 'client' | 'admin' | 'pitch',
  ) => void;
  walletBalance?: string;
  onOpenDeposit?: () => void;
}

export function TreetinoHeader({
  currentView,
  selectedSiteId,
  backedCount,
  onNavigate,
  walletBalance,
  onOpenDeposit,
}: TreetinoHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isDark =
    currentView === 'explore' && selectedSiteId === null && !isScrolled;

  const scrollTo = (id: string) => {
    const targetId =
      id === 'kickstarter-campaigns' || id === 'campaigns'
        ? typeof window !== 'undefined' && window.innerWidth < 768
          ? 'mobile-campaigns'
          : 'kickstarter-campaigns'
        : id;

    if (currentView !== 'explore' || selectedSiteId !== null) {
      onNavigate('explore');
      setTimeout(() => {
        const el =
          document.getElementById(targetId) ??
          document.getElementById('kickstarter-campaigns') ??
          document.getElementById('campaigns');
        el?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } else {
      const el =
        document.getElementById(targetId) ??
        document.getElementById('kickstarter-campaigns') ??
        document.getElementById('campaigns');
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 z-50 w-full transition-all duration-300 bg-white/95 border-b border-zinc-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] backdrop-blur-xl text-zinc-950 ${
        isDark
          ? 'md:pointer-events-none md:bg-transparent md:border-b-0 md:shadow-none'
          : ''
      }`}
    >
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 py-2 sm:py-2.5 pointer-events-auto">
        <div
          className={`flex h-12 sm:h-14 w-full items-center justify-between rounded-2xl transition-all duration-300 px-3 sm:px-6 ${
            isDark
              ? 'text-zinc-950 md:border md:border-white/10 md:bg-zinc-950/80 md:text-white md:shadow-2xl md:backdrop-blur-2xl'
              : 'text-zinc-950'
          }`}
        >
          {/* 1. Pure Brand Logo */}
          <div className="flex items-center shrink-0 mr-4 lg:mr-8">
            <button
              type="button"
              onClick={() => {
                if (currentView === 'explore' && selectedSiteId === null) {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                  onNavigate('explore');
                }
              }}
              className="cursor-pointer transition-opacity hover:opacity-85 flex items-center"
              aria-label="Treetino Home"
            >
              <LogoType
                className={`h-6 sm:h-6.5 transition-colors duration-300 text-zinc-950 ${
                  isDark ? 'md:text-white' : ''
                }`}
              />
            </button>
          </div>

          {/* 2. Primary Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-7 text-sm font-medium tracking-normal whitespace-nowrap">
            <button
              type="button"
              onClick={() => scrollTo('kickstarter-campaigns')}
              className={`transition-colors cursor-pointer whitespace-nowrap py-1 ${
                currentView === 'explore' && selectedSiteId === null
                  ? isDark
                    ? 'text-white font-semibold'
                    : 'text-zinc-950 font-semibold'
                  : isDark
                    ? 'text-zinc-400 hover:text-white'
                    : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              Explore Assets
            </button>

            <button
              type="button"
              onClick={() => scrollTo('bond-explainer')}
              className={`transition-colors cursor-pointer whitespace-nowrap py-1 ${
                isDark
                  ? 'text-zinc-400 hover:text-white'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              How Yield Works
            </button>

            <button
              type="button"
              onClick={() => onNavigate('portfolio')}
              className={`transition-colors cursor-pointer whitespace-nowrap py-1 inline-flex items-center gap-2 ${
                currentView === 'portfolio' && selectedSiteId === null
                  ? isDark
                    ? 'text-white font-semibold'
                    : 'text-zinc-950 font-semibold'
                  : isDark
                    ? 'text-zinc-400 hover:text-white'
                    : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              <span>My Portfolio</span>
              {backedCount > 0 && (
                <span className="rounded-full bg-[#183d89] px-2 py-0.5 text-[11px] text-white font-mono font-bold leading-none">
                  {backedCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => onNavigate('client')}
              className={`transition-colors cursor-pointer whitespace-nowrap py-1 inline-flex items-center gap-1.5 ${
                currentView === 'client' && selectedSiteId === null
                  ? isDark
                    ? 'text-white font-semibold'
                    : 'text-zinc-950 font-semibold'
                  : isDark
                    ? 'text-zinc-400 hover:text-white'
                    : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              <span>Host Hardware</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-mono font-bold leading-none ${
                  isDark
                    ? 'bg-blue-500/20 text-blue-300'
                    : 'bg-blue-50 text-[#183d89] border border-blue-200'
                }`}
              >
                0% CAPEX
              </span>
            </button>
          </nav>

          {/* 3. Actions & Wallet */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 whitespace-nowrap ml-auto">
            {/* Wallet Balance / Deposit Pill */}
            {walletBalance && onOpenDeposit && (
              <button
                type="button"
                onClick={onOpenDeposit}
                className={`inline-flex items-center gap-1 sm:gap-1.5 rounded-full border px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-mono transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
                  isDark
                    ? 'border-white/20 bg-white/10 text-white hover:bg-white/20'
                    : 'border-zinc-200 bg-zinc-50 text-zinc-900 hover:bg-zinc-100 hover:border-zinc-300'
                }`}
                title="Deposit test EURTree funds"
              >
                <span className="font-semibold">€{walletBalance}</span>
                <span className="text-[10px] text-zinc-400 hidden sm:inline">
                  EURTree
                </span>
                <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#183d89] text-white text-[10px] font-bold">
                  +
                </span>
              </button>
            )}

            {/* Connect Wallet Button */}
            <div className="shrink-0 whitespace-nowrap">
              <BaseWalletMultiButton labels={walletLabels} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
