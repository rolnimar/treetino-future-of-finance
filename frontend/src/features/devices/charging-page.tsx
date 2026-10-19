import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useConnection } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useConnectedWallet } from '../wallet/use-connected-wallet';
import { useEnrichedCampaigns } from '../victron/use-enriched-campaigns';
import { useUsdc } from '../marketplace/hooks/use-mock-usdc';
import { formatTokenAmount } from '../../chain/amounts';
import { requestWalletApproval } from '../../chain/wallet-action';
import { api } from '../../lib/api';
import { chargingSessionSchema, demoPost } from './device-api';
export function ChargingPage({ siteId }: { siteId: number }) {
  const wallet = useConnectedWallet(),
    { connection } = useConnection(),
    { setVisible } = useWalletModal(),
    client = useQueryClient();
  const { demos, error: deviceError } = useEnrichedCampaigns(),
    device = demos.find((d) => d.siteId === siteId),
    balance = useUsdc(wallet?.address);
  const [kwh, setKwh] = useState('10'),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    nextId = useRef(crypto.randomUUID());
  const key = ['charging-session', siteId, wallet?.address];
  const session = useQuery({
    queryKey: key,
    queryFn: ({ signal }) =>
      api(
        `devices/${siteId}/sessions?wallet=${wallet!.address}`,
        chargingSessionSchema.nullable(),
        { signal },
      ),
    enabled: !!wallet,
    refetchInterval: 1000,
  });
  const current = session.data;
  const action = async (type: 'start' | 'stop' | 'pay' | 'cancel') => {
    if (!wallet) {
      setVisible(true);
      return;
    }
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      let reference: string | undefined;
      if (type === 'pay') {
        const approval = await requestWalletApproval({
          connection,
          wallet,
          actionName: 'demo_ev_charging_payment',
          memoPayload: { simulated: true, session_id: current?.id },
        });
        reference = approval.signature;
      }
      const path =
        type === 'start'
          ? `devices/${siteId}/sessions`
          : `device-sessions/${current!.id}/${type}`;
      const result = await demoPost(
        wallet,
        path,
        chargingSessionSchema,
        type === 'start'
          ? { id: nextId.current, kwh }
          : { memoReference: reference },
      );
      client.setQueryData(key, result);
      if (type === 'start') nextId.current = crypto.randomUUID();
      await Promise.all([
        client.invalidateQueries({ queryKey: ['device-portfolio'] }),
        client.invalidateQueries({ queryKey: ['device-catalog'] }),
        client.invalidateQueries({ queryKey: ['wallet', 'usdc'] }),
      ]);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Could not save this charging action.',
      );
    } finally {
      setBusy(false);
    }
  };
  const fresh = !current || current.status === 'cancelled',
    paid = current?.status === 'paid';
  return (
    <main className="min-h-screen bg-[#f4f6fa] px-4 py-6 text-zinc-950 sm:py-12">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <a
            href={`#asset/${siteId}`}
            className="text-sm font-semibold text-blue-900"
          >
            ← Device details
          </a>
          <button
            onClick={() => setVisible(true)}
            className="max-w-48 truncate rounded-full border bg-white px-4 py-2 text-xs font-semibold"
          >
            {wallet
              ? `${wallet.address.slice(0, 5)}…${wallet.address.slice(-5)}`
              : 'Connect Wallet'}
          </button>
        </div>
        <section className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm">
          <div className="bg-[#122d65] p-7 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">
              Treetino Charge · Demo station
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">
              {device?.title ?? 'EV charging station'}
            </h1>
            <p className="mt-2 text-sm text-blue-100">
              {device
                ? `${device.location.city}, ${device.location.country} · Station #${siteId}`
                : 'Loading station…'}
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-xs">
              <span className="rounded-full border border-blue-400/40 bg-white/10 px-3 py-1.5">
                Type 2 · {device?.usage?.powerKw ?? 11} kW
              </span>
              <span className="rounded-full border border-blue-400/40 bg-white/10 px-3 py-1.5">
                USDC payments
              </span>
              <span className="rounded-full bg-emerald-400/15 px-3 py-1.5 text-emerald-200">
                {current?.status === 'charging' ? 'Charging' : 'Station ready'}
              </span>
            </div>
          </div>
          <div className="space-y-6 p-6 sm:p-8">
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-xs leading-relaxed text-blue-900">
              Demo mode · The meter runs at 120× speed. Payments use demo USDC
              and share revenue with this device’s contributors. No real money
              is charged.
            </div>
            {(error || deviceError || session.error) && (
              <p
                role="alert"
                className="rounded-xl bg-red-50 p-3 text-sm text-red-800"
              >
                {error || deviceError?.message || session.error?.message}
              </p>
            )}
            {device && device.key !== 'ev' ? (
              <p>This device is not an EV charging station.</p>
            ) : fresh ? (
              <>
                <div>
                  <h2 className="text-xl font-semibold">
                    Plug in. Charge. Pay.
                  </h2>
                  <p className="mt-2 text-sm text-zinc-500">
                    Choose how much energy to add, then start your demo charging
                    session.
                  </p>
                </div>
                <label
                  className="block text-xs font-semibold text-zinc-600"
                  htmlFor="charge-target-kwh"
                >
                  Energy to add (kWh)
                </label>
                <input
                  id="charge-target-kwh"
                  type="number"
                  min="0.001"
                  max="200"
                  step="0.001"
                  value={kwh}
                  onChange={(e) => setKwh(e.target.value)}
                  disabled={busy}
                  className="w-full rounded-xl border px-4 py-3 text-2xl font-bold"
                />
                <div className="grid grid-cols-2 gap-3">
                  {['5', '10', '25', '50'].map((v) => (
                    <button
                      key={v}
                      disabled={busy}
                      onClick={() => setKwh(v)}
                      className="rounded-xl border py-2 text-sm"
                    >
                      {v} kWh
                    </button>
                  ))}
                </div>
                <div className="space-y-2 border-y py-4 text-sm">
                  <p className="flex justify-between">
                    <span>Energy tariff</span>
                    <strong>
                      {device?.usage?.tariffUsdcPerKwh.toFixed(2) ?? '…'} USDC /
                      kWh
                    </strong>
                  </p>
                  <p className="flex justify-between">
                    <span>Connection fee</span>
                    <strong>
                      {device?.usage?.connectionFeeUsdc.toFixed(2) ?? '…'} USDC
                    </strong>
                  </p>
                  <p className="flex justify-between">
                    <span>Your demo balance</span>
                    <strong>
                      {formatTokenAmount(balance.data?.balance)} USDC
                    </strong>
                  </p>
                </div>
                <button
                  disabled={busy || !device}
                  onClick={() => void action('start')}
                  className="w-full rounded-2xl bg-blue-900 py-4 font-semibold text-white disabled:opacity-50"
                >
                  {busy
                    ? 'Starting…'
                    : wallet
                      ? 'Start charging'
                      : 'Connect Wallet to Charge'}
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">
                    {paid
                      ? 'Payment complete'
                      : current.status === 'charging'
                        ? 'Your EV is charging'
                        : 'Review your charging bill'}
                  </h2>
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold">
                    {paid
                      ? 'PAID'
                      : current.status === 'charging'
                        ? 'LIVE DEMO'
                        : 'UNPAID'}
                  </span>
                </div>
                <div className="rounded-2xl bg-zinc-50 p-6 text-center">
                  <p className="text-xs uppercase tracking-widest text-zinc-500">
                    Energy delivered
                  </p>
                  <p
                    data-testid="charge-energy"
                    className="mt-3 font-mono text-4xl font-bold"
                  >
                    {(current.deliveredWh / 1000).toFixed(3)}{' '}
                    <span className="text-lg text-zinc-400">kWh</span>
                  </p>
                  <progress
                    value={current.deliveredWh}
                    max={current.targetWh}
                    className="mt-5 h-3 w-full accent-blue-800"
                  />
                  <p className="mt-2 text-xs text-zinc-500">
                    Target: {(current.targetWh / 1000).toFixed(3)} kWh ·{' '}
                    {current.powerWatts / 1000} kW · Station meter
                  </p>
                </div>
                <div className="space-y-3 text-sm">
                  <p className="flex justify-between">
                    <span>Tariff locked for this session</span>
                    <strong>
                      {formatTokenAmount(current.tariffUnitsPerKwh)} USDC / kWh
                    </strong>
                  </p>
                  <p className="flex justify-between">
                    <span>Connection fee</span>
                    <strong>
                      {formatTokenAmount(current.connectionFeeUnits)} USDC
                    </strong>
                  </p>
                  <p className="flex justify-between border-t pt-4 text-lg">
                    <span>{paid ? 'Paid' : 'Total'}</span>
                    <strong data-testid="charge-total">
                      {current.amountUsdc.toFixed(6)} USDC
                    </strong>
                  </p>
                </div>
                {paid ? (
                  <>
                    <p
                      role="status"
                      className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900"
                    >
                      {current.contributors.length
                        ? `Revenue recorded for ${current.contributors.length} contributor${current.contributors.length === 1 ? '' : 's'}. Their portfolios have been updated.`
                        : 'Payment recorded. No contributors were present at session start, so this revenue is held unallocated by the device.'}
                    </p>
                    <p className="break-all text-xs text-zinc-400">
                      Payment reference: {current.id}
                    </p>
                    <div className="flex gap-3">
                      <a
                        href="#portfolio"
                        className="flex-1 rounded-xl bg-blue-900 p-3 text-center text-sm font-semibold text-white"
                      >
                        View contributor portfolio
                      </a>
                      <button
                        disabled={busy}
                        onClick={() => void action('start')}
                        className="flex-1 rounded-xl border p-3 text-sm font-semibold"
                      >
                        Charge again
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <button
                      disabled={busy}
                      onClick={() =>
                        void action(
                          current.status === 'charging' ? 'stop' : 'pay',
                        )
                      }
                      className="w-full rounded-2xl bg-blue-900 py-4 font-semibold text-white disabled:opacity-50"
                    >
                      {busy
                        ? 'Saving…'
                        : current.status === 'charging'
                          ? 'Stop charging & review bill'
                          : `Pay ${current.amountUsdc.toFixed(6)} demo USDC`}
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => void action('cancel')}
                      className="w-full rounded-2xl border py-3 text-sm text-zinc-600"
                    >
                      Cancel unpaid session
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </section>
        <p className="text-center text-xs leading-relaxed text-zinc-400">
          Revenue is shared with the contributors recorded when this session
          starts. Refreshing or switching browsers does not reset investments or
          earned yield.
        </p>
      </div>
    </main>
  );
}
