import { useState, useEffect } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useConnectedWallet } from '../wallet/use-connected-wallet';
import { requestWalletApproval } from '../../chain/wallet-action';
import { useVictronInvestments } from './use-victron-investments';
import type { VictronDemoItem } from './victron-types';
import { OffgridLayout } from './layouts/offgrid-layout';
import { EssLayout } from './layouts/ess-layout';
import { EvLayout } from './layouts/ev-layout';
import { TreetinoLayout } from './layouts/treetino-layout';
import { VictronEnergyChart } from './victron-energy-chart';
import { VictronMoneyFlow } from './victron-money-flow';
import { getCampaignCoverImage, CAMPAIGN_METADATA } from './campaign-helpers';
import { ProjectInvestorDossier } from './components/investor-dossier';
import { getProjectDossier } from './data';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BoltIcon,
  TrendUpIcon,
  ExternalLinkIcon,
  CheckIcon,
  ShieldCheckIcon,
} from './victron-icons';
import { CompoundingYieldCalculator } from './components/CompoundingYieldCalculator';

interface VictronAssetPageProps {
  demo: VictronDemoItem;
  onBack: () => void;
  walletAddress?: string;
  walletBalance?: string;
  onBackProject?: (demo: VictronDemoItem) => void;
  onOpenDeposit?: () => void;
}

