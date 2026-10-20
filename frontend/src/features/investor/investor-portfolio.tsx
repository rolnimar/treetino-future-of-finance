import { useEffect, useRef, useState } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useEnrichedCampaigns } from '../victron/use-enriched-campaigns';
import { useVictronInvestments } from '../victron/use-victron-investments';
import { useConnectedWallet } from '../wallet/use-connected-wallet';
import { setActivePersona } from '../wallet/demo-personas';
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
    [message, setMessage] = useState(''),
    [liveJumpDelta, setLiveJumpDelta] = useState<number | null>(null);

  const prevEarnedRef = useRef<number | null>(null);

  useEffect(() => {
    const currentEarned = totals.earnedUsdc;
    if (
      prevEarnedRef.current !== null &&
      currentEarned > prevEarnedRef.current + 0.000001
    ) {
      const delta = currentEarned - prevEarnedRef.current;
      const showTimer = window.setTimeout(() => {
        setLiveJumpDelta(delta);
      }, 0);
      const clearTimer = window.setTimeout(() => {
        setLiveJumpDelta(null);
      }, 15_000);
      prevEarnedRef.current = currentEarned;
      return () => {
        window.clearTimeout(showTimer);
        window.clearTimeout(clearTimer);
      };
    }
    prevEarnedRef.current = currentEarned;
    return undefined;
  }, [totals.earnedUsdc]);

  const latestReceipt = receipts.length ? receipts[receipts.length - 1] : null;
  const latestDevice = latestReceipt
    ? demos.find((d) => d.siteId === latestReceipt.siteId)
    : undefined;

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
            devices. Yield is credited immediately when someone pays to use a
            device.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a
            href="#charge/374891"
            className="inline-flex items-center gap-2 rounded-xl border-2 border-emerald-600 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-950 shadow-sm transition hover:bg-emerald-100"
          >
            ⚡ Open EV Charging Outlet (#374891)
          </a>
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

      {/* LIVE EV CHARGING REVENUE PAYOUT ALERT */}
      {(liveJumpDelta !== null || latestReceipt) && (
        <div
          role="status"
          data-testid="live-yield-jump-banner"
          className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 border-emerald-500 bg-gradient-to-r from-emerald-950 via-zinc-900 to-emerald-950 p-5 text-white shadow-[0_0_35px_rgba(16,185,129,0.25)]"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 font-mono text-2xl font-black text-zinc-950">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                  ● LIVE DEVICE PAYOUT STREAMED
                </span>
                <span className="font-mono text-xs text-zinc-400">
                  {latestReceipt
                    ? new Date(latestReceipt.createdAt).toLocaleTimeString()
                    : 'Just now'}
                </span>
              </div>
              <p className="mt-1 text-lg font-bold">
                +{(liveJumpDelta ?? latestReceipt?.amountUsdc ?? 0).toFixed(6)}{' '}
                USDC instant yield credited from{' '}
                {latestDevice?.title ?? 'Solar EV Fast-Charging Hub'}
              </p>
              <p className="text-xs text-zinc-300">
                Settled automatically from EV charging terminal card payment ·
                Proportional to your pool share
              </p>
            </div>
          </div>
          <div className="text-right font-mono">
            <p className="text-[11px] uppercase tracking-wider text-emerald-300">
              Available Yield Now
            </p>
            <p
              data-testid="portfolio-claimable-highlight"
              className="text-2xl font-black text-emerald-400"
            >
              +{totals.claimableUsdc.toFixed(6)} USDC
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: 'Total Capital Backed',
            value: totals.investedUsdc,
            highlight: false,
            testId: 'kpi-invested',
          },
          {
            label: 'Earned from device payments',
            value: totals.earnedUsdc,
            highlight: totals.earnedUsdc > 0,
            testId: 'kpi-earned',
          },
          {
            label: 'Available to claim',
            value: totals.claimableUsdc,
            highlight: totals.claimableUsdc > 0,
            testId: 'kpi-claimable',
          },
          {
            label: 'Total claimed',
            value: totals.claimedUsdc,
            highlight: false,
            testId: 'kpi-claimed',
          },
        ].map((item) => (
          <div
            key={item.label}
            data-testid={item.testId}
            className={`rounded-2xl border p-5 transition-all ${
              item.highlight
                ? 'border-emerald-500 bg-emerald-50/70 shadow-[0_0_25px_rgba(16,185,129,0.15)]'
                : 'border-zinc-200 bg-white'
            }`}
          >
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              {item.label}
            </p>
            <p
              className={`mt-3 font-mono text-2xl font-bold ${
                item.highlight ? 'text-emerald-800' : 'text-zinc-950'
              }`}
            >
              USDC{' '}
              {Number(item.value).toLocaleString(undefined, {
                minimumFractionDigits: item.highlight ? 2 : 0,
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
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setVisible(true)}
              className="rounded-xl bg-blue-900 px-5 py-3 text-white"
            >
              Connect Wallet
            </button>
            <button
              type="button"
              data-testid="demo-login-alice-btn"
              onClick={() => setActivePersona('investor-alice')}
              className="rounded-xl border border-emerald-600 bg-emerald-50 px-5 py-3 font-semibold text-emerald-900 hover:bg-emerald-100"
            >
              ⚡ Demo Mode: Sign in as Investor Alice
            </button>
          </div>
        </div>
      )}

      {wallet && isPending && <p>Loading your portfolio…</p>}

      <div className="grid gap-5 lg:grid-cols-2">
        {held.map((d) => {
          const h = investments[d.siteId]!;
          const hasEarned = (h.earnedUsdc ?? 0) > 0;
          return (
            <article
              key={d.siteId}
              className={`overflow-hidden rounded-2xl border bg-white transition-all ${
                hasEarned
                  ? 'border-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.12)]'
                  : 'border-zinc-200'
              }`}
            >
              <img
                src={getCampaignCoverImage(d.key)}
                alt=""
                className="h-36 w-full object-cover"
              />
              <div className="space-y-5 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-blue-800">
                      {d.categoryBadge}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold">{d.title}</h3>
                    <p className="text-xs text-zinc-500">
                      {d.location.city}, {d.location.country}
                    </p>
                  </div>
                  {hasEarned && (
                    <span className="rounded-full bg-emerald-100 px-3 py-1 font-mono text-xs font-bold text-emerald-800">
                      ⚡ +{(h.earnedUsdc ?? 0).toFixed(4)} USDC YIELD
                    </span>
                  )}
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
                    <p
                      data-testid={`asset-earned-${d.siteId}`}
                      className="mt-1 font-mono font-bold text-emerald-700"
                    >
                      {(h.earnedUsdc ?? 0).toFixed(6)} USDC
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Available to claim</p>
                    <p
                      data-testid={`asset-claimable-${d.siteId}`}
                      className="mt-1 font-mono font-bold text-emerald-700"
                    >
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
                      className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-900"
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
          Payments are split across active contributors when an EV charging
          session is settled.
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
                  <p className="font-mono font-semibold text-emerald-700">
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
