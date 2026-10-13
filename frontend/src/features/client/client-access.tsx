import { useState } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import type { ConnectedWallet } from '../../chain/wallet';
import { Button } from '../../components/ui/button';
import { ErrorMessage } from '../../components/ui/feedback';
import { useConnectedWallet } from '../wallet/use-connected-wallet';
import { useClientSession } from './use-client-session';
import { ClientWorkspace } from './client-workspace';
import { useClientCollateral } from './use-client-collateral';
import { BuyerCollateralModal } from './BuyerCollateralModal';
import { requestWalletApproval } from '../../chain/wallet-action';
import {
  ExternalLinkIcon,
  CheckIcon,
  HardwareNodeIcon,
  BoltIcon,
  ShieldCheckIcon,
} from '../victron/victron-icons';

export function ClientAccess() {
  const wallet = useConnectedWallet();
  return (
    <ClientAccessForWallet
      key={wallet?.address ?? 'disconnected'}
      wallet={wallet}
    />
  );
}

function ClientAccessForWallet({ wallet }: { wallet: ConnectedWallet | null }) {
  const { connection } = useConnection();
  const { setVisible: openWalletModal } = useWalletModal();
  const { session, login, logout, error } = useClientSession(wallet);
  const {
    activePosition,
    hasActiveCollateral,
    accruedMsol,
    simulateEnergyUsage,
    payEnergyBill,
    resetDemo,
    onChainMsolBalance,
    liveApy,
  } = useClientCollateral(wallet?.address);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPayingBill, setIsPayingBill] = useState(false);
  const [billPaySuccessSig, setBillPaySuccessSig] = useState<string | null>(
    null,
  );
  const [billPayError, setBillPayError] = useState<string | null>(null);

  // Metered energy calculations
  const energyDue = activePosition
    ? Math.max(
        0,
        activePosition.kwhConsumed * activePosition.tariffKwhUsd -
          activePosition.paidUsd,
      )
    : 0;

  const handlePayEnergyBill = async (amountUsd: number) => {
    if (
      !wallet &&
      typeof window !== 'undefined' &&
      !(window as unknown as { solana?: unknown }).solana
    ) {
      openWalletModal(true);
      return;
    }

    setIsPayingBill(true);
    setBillPayError(null);
    setBillPaySuccessSig(null);

    try {
      const approval = await requestWalletApproval({
        connection,
        wallet,
        actionName: 'pay_metered_energy_invoice',
        memoPayload: {
          asset: activePosition?.treeTitle || 'Clean Energy Facility',
          kwh_consumed: activePosition?.kwhConsumed,
          amount_eurtree: amountUsd,
          tariff_kwh_usd: activePosition?.tariffKwhUsd,
          protocol: 'treetino_metered_billing',
        },
      });

      payEnergyBill(amountUsd);
      setBillPaySuccessSig(approval.signature);
      setTimeout(() => {
        setBillPaySuccessSig(null);
      }, 6000);
    } catch (err: unknown) {
      console.warn('Bill pay cancelled or failed:', err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('cancelled') || msg.includes('rejected')) {
        setBillPayError('Payment was cancelled in wallet.');
      } else {
        setBillPayError(`Payment failed: ${msg}`);
      }
      setTimeout(() => setBillPayError(null), 4000);
    } finally {
      setIsPayingBill(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* 1. SECTION: ZERO-CAPEX COMMERCIAL HOST & COLLATERAL STAKING */}
      <section
        aria-label="Zero-CAPEX Host Agreement"
        className="rounded-[32px] border border-zinc-200/90 bg-white p-6 sm:p-10 shadow-[0_4px_25px_rgba(0,0,0,0.03)]"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-zinc-100">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-200/80 px-3 py-1 font-mono text-xs font-bold text-[#183d89]">
              <span className="h-2 w-2 rounded-full bg-[#183d89] animate-pulse" />
              <span>ZERO-CAPEX COMMERCIAL HOST AGREEMENT</span>
            </div>
            <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950">
              {hasActiveCollateral
                ? 'Host Collateral & Marinade Staking Dashboard'
                : 'Host Clean Energy Infrastructure at €0 Upfront CAPEX'}
            </h1>
            <p className="mt-1 text-sm text-zinc-500 max-w-2xl">
              {hasActiveCollateral
                ? 'Your 100 SOL collateral is escrowed on Solana Devnet and automatically earning 7.82% APY in Marinade mSOL while you pay only for metered kilowatt-hours.'
                : 'Commercial off-takers and facility hosts get clean energy hardware (Biomimetic Energy Trees, 8.6 MW Grid Batteries, or EV Fast-Charging Plazas) installed at zero upfront cost. You post 100 SOL collateral—automatically staked into Marinade mSOL at 7.82% APY—and pay only for the energy you consume.'}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {!hasActiveCollateral ? (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="h-12 px-6 rounded-2xl bg-gradient-to-r from-[#183d89] via-[#2052b0] to-[#2563eb] text-sm sm:text-base font-semibold text-white shadow-md shadow-blue-900/20 hover:from-[#1d4bb5] hover:to-[#3b82f6] active:scale-95 transition-all cursor-pointer flex items-center gap-2"
              >
                <span>Post 100 SOL Collateral →</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={resetDemo}
                className="h-10 px-4 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-xs font-semibold text-zinc-600 transition cursor-pointer"
              >
                Reset Demo
              </button>
            )}
          </div>
        </div>

        {/* HOST COLLATERAL STATE 1: ACTIVE COLLATERAL DASHBOARD */}
        {hasActiveCollateral && activePosition ? (
          <div className="mt-6 space-y-6">
            {/* Status Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-blue-50/80 border border-blue-200/90 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#183d89] text-white shadow-xs">
                  <CheckIcon className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-zinc-950 block">
                      Escrow Active & Hardware Approved
                    </span>
                    {!activePosition.isSimulated ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 border border-emerald-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                        ON-CHAIN VERIFIED
                      </span>
                    ) : (
                      <span className="rounded-full bg-zinc-200 text-zinc-700 text-[10px] font-semibold px-2 py-0.5">
                        Simulation Mode
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-zinc-600">
                    {activePosition.treeTitle} · €0 Upfront Hardware CAPEX
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {activePosition.txSignature &&
                  !activePosition.txSignature.startsWith('sim_') &&
                  !activePosition.txSignature.startsWith('devnet_sim') && (
                    <a
                      href={`https://solscan.io/tx/${activePosition.txSignature}?cluster=devnet`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-xs font-semibold text-[#183d89] hover:underline inline-flex items-center gap-1"
                    >
                      <span>
                        Solscan: {activePosition.txSignature.slice(0, 6)}…
                      </span>
                      <ExternalLinkIcon className="h-3 w-3" />
                    </a>
                  )}
                <div className="font-mono text-xs font-semibold text-[#183d89]">
                  Marinade Devnet Staking
                </div>
              </div>
            </div>

            {/* 4 Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Locked Collateral */}
              <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/60 p-4">
                <span className="text-[11px] font-medium text-zinc-500 block uppercase tracking-wider">
                  Locked Collateral
                </span>
                <div className="mt-1 font-mono text-2xl font-bold text-zinc-950">
                  {activePosition.solAmount}{' '}
                  <span className="text-xs font-normal text-zinc-500 font-sans">
                    SOL
                  </span>
                </div>
                <span className="mt-1 text-[11px] text-[#183d89] font-medium block">
                  100% Free Hardware Installation
                </span>
              </div>

              {/* Card 2: Marinade mSOL Receipt */}
              <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/60 p-4">
                <span className="text-[11px] font-medium text-zinc-500 block uppercase tracking-wider">
                  Liquid Staking Receipt
                </span>
                <div className="mt-1 font-mono text-2xl font-bold text-[#183d89]">
                  {activePosition.msolAmount}{' '}
                  <span className="text-xs font-normal text-zinc-500 font-sans">
                    mSOL
                  </span>
                </div>
                <span className="mt-1 text-[11px] text-zinc-500 block">
                  {onChainMsolBalance !== null && onChainMsolBalance > 0
                    ? `Live on-chain: ${onChainMsolBalance} mSOL`
                    : 'Via Marinade Protocol'}
                </span>
              </div>

              {/* Card 3: Marinade Native APY */}
              <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/60 p-4">
                <span className="text-[11px] font-medium text-zinc-500 block uppercase tracking-wider">
                  Marinade Staking APY
                </span>
                <div className="mt-1 font-mono text-2xl font-bold text-[#183d89]">
                  +{((activePosition.marinadeApy || liveApy) * 100).toFixed(2)}%
                </div>
                <span className="mt-1 text-[11px] text-zinc-500 block">
                  ~
                  {(
                    activePosition.solAmount *
                    (activePosition.marinadeApy || liveApy)
                  ).toFixed(2)}{' '}
                  SOL/yr earned by host
                </span>
              </div>

              {/* Card 4: Real-time Accrued mSOL */}
              <div className="rounded-2xl border border-blue-200/80 bg-blue-50/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-[#183d89] uppercase tracking-wider">
                    Accrued Yield
                  </span>
                  <span className="h-2 w-2 rounded-full bg-[#183d89] animate-pulse" />
                </div>
                <div className="mt-1 font-mono text-2xl font-bold text-zinc-950">
                  +{accruedMsol.toFixed(6)}{' '}
                  <span className="text-xs font-normal text-zinc-500 font-sans">
                    mSOL
                  </span>
                </div>
                <span className="mt-1 text-[11px] text-[#183d89] block">
                  Continuous epoch streaming
                </span>
              </div>
            </div>

            {/* Metered Energy Invoicing (The Pay-Only-For-Energy Engine) */}
            <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-100">
                <div>
                  <h3 className="font-bold text-base text-zinc-950">
                    Metered Energy Consumption & Invoicing
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Telemetric readings from Victron Cerbo GX. You pay only for
                    the clean energy you use at a fixed discounted rate.
                  </p>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="rounded-lg bg-zinc-100 px-2.5 py-1 text-zinc-700">
                    Tariff: €{activePosition.tariffKwhUsd}/kWh
                  </span>
                  <span className="rounded-lg bg-blue-50 text-[#183d89] border border-blue-100 px-2.5 py-1 font-bold">
                    Capex: €0.00 Free
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4">
                <div>
                  <span className="text-xs text-zinc-500">
                    Metered Clean Power:
                  </span>
                  <div className="font-mono text-xl font-bold text-zinc-900">
                    {activePosition.kwhConsumed.toFixed(1)} kWh
                  </div>
                </div>
                <div>
                  <span className="text-xs text-zinc-500">
                    Total Settled to Date:
                  </span>
                  <div className="font-mono text-xl font-bold text-zinc-900">
                    €{activePosition.paidUsd.toFixed(2)} EURTree
                  </div>
                </div>
                <div>
                  <span className="text-xs text-zinc-500">
                    Current Power Bill Due:
                  </span>
                  <div className="font-mono text-xl font-bold text-[#183d89]">
                    €{energyDue.toFixed(2)} EURTree
                  </div>
                </div>
              </div>

              {/* Action Buttons for Energy Invoicing */}
              <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => simulateEnergyUsage(25.4)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 transition cursor-pointer shadow-2xs"
                >
                  Simulate Meter Usage (+25.4 kWh)
                </button>
                {energyDue > 0 && (
                  <button
                    type="button"
                    disabled={isPayingBill}
                    onClick={() => handlePayEnergyBill(energyDue)}
                    className="px-4 py-2 rounded-xl bg-[#183d89] hover:bg-[#1f4da7] text-xs font-semibold text-white transition cursor-pointer shadow-xs disabled:opacity-60 flex items-center gap-1.5"
                  >
                    {isPayingBill && (
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    )}
                    <span>
                      {isPayingBill
                        ? 'Signing in Phantom…'
                        : `Pay Energy Bill (€${energyDue.toFixed(2)} EURTree)`}
                    </span>
                  </button>
                )}
                {activePosition.txSignature && (
                  <a
                    href={`https://solscan.io/tx/${activePosition.txSignature}?cluster=devnet`}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-auto inline-flex items-center gap-1 text-xs text-[#183d89] hover:underline"
                  >
                    <span>View Escrow on Solscan</span>
                    <ExternalLinkIcon className="h-3 w-3" />
                  </a>
                )}
              </div>

              {billPaySuccessSig && (
                <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-mono text-emerald-800">
                  <span>✓ Energy bill settled on Solana Devnet</span>
                  <a
                    href={`https://solscan.io/tx/${billPaySuccessSig}?cluster=devnet`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[#183d89] font-bold hover:underline"
                  >
                    <span>Solscan: {billPaySuccessSig.slice(0, 8)}…</span>
                    <ExternalLinkIcon className="h-3 w-3" />
                  </a>
                </div>
              )}

              {billPayError && (
                <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-800">
                  {billPayError}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* HOST COLLATERAL STATE 2: ZERO-CAPEX AGREEMENT PROPOSITION */
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Value Prop 1 */}
            <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-5 space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#183d89] shadow-2xs">
                <HardwareNodeIcon className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-zinc-950 text-base">
                100% Free Hardware
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Operating clean energy infrastructure—engineered by Cleevio with
                integrated Victron Cerbo GX edge SCADA telemetry. Zero upfront
                equipment or installation CAPEX.
              </p>
              <div className="pt-2">
                <span className="font-mono text-xs font-bold text-[#183d89]">
                  Upfront Cost: €0.00
                </span>
              </div>
            </div>

            {/* Value Prop 2 */}
            <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-5 space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#183d89] shadow-2xs">
                <BoltIcon className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-zinc-950 text-base">
                Pay Only For Energy
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                15-year corporate Power Purchase Agreement (PPA). You only pay
                for the kilowatt-hours generated on your site at a fixed
                €0.24/kWh tariff.
              </p>
              <div className="pt-2">
                <span className="font-mono text-xs font-bold text-zinc-800">
                  Save ~35% vs grid peak rates
                </span>
              </div>
            </div>

            {/* Value Prop 3 */}
            <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-5 space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#183d89] shadow-2xs">
                <ShieldCheckIcon className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-zinc-950 text-base">
                100 SOL Staked in Marinade
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Your 100 SOL collateral is automatically converted into liquid
                mSOL via Marinade Finance, earning +7.82% APY native yield while
                securing the installation.
              </p>
              <div className="pt-2">
                <span className="font-mono text-xs font-bold text-[#183d89]">
                  Earns ~7.80 SOL/yr for host
                </span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 2. SECTION: CLIENT TREES & INVOICES (Backend Indexer & Anchor Payment) */}
      <section
        aria-label="Client access"
        className="rounded-[32px] border border-zinc-200/90 bg-white p-6 sm:p-10 shadow-[0_4px_25px_rgba(0,0,0,0.03)]"
      >
        <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#183d89]">
          ON-CHAIN BILLING WORKSPACE
        </p>
        <h2 className="mt-1 mb-3 text-2xl font-black text-zinc-950">
          {session
            ? 'Your Operating Assets & Reports'
            : 'Host Invoices & Settlement'}
        </h2>
        <ErrorMessage error={error} />
        {session && wallet ? (
          <>
            <p className="mb-4 text-sm text-zinc-600 break-all font-mono">
              Signed in as:{' '}
              <span className="font-semibold text-zinc-900">
                {session.client.wallet}
              </span>
            </p>
            <Button
              variant="secondary"
              className="mb-5 cursor-pointer"
              onClick={logout}
            >
              Sign out as client
            </Button>
            <ClientWorkspace session={session} wallet={wallet} />
          </>
        ) : (
          <>
            <p className="mb-5 text-sm text-zinc-600 max-w-xl">
              Sign a message with your client wallet to view all on-chain
              assets, read 15-minute telemetry intervals, and settle official
              energy invoices with EURTree (€).
            </p>
            <Button
              disabled={login.isPending}
              onClick={() => (wallet ? login.mutate() : openWalletModal(true))}
              className="cursor-pointer"
            >
              {!wallet
                ? 'Connect client wallet'
                : login.isPending
                  ? 'Confirm message in wallet…'
                  : 'Sign in as client'}
            </Button>
          </>
        )}
      </section>

      {/* 3. UNIVERSAL POPUP: BUYER COLLATERAL MODAL */}
      <BuyerCollateralModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        assetTitle="Clean Energy Infrastructure (BESS, Solar Tree, or EV Plaza)"
        assetCategory="15-Year Commercial PPA"
        treeId="1"
      />
    </div>
  );
}
