import { useState } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useEnrichedCampaigns } from '../victron/use-enriched-campaigns';
import { useVictronInvestments } from '../victron/use-victron-investments';
import { useConnectedWallet } from '../wallet/use-connected-wallet';
import { useUsdc } from '../marketplace/hooks/use-mock-usdc';
import { formatTokenAmount } from '../../chain/amounts';
import { requestWalletApproval } from '../../chain/wallet-action';
import { getCampaignCoverImage } from '../victron/campaign-helpers';
import type { VictronDemoItem } from '../victron/victron-types';
export function InvestorPortfolio({
  onSelectAsset,
  onExplore,
  onOpenDeposit,
  onBackProject,
}: {
  onSelectAsset?: (siteId: number) => void;
  onExplore?: () => void;
  onOpenDeposit?: () => void;
  onBackProject?: (demo: VictronDemoItem) => void;
}) {
  const wallet = useConnectedWallet(),
    { connection } = useConnection(),
    { setVisible } = useWalletModal(),
    balance = useUsdc(wallet?.address);
  const { investments, receipts, claimYield, totals, error, isPending } =
      useVictronInvestments(wallet?.address),
    { demos } = useEnrichedCampaigns();
  const [busy, setBusy] = useState<number | 'all' | null>(null),
    [message, setMessage] = useState('');
  const held = demos.filter(
    (d) =>
      (investments[d.siteId]?.amountUsdc ?? 0) > 0 ||
      (investments[d.siteId]?.earnedUsdc ?? 0) > 0,
  );
  const claim = async (siteId?: number) => {
    if (!wallet) {
      setVisible(true);
      return;
    }
    setBusy(siteId ?? 'all');
    setMessage('');
    try {
      const targets = held.filter(
        (d) =>
          (investments[d.siteId]?.claimableUsdc ?? 0) > 0 &&
          (siteId === undefined || d.siteId === siteId),
      );
      if (!targets.length)
        throw new Error('No paid device revenue is available to claim.');
      const approval = await requestWalletApproval({
        connection,
        wallet,
        actionName: 'demo_device_revenue_claim',
        memoPayload: {
          simulated: true,
          site_ids: targets.map((d) => d.siteId),
        },
      });
      let paid = 0;
      for (const d of targets) {
        const result = await claimYield(d.siteId, approval.signature);
        paid += result.amountUsdc;
      }
      setMessage(
        `Claimed ${paid.toFixed(6)} demo USDC. Your demo wallet has been credited.`,
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Claim could not be saved.');
    } finally {
      setBusy(null);
    }
  };
  return (
    <section
      aria-label="Investor Portfolio"
      className="space-y-8 py-8 animate-fade-in"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-800">
            Device revenue · Demo portfolio
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            My Energy Infrastructure Portfolio
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-zinc-500">
            Your investments and earnings stay saved across browsers and
            devices. Yield is credited when someone pays to use a device.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <span className="rounded-xl border bg-white px-4 py-3 text-sm">
            Demo balance: {formatTokenAmount(balance.data?.balance)} USDC
          </span>
          <button
            onClick={onOpenDeposit}
            className="rounded-xl bg-blue-900 px-4 py-3 text-sm font-semibold text-white"
          >
            Add test funds
          </button>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Total Capital Backed', totals.investedUsdc],
          ['Earned from device payments', totals.earnedUsdc],
          ['Available to claim', totals.claimableUsdc],
          ['Total claimed', totals.claimedUsdc],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-zinc-200 bg-white p-5"
          >
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              {label}
            </p>
            <p className="mt-3 font-mono text-2xl font-bold">
              USDC{' '}
              {Number(value).toLocaleString(undefined, {
                maximumFractionDigits: 6,
              })}
            </p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">
          Hardware Tokens &amp; Allocations ({held.length})
        </h2>
        <button
          disabled={busy !== null || totals.claimableUsdc <= 0}
          onClick={() => void claim()}
          className="rounded-xl bg-blue-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-40"
        >
          {busy === 'all' ? 'Saving claim…' : 'Claim all paid revenue'}
        </button>
      </div>
      {message && (
        <p
          role="status"
          className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900"
        >
          {message}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-4 text-sm text-red-900"
        >
          {error.message}
        </p>
      )}
      {!wallet && (
        <div className="rounded-2xl border bg-white p-8 text-center">
          <h2 className="text-xl font-semibold">
            Connect your wallet to view your investments
          </h2>
          <button
            onClick={() => setVisible(true)}
            className="mt-4 rounded-xl bg-blue-900 px-5 py-3 text-white"
          >
            Connect Wallet
          </button>
        </div>
      )}
      {wallet && isPending && <p>Loading your portfolio…</p>}
      <div className="grid gap-5 lg:grid-cols-2">
        {held.map((d) => {
          const h = investments[d.siteId]!;
          return (
            <article
              key={d.siteId}
              className="overflow-hidden rounded-2xl border border-zinc-200 bg-white"
            >
              <img
                src={getCampaignCoverImage(d.key)}
                alt=""
                className="h-36 w-full object-cover"
              />
              <div className="space-y-5 p-5">
                <div>
                  <p className="text-xs uppercase tracking-wide text-blue-800">
                    {d.categoryBadge}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold">{d.title}</h3>
                  <p className="text-xs text-zinc-500">
                    {d.location.city}, {d.location.country}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-zinc-500">Your allocation</p>
                    <p className="mt-1 font-mono font-bold">
                      {h.amountUsdc.toLocaleString()} USDC
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Share of contributions</p>
                    <p className="mt-1 font-mono font-bold">
                      {h.poolSharePercent}%
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Paid revenue earned</p>
                    <p className="mt-1 font-mono font-bold">
                      {(h.earnedUsdc ?? 0).toFixed(6)} USDC
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Available to claim</p>
                    <p className="mt-1 font-mono font-bold text-emerald-700">
                      {(h.claimableUsdc ?? 0).toFixed(6)} USDC
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    disabled={busy !== null || (h.claimableUsdc ?? 0) <= 0}
                    onClick={() => void claim(d.siteId)}
                    className="rounded-xl bg-blue-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                  >
                    {busy === d.siteId ? 'Saving…' : 'Claim Yield'}
                  </button>
                  <button
                    onClick={() => onSelectAsset?.(d.siteId)}
                    className="rounded-xl border px-4 py-2 text-sm"
                  >
                    View device
                  </button>
                  <button
                    onClick={() => onBackProject?.(d)}
                    className="rounded-xl border px-4 py-2 text-sm"
                  >
                    Invest more
                  </button>
                  {d.key === 'ev' && (
                    <a
                      href={`#charge/${d.siteId}`}
                      className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-900"
                    >
                      Open EV payment screen →
                    </a>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {wallet && !isPending && !held.length && (
        <div className="rounded-2xl border bg-white p-8 text-center">
          <h2 className="text-xl font-semibold">No Active Allocations Yet</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Back a device to receive its future usage payments.
          </p>
          <button
            onClick={onExplore}
            className="mt-4 rounded-xl bg-blue-900 px-5 py-3 text-white"
          >
            Explore devices
          </button>
        </div>
      )}
      <div className="rounded-2xl border bg-white p-5">
        <h2 className="text-lg font-semibold">Device payment history</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Payments are split using the contributors recorded when a charging
          session starts. Later investments do not receive earlier revenue.
        </p>
        {receipts.length ? (
          <div className="mt-4 space-y-3">
            {receipts
              .slice()
              .reverse()
              .map((r) => (
                <div
                  key={r.id}
                  className="flex flex-wrap justify-between gap-2 border-t pt-3 text-sm"
                >
                  <div>
                    <p className="font-medium">
                      {demos.find((d) => d.siteId === r.siteId)?.title ??
                        `Device #${r.siteId}`}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {new Date(r.createdAt).toLocaleString()} ·{' '}
                      {r.claimId ? 'Claimed' : 'Available'}
                    </p>
                  </div>
                  <p className="font-mono font-semibold">
                    +{r.amountUsdc.toFixed(6)} USDC
                  </p>
                </div>
              ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-zinc-500">
            No device payments have been credited yet.
          </p>
        )}
      </div>
      <p className="text-center text-xs text-zinc-400">
        Demo only · Balances, payments and payouts are simulated and persisted
        in your account. Projected APY is not credited as earned yield.
      </p>
    </section>
  );
}
