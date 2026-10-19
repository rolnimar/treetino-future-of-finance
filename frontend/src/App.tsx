import { lazy, Suspense, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from './lib/api';
import { protocolSchema } from './lib/schemas';
import { AdminAccess } from './AdminAccess';
import { VictronAssetPage } from './features/victron/victron-asset-page';
import { useEnrichedCampaigns } from './features/victron/use-enriched-campaigns';
import { useConnectedWallet } from './features/wallet/use-connected-wallet';
import { useUsdc } from './features/marketplace/hooks/use-mock-usdc';
import { usePublicTransactions } from './features/marketplace/hooks/use-public-transactions';
import { formatTokenAmount } from './chain/amounts';
import { InvestorPortfolio } from './features/investor/investor-portfolio';
import { useVictronInvestments } from './features/victron/use-victron-investments';
import { TreetinoHeader } from './components/TreetinoHeader';
import { TreetinoFooter } from './components/TreetinoFooter';
import { TreetinoHeroCinematic } from './components/TreetinoHeroCinematic';
import { TreetinoBlueprintBanner } from './components/TreetinoBlueprintBanner';
import { DepositModal } from './features/fintech/DepositModal';
import { BackProjectModal } from './features/fintech/BackProjectModal';
import { PitchDeck } from './features/pitch/pitch-deck';
import { ChargingPage } from './features/devices/charging-page';
import { MobileBottomNav } from './components/MobileBottomNav';
import type { VictronDemoItem } from './features/victron/victron-types';

const Marketplace = lazy(() =>
  import('./features/marketplace/marketplace').then((module) => ({
    default: module.Marketplace,
  })),
);
const ClientAccess = lazy(() =>
  import('./features/client/client-access').then((module) => ({
    default: module.ClientAccess,
  })),
);

export function App() {
  const [chargingSiteId, setChargingSiteId] = useState<number | null>(() => {
    const match = window.location.hash.match(/^#charge\/(\d+)$/);
    return match ? Number(match[1]) : null;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(() => {
    if (typeof window === 'undefined') return null;
    const match = window.location.hash.match(
      /^#(?:asset|project|victron(?:\/site|-)?)\/?(\d+)$/,
    );
    return match ? parseInt(match[1], 10) : null;
  });

  const [currentView, setCurrentView] = useState<
    'explore' | 'portfolio' | 'client' | 'admin' | 'pitch'
  >(() => {
    if (typeof window === 'undefined') return 'explore';
    if (
      window.location.pathname === '/pitch' ||
      window.location.hash === '#pitch'
    )
      return 'pitch';
    if (window.location.hash === '#portfolio') return 'portfolio';
    if (window.location.hash === '#client') return 'client';
    if (window.location.hash === '#admin') return 'admin';
    return 'explore';
  });

  const wallet = useConnectedWallet();
  const balance = useUsdc(wallet?.address);
  const publicTransactions = usePublicTransactions(wallet);
  const formattedBalance = balance.data
    ? formatTokenAmount(balance.data.balance)
    : undefined;

  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [backingModalDemo, setBackingModalDemo] =
    useState<VictronDemoItem | null>(null);

  const { investments } = useVictronInvestments(wallet?.address);
  const backedCount = Object.values(investments).filter(
    (i) => i.amountUsdc > 0,
  ).length;

  const { data: protocol, isError: unavailable } = useQuery({
    queryKey: ['protocol'],
    queryFn: ({ signal }) => api('protocol', protocolSchema, { signal }),
  });

  const { demos } = useEnrichedCampaigns();

  // Hash- and path-based clean page routing
  useEffect(() => {
    const handleRouteSync = () => {
      const hash = window.location.hash;
      const pathname = window.location.pathname;
      const charging = hash.match(/^#charge\/(\d+)$/);
      setChargingSiteId(charging ? Number(charging[1]) : null);
      if (charging) {
        setSelectedSiteId(null);
        return;
      }

      if (pathname === '/pitch' || hash === '#pitch') {
        setSelectedSiteId(null);
        setCurrentView('pitch');
        return;
      }

      const match = hash.match(
        /^#(?:asset|project|victron(?:\/site|-)?)\/?(\d+)$/,
      );
      if (match) {
        setSelectedSiteId(parseInt(match[1], 10));
      } else {
        setSelectedSiteId(null);
        if (hash === '#portfolio') setCurrentView('portfolio');
        else if (hash === '#client') setCurrentView('client');
        else if (hash === '#admin') setCurrentView('admin');
        else setCurrentView('explore');
      }
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    };

    window.addEventListener('hashchange', handleRouteSync);
    window.addEventListener('popstate', handleRouteSync);
    handleRouteSync();
    return () => {
      window.removeEventListener('hashchange', handleRouteSync);
      window.removeEventListener('popstate', handleRouteSync);
    };
  }, []);

  const handleNavigate = (
    view: 'explore' | 'portfolio' | 'client' | 'admin' | 'pitch',
  ) => {
    setSelectedSiteId(null);
    setCurrentView(view);
    if (view === 'explore') {
      if (window.location.pathname === '/pitch') {
        window.history.pushState(null, '', '/');
      }
      window.location.hash = '';
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    } else {
      window.location.hash = view;
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  };

  const selectedDemo = demos.find((d) => d.siteId === selectedSiteId);

  if (chargingSiteId !== null)
    return <ChargingPage key={chargingSiteId} siteId={chargingSiteId} />;

  if (currentView === 'pitch') {
    return (
      <div className="treetino-app-pitch-root min-h-screen bg-[#07090e] text-zinc-100 selection:bg-[#183d89] selection:text-white">
        <PitchDeck
          onExit={() => handleNavigate('explore')}
          onExploreCampaigns={() => {
            handleNavigate('explore');
            setTimeout(() => {
              document
                .getElementById('campaigns')
                ?.scrollIntoView({ behavior: 'smooth' });
            }, 150);
          }}
          onOpenDeposit={() => setIsDepositModalOpen(true)}
        />

        <DepositModal
          isOpen={isDepositModalOpen}
          onClose={() => setIsDepositModalOpen(false)}
          currentBalance={formattedBalance}
        />

        <BackProjectModal
          isOpen={backingModalDemo !== null}
          onClose={() => setBackingModalDemo(null)}
          demo={backingModalDemo}
          walletBalance={formattedBalance}
          onOpenDeposit={() => setIsDepositModalOpen(true)}
          onNavigatePortfolio={() => {
            setBackingModalDemo(null);
            handleNavigate('portfolio');
          }}
        />
      </div>
    );
  }

  return (
    <div className="treetino-app-shell min-h-screen flex flex-col bg-[#fcfcfd] text-zinc-900 selection:bg-[#183d89] selection:text-white">
      {/* Floating Modern Translucent Pill Header */}
      <TreetinoHeader
        currentView={currentView}
        selectedSiteId={selectedSiteId}
        backedCount={backedCount}
        walletBalance={formattedBalance}
        onOpenDeposit={() => setIsDepositModalOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          if (currentView !== 'explore' || selectedSiteId !== null) {
            window.location.hash = '';
            setSelectedSiteId(null);
            setCurrentView('explore');
          }
        }}
        onClearSearch={() => setSearchQuery('')}
        onNavigate={handleNavigate}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full pb-20 md:pb-0">
        {/* VIEW 1: DEDICATED FRESH PAGE VIEW IF AN ASSET IS SELECTED */}
        {selectedSiteId !== null ? (
          <div className="mx-auto flex w-full max-w-7xl flex-col px-3 sm:px-6 lg:px-8 pt-16 md:pt-32 pb-24">
            {selectedDemo ? (
              <VictronAssetPage
                demo={selectedDemo}
                onBack={() => {
                  window.location.hash = '';
                  setSelectedSiteId(null);
                }}
                walletAddress={wallet?.address}
                walletBalance={formattedBalance}
                onBackProject={(demo) => setBackingModalDemo(demo)}
                onOpenDeposit={() => setIsDepositModalOpen(true)}
              />
            ) : (
              <div className="py-32 text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-t-blue border-t-transparent" />
                <p className="mt-4 font-mono text-xs text-zinc-600">
                  Loading clean energy asset #{selectedSiteId}…
                </p>
              </div>
            )}
          </div>
        ) : currentView === 'portfolio' ? (
          /* VIEW 2: INVESTOR PORTFOLIO DASHBOARD */
          <div className="mx-auto flex w-full max-w-7xl flex-col px-3 sm:px-6 lg:px-8 pt-16 md:pt-32 pb-24">
            <InvestorPortfolio
              onSelectAsset={(id) => {
                window.location.hash = `asset/${id}`;
                setSelectedSiteId(id);
              }}
              onExplore={() => handleNavigate('explore')}
              onOpenDeposit={() => setIsDepositModalOpen(true)}
              onBackProject={(demo) => setBackingModalDemo(demo)}
            />
          </div>
        ) : currentView === 'client' ? (
          /* VIEW 3: CLIENT BILLING WORKSPACE */
          <div className="mx-auto flex w-full max-w-7xl flex-col px-3 sm:px-6 lg:px-8 pt-16 md:pt-32 pb-24">
            <Suspense
              fallback={
                <div className="py-24 text-center">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-t-blue border-t-transparent" />
                  <p className="mt-3 text-xs text-zinc-500">
                    Loading client billing workspace…
                  </p>
                </div>
              }
            >
              <ClientAccess />
            </Suspense>
          </div>
        ) : currentView === 'admin' ? (
          /* VIEW 4: ADMIN PROTOCOL WORKSPACE */
          <div className="mx-auto flex w-full max-w-7xl flex-col px-3 sm:px-6 lg:px-8 pt-16 md:pt-32 pb-24">
            <AdminAccess />
          </div>
        ) : (
          /* VIEW 5: KICKSTARTER RWA PLATFORM CROWDFUNDING ARCHITECTURE */
          <>
            {/* 1. Featured Crowdfunding Campaign Spotlight Hero (Desktop only) */}
            <div className="hidden md:block">
              <TreetinoHeroCinematic
                demos={demos}
                onSelectAsset={(id) => {
                  window.location.hash = `asset/${id}`;
                  setSelectedSiteId(id);
                }}
                onBackProject={(siteId) => {
                  const target = demos.find((d) => d.siteId === siteId);
                  if (target) {
                    setBackingModalDemo(target);
                  } else {
                    window.location.hash = `asset/${siteId}`;
                    setSelectedSiteId(siteId);
                  }
                }}
                onExploreCampaigns={() => {
                  const el =
                    document.getElementById('kickstarter-campaigns') ??
                    document.getElementById('campaigns');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
              />
            </div>

            {/* 2. Kickstarter Campaigns Directory & Crowdfunding Discovery */}
            <section
              id="marketplace-section"
              className="bg-[#fafafb] pt-14 pb-16 md:py-20 sm:py-28 lg:py-32 border-b border-zinc-200/80"
            >
              <div className="mx-auto flex w-full max-w-7xl flex-col px-4 sm:px-6 lg:px-8">
                <Suspense
                  fallback={
                    <div className="py-24 text-center">
                      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-t-blue border-t-transparent" />
                      <p className="mt-4 font-mono text-xs text-zinc-600">
                        Loading active campaigns…
                      </p>
                    </div>
                  }
                >
                  <Marketplace
                    onSelectAsset={(id) => {
                      window.location.hash = `asset/${id}`;
                      setSelectedSiteId(id);
                    }}
                    onBackProject={(demo) => setBackingModalDemo(demo)}
                    searchQuery={searchQuery}
                    onClearSearch={() => setSearchQuery('')}
                  />
                </Suspense>
              </div>
            </section>

            {/* 3. How RWA Tokenization Works & Faucet */}
            <TreetinoBlueprintBanner
              onExplorePools={() => {
                const el =
                  document.getElementById('kickstarter-campaigns') ??
                  document.getElementById('campaigns');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              onFaucetClick={() => setIsDepositModalOpen(true)}
              faucetPending={publicTransactions.isPending}
            />
          </>
        )}
      </main>

      {/* Official Treetino Footer */}
      <TreetinoFooter
        protocolStatus={{
          connected: !!protocol,
          unavailable,
        }}
      />

      {/* 6. High-End Fintech Modals */}
      <DepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        currentBalance={formattedBalance}
      />

      <BackProjectModal
        isOpen={backingModalDemo !== null}
        onClose={() => setBackingModalDemo(null)}
        demo={backingModalDemo}
        walletBalance={formattedBalance}
        onOpenDeposit={() => setIsDepositModalOpen(true)}
        onNavigatePortfolio={() => {
          setBackingModalDemo(null);
          handleNavigate('portfolio');
        }}
      />

      {/* Mobile Bottom Dock Navigation (Phantom / Revolut Style) */}
      <MobileBottomNav
        currentView={currentView}
        selectedSiteId={selectedSiteId}
        backedCount={backedCount}
        onNavigate={handleNavigate}
      />
    </div>
  );
}