export function VictronAssetPage({
  demo,
  onBack,
  walletAddress,
  walletBalance,
  onBackProject,
  onOpenDeposit,
}: VictronAssetPageProps) {
  const { connection } = useConnection();
  const { setVisible: openWalletModal } = useWalletModal();
  const wallet = useConnectedWallet();
  const { investments, claimYield } = useVictronInvestments(walletAddress);

  const [claimingSiteId, setClaimingSiteId] = useState<number | null>(null);
  const [claimSuccessText, setClaimSuccessText] = useState<string | null>(null);
  const [claimErrorText, setClaimErrorText] = useState<string | null>(null);

  const handleClaimTicker = async (
    siteId: number,
    baseAmount: number,
    kaminoBonus: number,
  ) => {
    if (
      !wallet &&
      typeof window !== 'undefined' &&
      !(window as unknown as { solana?: unknown }).solana
    ) {
      openWalletModal(true);
      return;
    }

    setClaimingSiteId(siteId);
    setClaimErrorText(null);
    setClaimSuccessText(null);

    try {
      const res = await requestWalletApproval({
        connection,
        wallet,
        actionName: 'claim_kilowatt_dividend',
        memoPayload: {
          site_id: siteId,
          asset_title: demo.title,
          claimed_amount_usdc: Number((baseAmount + kaminoBonus).toFixed(4)),
          base_dividend: Number(baseAmount.toFixed(4)),
          kamino_pool_bonus: Number(kaminoBonus.toFixed(4)),
        },
      });

      claimYield(siteId, baseAmount, kaminoBonus);

      setClaimSuccessText(
        `Claim confirmed on Solana Devnet (tx: ${res.signature.slice(0, 8)}…). Unclaimed dividend reset.`,
      );
      setTimeout(() => setClaimSuccessText(null), 6000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('cancelled') || msg.includes('rejected')) {
        setClaimErrorText('Signing was cancelled in wallet.');
      } else {
        setClaimErrorText(`Claim failed: ${msg}`);
      }
      setTimeout(() => setClaimErrorText(null), 4000);
    } finally {
      setClaimingSiteId(null);
    }
  };

  const [activeTab, setActiveTab] = useState<
    'topology' | 'portu' | 'story' | 'chart' | 'money' | 'hardware'
  >('topology');

  const projectDossier = getProjectDossier(demo.key);

  const meta = CAMPAIGN_METADATA[demo.key] ?? {
    creator: 'Verified Operator',
    daysLeft: 14,
    backers: 42,
  };

  const gateway = demo.devices.find(
    (d) =>
      d.deviceType === 'gateway' ||
      d.name.toLowerCase().includes('gateway') ||
      d.productName.toLowerCase().includes('cerbo'),
  );
  const gatewayName = gateway
    ? gateway.productName || gateway.name
    : 'Cerbo GX';

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [demo.siteId]);

  return (
    <div className="py-4 space-y-8 animate-fade-in">
      {/* 1. TOP BREADCRUMB & BACK ACTION BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200/80 pb-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-full border border-zinc-200/80 bg-white/90 px-4 py-2 font-mono text-xs font-medium text-zinc-800 shadow-xs hover:bg-zinc-50 hover:border-zinc-300 transition active:scale-[0.98] cursor-pointer"
          >
            <ArrowLeftIcon className="h-3.5 w-3.5" />
            <span>Back to Opportunities</span>
          </button>

          <nav
            aria-label="Breadcrumb"
            className="hidden sm:flex items-center gap-2 text-xs text-zinc-400 font-mono"
          >
            <span>/</span>
            <span>Campaigns</span>
            <span>/</span>
            <span className="font-semibold text-zinc-900 truncate max-w-[200px]">
              {demo.title}
            </span>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {projectDossier && (
            <a
              href={projectDossier.downloadPdfPath}
              download={projectDossier.pdfFilename ?? 'Investor_Prospectus.pdf'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200/80 bg-zinc-50/80 px-4 py-2 font-mono text-xs font-semibold text-zinc-900 shadow-xs hover:bg-zinc-100 transition"
            >
              <svg
                className="h-3.5 w-3.5 text-zinc-700"
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
              <span>Official Prospectus (PDF)</span>
            </a>
          )}
          <a
            href={demo.vrmUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200/80 bg-white/90 px-4 py-2 font-mono text-xs font-semibold text-[#183d89] shadow-xs hover:bg-zinc-50 transition"
          >
            <span>Victron VRM Live</span>
            <ExternalLinkIcon className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* 2. ASSET HEADER & 2-COLUMN HERO */}
      <div className="space-y-6">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[#183d89]">
            {demo.categoryBadge} · SITE #{demo.siteId}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl lg:text-5xl">
            {demo.title}
          </h1>
          <p className="mt-2.5 text-sm text-zinc-500 max-w-3xl leading-relaxed sm:text-base font-normal">
            {demo.narrative}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-zinc-500 font-medium">
            <span>
              By{' '}
              <strong className="text-zinc-900 font-semibold">
                {demo.key === 'ess'
                  ? 'WATTINO × EcoPower Solution'
                  : meta.creator}
              </strong>
            </span>
            <span className="text-zinc-300">·</span>
            <span>
              {demo.location.city}, {demo.location.country}
            </span>
            <span className="text-zinc-300">·</span>
            <span className="font-mono text-[#183d89] font-semibold">
              Cerbo GX Verified SCADA
            </span>
          </div>
        </div>

        {/* 2-Column Split: Image Left (60%), Funding Box Right (40%) */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Column: Big Cover Image */}
          <div className="lg:col-span-7">
            <div className="relative aspect-16/10 w-full overflow-hidden rounded-3xl border border-zinc-200/80 bg-zinc-100 shadow-[0_4px_24px_rgba(0,0,0,0.04)] sm:aspect-16/9">
              <img
                src={getCampaignCoverImage(demo.key)}
                alt={demo.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute bottom-4 left-4 rounded-2xl border border-white/10 bg-zinc-950/80 px-4 py-2 font-mono text-xs text-white backdrop-blur-md shadow-md">
                <span>Gateway: {gatewayName}</span>
                <span className="mx-2 text-zinc-400">·</span>
                <span>Mode: {demo.systemInfo.systemState}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Funding Box */}
          <div className="lg:col-span-5 flex flex-col justify-between rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] sm:p-8">
            <div className="space-y-6">
              {/* Progress bar using the ONE signature gradient */}
              <div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full bg-gradient-to-r from-[#183d89] to-[#2563eb] rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(demo.financials.fundedPercent, 100)}%`,
                    }}
                  />
                </div>
                <div className="mt-2.5 flex items-baseline justify-between font-mono text-xs">
                  <span className="font-semibold text-[#183d89]">
                    {demo.financials.fundedPercent}% funded
                  </span>
                  <span className="text-zinc-500">
                    USDC
                    {(
                      demo.financials.targetUsdc - demo.financials.fundedUsdc
                    ).toLocaleString()}{' '}
                    to go
                  </span>
                </div>
              </div>

              {/* Big Metrics */}
              <div className="space-y-4">
                <div>
                  <span className="font-mono text-3xl font-semibold text-zinc-950 sm:text-4xl tracking-tight">
                    USDC {demo.financials.fundedUsdc.toLocaleString()}
                  </span>
                  <span className="ml-2 text-xs text-zinc-500 font-normal">
                    pledged of USDC{' '}
                    {demo.financials.targetUsdc.toLocaleString()} goal
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-zinc-200/80 pt-4">
                  <div>
                    <span className="font-mono text-2xl font-semibold text-[#183d89]">
                      {demo.financials.projectedApy}%
                    </span>
                    <span className="block text-xs text-zinc-500 font-normal">
                      projected yield (APY)
                    </span>
                  </div>
                  <div>
                    <span className="font-mono text-2xl font-semibold text-zinc-950">
                      {meta.daysLeft}
                    </span>
                    <span className="block text-xs text-zinc-500 font-normal">
                      days to go
                    </span>
                  </div>
                </div>

                <div className="border-t border-zinc-200/80 pt-3 flex items-center justify-between text-xs text-zinc-600">
                  <span>Active Backers:</span>
                  <strong className="font-mono text-zinc-950">
                    {meta.backers} backers
                  </strong>
                </div>
                <div className="flex items-center justify-between text-xs text-zinc-600">
                  <span>Contracted PPA Tariff:</span>
                  <strong className="font-mono text-[#183d89]">
                    {demo.financials.tariffRate}
                  </strong>
                </div>
              </div>

              {/* Escrow Badge */}
              <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-xs text-zinc-800 flex items-start gap-3">
                <ShieldCheckIcon className="h-4 w-4 text-[#183d89] shrink-0 mt-0.5" />
                <p className="leading-snug text-zinc-700">
                  <strong className="font-semibold text-zinc-900">
                    Hardware Escrow Guarantee:
                  </strong>{' '}
                  Backing funds are held in programmatic escrow on Solana and
                  released only against cryptographically verified on-site Cerbo
                  GX telemetry.
                </p>
              </div>
            </div>

            {/* Back CTA Button */}
            <div className="mt-6 pt-5 border-t border-zinc-200/80 space-y-2.5">
              {projectDossier && (
                <a
                  href={projectDossier.downloadPdfPath}
                  download={
                    projectDossier.pdfFilename ?? 'Investor_Prospectus.pdf'
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-zinc-200/80 bg-zinc-50 hover:bg-zinc-100 px-4 py-3 text-xs font-semibold text-zinc-900 transition shadow-xs cursor-pointer group"
                >
                  <svg
                    className="h-4 w-4 text-zinc-700 group-hover:translate-y-0.5 transition"
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
                  <span>Download Complete Investor Prospectus (PDF)</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => {
                  if (onBackProject) {
                    onBackProject(demo);
                  } else {
                    setActiveTab('money');
                  }
                }}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#183d89] to-[#2563eb] hover:from-[#1d4bb5] hover:to-[#3b82f6] px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98] cursor-pointer"
              >
                <span>Back this project with USDC</span>
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SECTION TABS (4 Clean, Purposeful Sections) */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl border border-zinc-200/80 bg-zinc-100/70 text-xs font-medium overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('topology')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 transition cursor-pointer shrink-0 ${
            activeTab === 'topology'
              ? 'bg-white text-zinc-950 font-semibold shadow-xs'
              : 'text-zinc-600 hover:text-zinc-950 hover:bg-white/50'
          }`}
        >
          <BoltIcon className="h-3.5 w-3.5 text-[#183d89]" />
          <span>Live Power & SCADA</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('portu')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 transition cursor-pointer shrink-0 ${
            activeTab === 'portu'
              ? 'bg-white text-[#183d89] font-semibold shadow-xs'
              : 'text-zinc-600 hover:text-zinc-950 hover:bg-white/50'
          }`}
        >
          <TrendUpIcon className="h-3.5 w-3.5 text-[#183d89]" />
          <span>Yield Projections & Compounding</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('story')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 transition cursor-pointer shrink-0 ${
            activeTab === 'story'
              ? 'bg-white text-zinc-950 font-semibold shadow-xs'
              : 'text-zinc-600 hover:text-zinc-950 hover:bg-white/50'
          }`}
        >
          <span>Investor Prospectus & Contracts</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('hardware')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 transition cursor-pointer shrink-0 ${
            activeTab === 'hardware'
              ? 'bg-white text-zinc-950 font-semibold shadow-xs'
              : 'text-zinc-600 hover:text-zinc-950 hover:bg-white/50'
          }`}
        >
          <span>Physical Devices ({demo.devices.length})</span>
        </button>
      </div>

      {/* 4. ACTIVE TAB CONTENT */}
      {/* TAB 1: TOPOLOGY POWER FLOW (Default) */}
      {activeTab === 'topology' && (
        <div className="space-y-8">
          {/* Distinct Hardware Layout based on site key (WATTINO hBESS, ČEZ Distribuce, ČEPS dispatch, Samsung SDI EU, Cerbo-S GX Venus OS) */}
          {demo.key === 'treetino-v1' && (
            <TreetinoLayout
              demo={demo}
              holding={investments[demo.siteId]}
              onClaim={handleClaimTicker}
              isClaiming={claimingSiteId === demo.siteId}
              claimSuccessText={claimSuccessText}
              claimErrorText={claimErrorText}
              onBackProject={() => onBackProject?.(demo)}
            />
          )}
          {demo.key === 'offgrid' && (
            <OffgridLayout
              demo={demo}
              holding={investments[demo.siteId]}
              onClaim={handleClaimTicker}
              isClaiming={claimingSiteId === demo.siteId}
              claimSuccessText={claimSuccessText}
              claimErrorText={claimErrorText}
              onBackProject={() => onBackProject?.(demo)}
            />
          )}
          {demo.key === 'ess' && (
            <EssLayout
              demo={demo}
              holding={investments[demo.siteId]}
              onClaim={handleClaimTicker}
              isClaiming={claimingSiteId === demo.siteId}
              claimSuccessText={claimSuccessText}
              claimErrorText={claimErrorText}
              onBackProject={() => onBackProject?.(demo)}
            />
          )}
          {demo.key === 'ev' && (
            <EvLayout
              demo={demo}
              holding={investments[demo.siteId]}
              onClaim={handleClaimTicker}
              isClaiming={claimingSiteId === demo.siteId}
              claimSuccessText={claimSuccessText}
              claimErrorText={claimErrorText}
              onBackProject={() => onBackProject?.(demo)}
            />
          )}

          {/* Portu-inspired Compounding DePIN Yield Projection Model */}
          <CompoundingYieldCalculator
            initialApy={demo.financials.projectedApy}
            assetTitle={demo.title}
            onBackProject={() => onBackProject?.(demo)}
          />

          {/* 24-Hour Energy Data Chart integrated directly underneath */}
          <VictronEnergyChart
            hourlyData={demo.hourlyData}
            dailyTotals={demo.dailyTotals}
            isEv={demo.key === 'ev'}
          />
        </div>
      )}

      {/* TAB 2: PORTU COMPOUNDING MODEL */}
      {activeTab === 'portu' && (
        <div className="space-y-6">
          <CompoundingYieldCalculator
            initialApy={demo.financials.projectedApy}
            assetTitle={demo.title}
            onBackProject={() => onBackProject?.(demo)}
          />
        </div>
      )}

      {/* TAB 3: INVESTOR DOSSIER & FINANCIAL MODEL */}
      {activeTab === 'story' && (
        <ProjectInvestorDossier dossier={projectDossier} />
      )}

      {/* TAB 2: 24-HOUR ENERGY DATA HISTORY */}
      {activeTab === 'chart' && (
        <VictronEnergyChart
          hourlyData={demo.hourlyData}
          dailyTotals={demo.dailyTotals}
          isEv={demo.key === 'ev'}
        />
      )}

      {/* TAB 3: MONEY FLOW & INVESTOR ALLOCATION CALCULATOR */}
      {activeTab === 'money' && (
        <VictronMoneyFlow
          demo={demo}
          walletAddress={walletAddress}
          walletBalance={walletBalance}
          onOpenDeposit={onOpenDeposit}
          onBackProject={onBackProject}
        />
      )}

      {/* TAB 4: PHYSICAL HARDWARE DEVICES */}
      {activeTab === 'hardware' && (
        <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
          <div className="border-b border-zinc-200/80 pb-5">
            <h3 className="text-xl font-semibold text-zinc-950">
              Venus OS D-Bus Connected Hardware ({demo.devices.length} Physical
              Components)
            </h3>
            <p className="mt-1 text-xs text-zinc-500 font-normal">
              Verified physical devices communicating via VE.Can, VE.Direct, and
              Modbus TCP with the Cerbo GX gateway.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {demo.devices.map((device, idx) => (
              <div
                key={idx}
                className="flex flex-col justify-between rounded-2xl border border-zinc-200/80 bg-zinc-50/60 p-4 text-xs shadow-xs hover:border-zinc-300 hover:bg-white transition-all"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-zinc-400 uppercase font-semibold">
                      {device.name}
                    </span>
                    <span className="flex items-center gap-1 text-[#183d89] font-semibold text-[10px]">
                      <CheckIcon className="h-3 w-3" />
                      Online
                    </span>
                  </div>
                  <h4 className="mt-2 font-semibold text-zinc-950 text-sm">
                    {device.modelName}
                  </h4>
                  <p className="mt-0.5 text-zinc-500 text-xs">
                    {device.productName}
                  </p>
                </div>

                {device.firmwareVersion && (
                  <div className="mt-3 border-t border-zinc-200/60 pt-2 font-mono text-[11px] text-zinc-400">
                    Firmware: {device.firmwareVersion}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Sticky Backing Bar */}
      <div className="fixed bottom-16 sm:bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-zinc-200/80 p-3 sm:hidden shadow-lg">
        <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
          <div>
            <div className="font-mono text-xs font-bold text-emerald-600">
              +{demo.financials.projectedApy}% APY
            </div>
            <div className="font-mono text-[10px] text-zinc-500">
              {demo.financials.fundedPercent}% funded · Min USDC 50
            </div>
          </div>
          <button
            type="button"
            onClick={() => onBackProject?.(demo)}
            className="flex items-center gap-1.5 rounded-full bg-[#183d89] hover:bg-[#2052b0] active:scale-95 text-white px-5 py-2.5 font-mono text-xs font-bold shadow-md cursor-pointer"
          >
            <span>Back Project</span>
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
