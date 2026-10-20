import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Keypair,
  type Connection,
  type SendOptions,
  type Transaction,
  type VersionedTransaction,
} from '@solana/web3.js';
import nacl from 'tweetnacl';
import type { ConnectedWallet } from '../../chain/wallet';
import { useEnrichedCampaigns } from '../victron/use-enriched-campaigns';
import { YIELD_CHANNEL } from '../victron/use-victron-investments';
import { APPLE_LOGO_PATH } from '../../lib/brand-marks';
import {
  chargingSessionSchema,
  demoPost,
  prewarmDemoSession,
  type ChargingSession,
} from './device-api';

const KIOSK_KEYPAIR_STORAGE_KEY = 'treetino_ev_kiosk_terminal_secret_v1';

/** Charge preset shown on the outdoor terminal: an 18% → 100% fill. */
const FULL_CHARGE_KWH = 68;
const START_SOC = 18;
const RANGE_KM = 410;
const FILL_ANIMATION_MS = 1100;
const EUR_PER_USDC = 0.92;
const CZK_PER_USDC = 23.2;

function getOrCreateKioskTerminalWallet(): ConnectedWallet {
  let keypair: Keypair;
  try {
    const saved =
      typeof window !== 'undefined'
        ? window.localStorage.getItem(KIOSK_KEYPAIR_STORAGE_KEY)
        : null;
    if (saved) {
      const bytes = Uint8Array.from(JSON.parse(saved) as number[]);
      keypair = Keypair.fromSecretKey(bytes);
    } else {
      keypair = Keypair.generate();
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(
          KIOSK_KEYPAIR_STORAGE_KEY,
          JSON.stringify(Array.from(keypair.secretKey)),
        );
      }
    }
  } catch {
    keypair = Keypair.generate();
  }

  return {
    address: keypair.publicKey.toBase58(),
    signMessage: async (message: Uint8Array): Promise<Uint8Array> =>
      nacl.sign.detached(message, keypair.secretKey),
    signTransaction: async <T extends Transaction | VersionedTransaction>(
      transaction: T,
    ): Promise<T> => {
      if ('version' in transaction) {
        (transaction as VersionedTransaction).sign([keypair]);
      } else {
        (transaction as Transaction).partialSign(keypair);
      }
      return transaction;
    },
    sendTransaction: async (
      transaction: Transaction | VersionedTransaction,
      connection: Connection,
      options?: SendOptions,
    ): Promise<string> => {
      if ('version' in transaction) {
        (transaction as VersionedTransaction).sign([keypair]);
      } else {
        (transaction as Transaction).partialSign(keypair);
      }
      return connection.sendRawTransaction(transaction.serialize(), options);
    },
  };
}

type Phase = 'idle' | 'charging' | 'authorizing' | 'paid';

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export function ChargingPage({ siteId }: { siteId: number }) {
  // The outdoor terminal is its own merchant-of-record wallet. Drivers never
  // see or connect a wallet: they only tap a card.
  const terminal = useMemo(() => getOrCreateKioskTerminalWallet(), []);
  const client = useQueryClient();
  const { demos } = useEnrichedCampaigns();
  const device = demos.find((d) => d.siteId === siteId);

  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);
  const [currency, setCurrency] = useState<'EUR' | 'CZK'>('EUR');
  const [receipt, setReceipt] = useState<{
    session: ChargingSession;
    settleMs: number;
  } | null>(null);
  const [error, setError] = useState('');
  const frame = useRef<number | null>(null);

  // Sign the terminal in while the screen is idle so the tap is instant.
  useEffect(() => {
    void prewarmDemoSession(terminal).catch(() => undefined);
  }, [terminal]);

  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    },
    [],
  );

  const tariff = device?.usage?.tariffUsdcPerKwh ?? 0.42;
  const fee = device?.usage?.connectionFeeUsdc ?? 2.5;
  const powerKw = device?.usage?.powerKw ?? 22;
  const quoteUsdc = FULL_CHARGE_KWH * tariff + fee;
  const totalUsdc = receipt?.session.amountUsdc ?? quoteUsdc;

  const money = (usdc: number) =>
    currency === 'EUR'
      ? `€${(usdc * EUR_PER_USDC).toFixed(2)}`
      : `${Math.round(usdc * CZK_PER_USDC).toLocaleString('cs-CZ')} Kč`;

  const eased = easeOutCubic(progress);
  const soc = Math.round(START_SOC + eased * (100 - START_SOC));
  const live = phase !== 'idle';
  const energyKwh = live ? eased * FULL_CHARGE_KWH : FULL_CHARGE_KWH;
  const rangeKm = live ? Math.round(eased * RANGE_KM) : RANGE_KM;
  const shownTotal = live ? eased * totalUsdc : quoteUsdc;
  const done = phase === 'paid';

  const animateFill = () =>
    new Promise<void>((resolve) => {
      const started = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - started) / FILL_ANIMATION_MS);
        setProgress(t);
        if (t < 1) frame.current = requestAnimationFrame(step);
        else {
          frame.current = null;
          resolve();
        }
      };
      frame.current = requestAnimationFrame(step);
    });

  /** start → stop at 100% → pay by card, as fast as the API allows. */
  const settleFullCharge = async () => {
    const started = performance.now();
    const startSession = () =>
      demoPost(terminal, `devices/${siteId}/sessions`, chargingSessionSchema, {
        id: crypto.randomUUID(),
        kwh: String(FULL_CHARGE_KWH),
      });
    let session = await startSession();
    // A previous unfinished session for this bay is returned instead of a new
    // one; clear it so the driver is billed exactly the quoted full charge.
    if (session.targetWh !== FULL_CHARGE_KWH * 1000) {
      await demoPost(
        terminal,
        `device-sessions/${session.id}/cancel`,
        chargingSessionSchema,
        {},
      );
      session = await startSession();
    }
    if (session.status === 'charging') {
      session = await demoPost(
        terminal,
        `device-sessions/${session.id}/stop`,
        chargingSessionSchema,
        { deliverFullTarget: true },
      );
    }
    const paid = await demoPost(
      terminal,
      `device-sessions/${session.id}/pay`,
      chargingSessionSchema,
      {
        memoReference: `contactless_visa_4242_${Date.now()}`,
        refreshContributors: true,
        paymentMethod: 'card',
      },
    );
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(YIELD_CHANNEL);
      channel.postMessage({ siteId, sessionId: paid.id });
      channel.close();
    }
    return { session: paid, settleMs: performance.now() - started };
  };

  const tapToCharge = async () => {
    if (phase !== 'idle') return;
    setError('');
    setReceipt(null);
    setProgress(0);
    setPhase('charging');
    let settled = false;
    const payment = settleFullCharge().then((result) => {
      settled = true;
      return result;
    });
    try {
      const [result] = await Promise.all([
        payment,
        animateFill().then(() => {
          if (!settled) setPhase('authorizing');
        }),
      ]);
      setReceipt(result);
      setPhase('paid');
      void client.invalidateQueries({ queryKey: ['device-portfolio'] });
      void client.invalidateQueries({ queryKey: ['device-catalog'] });
    } catch (e) {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
      setProgress(0);
      setPhase('idle');
      setError(
        e instanceof Error ? e.message : 'Card was not accepted. Tap again.',
      );
    }
  };

  const reset = () => {
    setReceipt(null);
    setProgress(0);
    setError('');
    setPhase('idle');
  };

  const toggleFullscreen = () => {
    const root = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => void;
    };
    if (document.fullscreenElement) {
      void document.exitFullscreen?.().catch(() => undefined);
    } else if (root.requestFullscreen) {
      void root.requestFullscreen().catch(() => undefined);
    } else {
      root.webkitRequestFullscreen?.();
    }
  };

  const headline =
    phase === 'idle'
      ? { top: 'Plug in. Tap.', accent: 'Drive away full.' }
      : done
        ? { top: 'You’re charged.', accent: `${money(totalUsdc)} paid.` }
        : { top: 'Charging.', accent: 'Straight from the sun.' };

  const investors = receipt?.session.contributors.length ?? 0;

  return (
    <main
      data-testid="ev-kiosk"
      className="relative flex h-[100dvh] w-full select-none flex-col overflow-hidden bg-[#09090b] text-white [touch-action:manipulation]"
    >
      {/* Ambient light, same as the pitch deck */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 45% at 100% 0%, rgba(24,61,137,0.5), transparent 70%), radial-gradient(ellipse 60% 40% at 0% 100%, rgba(24,61,137,0.22), transparent 70%)',
        }}
      />
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${done ? 'opacity-100' : 'opacity-0'}`}
        style={{
          background:
            'radial-gradient(ellipse 60% 35% at 50% 45%, rgba(52,211,153,0.16), transparent 70%)',
        }}
      />
      {/* Wireframe floor */}
      <div
        aria-hidden
        className="kiosk-floor pointer-events-none absolute inset-x-[-40%] bottom-[-6%] h-[52%]"
      />

      <div className="relative z-10 flex h-full flex-col px-[6vw] pb-[4.5vh] pt-[4vh]">
        {/* Top chrome */}
        <header className="flex items-center justify-between">
          <button
            type="button"
            onDoubleClick={toggleFullscreen}
            aria-label="Treetino (double-tap for fullscreen)"
            className="outline-none"
          >
            <img
              src="/branding/logo_horizontal.png"
              alt="Treetino"
              className="h-[clamp(18px,2.3vh,28px)] w-auto opacity-90"
            />
          </button>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2 text-[clamp(12px,1.35vh,16px)] text-white/55">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#34d399] opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#34d399]" />
              </span>
              Bay 01 · {device?.location.city ?? 'Prague'}
            </span>
            <div className="flex rounded-full border border-white/10 bg-white/[0.04] p-0.5 text-[clamp(11px,1.2vh,14px)]">
              {(['EUR', 'CZK'] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCurrency(c)}
                  className={`rounded-full px-3 py-1 transition ${currency === c ? 'bg-white/90 text-[#09090b]' : 'text-white/50'}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Headline */}
        <section className="mt-[4.5vh]">
          <p className="text-[clamp(14px,1.6vh,20px)] tracking-[-0.01em] text-white/45">
            Solar EV charging · Community-owned
          </p>
          <h1
            key={phase === 'authorizing' ? 'charging' : phase}
            className="kiosk-word-in mt-[1.2vh] text-[clamp(40px,5.6vh,76px)] font-medium leading-[1.02] tracking-[-0.045em]"
          >
            <span className="block">{headline.top}</span>
            <span
              className={`block bg-clip-text text-transparent ${
                done
                  ? 'bg-[linear-gradient(90deg,#8ec5ff,#34d399)]'
                  : 'bg-[linear-gradient(90deg,#8ec5ff,#8ec5ff)]'
              }`}
              style={{ filter: 'drop-shadow(0 0 28px rgba(77,141,255,0.45))' }}
            >
              {headline.accent}
            </span>
          </h1>
        </section>

        {/* Charge ring */}
        <section className="relative flex min-h-0 flex-1 items-center justify-center py-[2vh]">
          <ChargeRing soc={soc} done={done} active={live && !done} />
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-[clamp(12px,1.35vh,16px)] uppercase tracking-[0.28em] text-white/45">
              Battery
            </p>
            <p
              data-testid="kiosk-soc"
              className={`mt-[0.6vh] font-medium leading-none tracking-[-0.06em] tabular-nums ${done ? 'text-[#34d399]' : 'text-white'}`}
              style={{
                fontSize: 'clamp(72px, 11vh, 150px)',
                textShadow: done
                  ? '0 0 50px rgba(52,211,153,0.45)'
                  : '0 0 50px rgba(77,141,255,0.35)',
              }}
            >
              {soc}
              <span className="text-[0.38em] tracking-[-0.02em] text-white/45">
                %
              </span>
            </p>
            <p className="mt-[1vh] text-[clamp(13px,1.5vh,18px)] text-white/55">
              {done
                ? 'Full · Unplug anytime'
                : live
                  ? `Charging · ${powerKw} kW`
                  : 'Connected · Ready'}
            </p>
          </div>
        </section>

        {/* Deck-style stats */}
        <section className="grid grid-cols-3 border-t border-white/10 pt-[2vh]">
          {[
            {
              label: 'Energy',
              value: `+${energyKwh.toFixed(live && !done ? 1 : 0)}`,
              unit: 'kWh',
              testId: 'charge-energy',
            },
            { label: 'Range', value: `+${rangeKm}`, unit: 'km' },
            {
              label: done ? 'Paid' : 'Total',
              value: money(shownTotal),
              unit: '',
              testId: 'charge-total-fiat',
            },
          ].map((s) => (
            <div key={s.label} className="pr-4">
              <p className="text-[clamp(12px,1.35vh,16px)] text-white/45">
                {s.label}
              </p>
              <p
                data-testid={s.testId}
                className={`mt-[0.5vh] text-[clamp(28px,3.6vh,48px)] font-medium tracking-[-0.04em] tabular-nums ${done && s.label === 'Paid' ? 'text-[#34d399]' : 'text-white'}`}
              >
                {s.value}
                {s.unit && (
                  <span className="ml-1.5 text-[0.5em] tracking-[-0.01em] text-white/45">
                    {s.unit}
                  </span>
                )}
              </p>
            </div>
          ))}
        </section>

        {error && (
          <p
            role="alert"
            className="mt-[1.6vh] rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-2.5 text-[clamp(12px,1.35vh,16px)] text-red-200"
          >
            {error}
          </p>
        )}

        {/* Payment surface: the single interaction on this screen */}
        <section className="mt-[2.6vh]">
          {done && receipt ? (
            <div
              role="status"
              data-testid="kiosk-paid-banner"
              className="kiosk-rise-in relative overflow-hidden rounded-[28px] border border-[#34d399]/35 bg-[linear-gradient(135deg,rgba(5,150,105,0.22),rgba(255,255,255,0.02))] p-[2.4vh] shadow-[0_0_60px_rgba(52,211,153,0.15)]"
            >
              <div className="flex items-center gap-[2vh]">
                <span className="flex h-[clamp(52px,6.4vh,84px)] w-[clamp(52px,6.4vh,84px)] shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#059669,#10b981)] shadow-[0_0_40px_rgba(16,185,129,0.5)]">
                  <svg viewBox="0 0 24 24" className="h-1/2 w-1/2" fill="none">
                    <path
                      d="M5 12.5l4.2 4.2L19 7"
                      stroke="white"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="kiosk-check"
                    />
                  </svg>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[clamp(22px,2.8vh,36px)] font-medium leading-tight tracking-[-0.035em]">
                    Approved · {money(receipt.session.amountUsdc)}
                  </p>
                  <p className="mt-0.5 text-[clamp(13px,1.5vh,18px)] text-white/60">
                    Visa •••• 4242 · Receipt on your phone
                  </p>
                </div>
                <button
                  type="button"
                  data-testid="kiosk-new-session-btn"
                  onClick={reset}
                  className="shrink-0 rounded-full border border-white/15 bg-white/[0.06] px-5 py-3 text-[clamp(13px,1.45vh,17px)] text-white/80 transition active:scale-95"
                >
                  New session
                </button>
              </div>
              <div className="mt-[2vh] flex items-center justify-between gap-3 border-t border-white/10 pt-[1.6vh] text-[clamp(12px,1.35vh,16px)]">
                <span className="text-white/70">
                  <span className="text-[#34d399]">●</span> Streamed to{' '}
                  {investors} local co-owner{investors === 1 ? '' : 's'} in{' '}
                  <span className="text-white">
                    {(receipt.settleMs / 1000).toFixed(2)} s
                  </span>
                </span>
                <span className="text-white/40">
                  <span data-testid="charge-total">
                    {receipt.session.amountUsdc.toFixed(2)} USDC
                  </span>{' '}
                  · Solana
                </span>
              </div>
            </div>
          ) : (
            <button
              type="button"
              data-testid="kiosk-tap-card-pay-btn"
              disabled={phase !== 'idle'}
              onClick={() => void tapToCharge()}
              className="group relative w-full overflow-hidden rounded-[28px] border border-[#4d8dff]/35 bg-[linear-gradient(135deg,rgba(29,78,216,0.24),rgba(255,255,255,0.02)_70%)] p-[2.4vh] text-left shadow-[0_0_60px_rgba(29,78,216,0.22),inset_0_1px_0_rgba(255,255,255,0.08)] outline-none transition active:scale-[0.985]"
            >
              <span
                aria-hidden
                className="kiosk-sheen pointer-events-none absolute inset-y-0 left-0 w-1/3"
              />
              <div className="flex items-center gap-[2.2vh]">
                <ContactlessMark busy={live} />
                <div className="min-w-0 flex-1">
                  <p className="text-[clamp(24px,3vh,40px)] font-medium leading-tight tracking-[-0.04em]">
                    {phase === 'idle'
                      ? 'Tap card or phone'
                      : phase === 'authorizing'
                        ? 'Approving…'
                        : 'Card accepted'}
                  </p>
                  <p className="mt-1 text-[clamp(13px,1.5vh,18px)] text-white/60">
                    {phase === 'idle'
                      ? `Full charge ${money(quoteUsdc)} · No app, no sign-up`
                      : 'Visa •••• 4242 · Charging to 100%'}
                  </p>
                </div>
              </div>
              <div className="mt-[2vh] flex items-center gap-2 border-t border-white/10 pt-[1.6vh]">
                <PaymentMarks />
                <span className="ml-auto text-[clamp(11px,1.25vh,15px)] text-white/40">
                  {money(tariff)}/kWh + {money(fee)} start
                </span>
              </div>
            </button>
          )}
        </section>
      </div>
    </main>
  );
}

function ChargeRing({
  soc,
  done,
  active,
}: {
  soc: number;
  done: boolean;
  active: boolean;
}) {
  const r = 150;
  const circumference = 2 * Math.PI * r;
  const ticks = 120;
  const angle = (soc / 100) * 2 * Math.PI - Math.PI / 2;
  const head = { x: 200 + r * Math.cos(angle), y: 200 + r * Math.sin(angle) };
  return (
    <svg
      viewBox="0 0 400 400"
      className="aspect-square h-[min(72vw,37vh)] w-auto overflow-visible"
      aria-hidden
    >
      <defs>
        <linearGradient id="kiosk-arc" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={done ? '#34d399' : '#1d4ed8'} />
          <stop offset="55%" stopColor={done ? '#6ee7b7' : '#4d8dff'} />
          <stop offset="100%" stopColor={done ? '#8ec5ff' : '#8ec5ff'} />
        </linearGradient>
        <filter
          id="kiosk-glow"
          filterUnits="userSpaceOnUse"
          x="-40"
          y="-40"
          width="480"
          height="480"
        >
          <feGaussianBlur stdDeviation="7" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="kiosk-core" cx="50%" cy="50%" r="50%">
          <stop
            offset="0%"
            stopColor={done ? 'rgba(52,211,153,0.16)' : 'rgba(29,78,216,0.2)'}
          />
          <stop offset="100%" stopColor="rgba(9,9,11,0)" />
        </radialGradient>
      </defs>

      <circle cx="200" cy="200" r="138" fill="url(#kiosk-core)" />

      {/* Tick ring that lights up with the charge */}
      {Array.from({ length: ticks }).map((_, i) => {
        const a = (i / ticks) * 2 * Math.PI - Math.PI / 2;
        const major = i % 10 === 0;
        const inner = major ? 180 : 184;
        const lit = (i / ticks) * 100 < soc;
        return (
          <line
            key={i}
            x1={200 + inner * Math.cos(a)}
            y1={200 + inner * Math.sin(a)}
            x2={200 + 192 * Math.cos(a)}
            y2={200 + 192 * Math.sin(a)}
            stroke={lit ? (done ? '#34d399' : '#8ec5ff') : '#9fd3ff'}
            strokeOpacity={lit ? 0.9 : 0.16}
            strokeWidth={major ? 1.6 : 1}
          />
        );
      })}

      <circle
        cx="200"
        cy="200"
        r="170"
        fill="none"
        stroke="rgba(255,255,255,0.07)"
      />
      <g className={active ? 'kiosk-spin-fast' : 'kiosk-spin'}>
        <circle
          cx="200"
          cy="200"
          r="124"
          fill="none"
          stroke="#7dd3fc"
          strokeOpacity="0.28"
          strokeDasharray="1.5 7"
        />
      </g>

      {/* Track + glowing progress arc */}
      <circle
        cx="200"
        cy="200"
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="10"
      />
      <circle
        cx="200"
        cy="200"
        r={r}
        fill="none"
        stroke="url(#kiosk-arc)"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - soc / 100)}
        transform="rotate(-90 200 200)"
        filter="url(#kiosk-glow)"
      />
      <circle
        cx={head.x}
        cy={head.y}
        r="7"
        fill="#e6f2ff"
        filter="url(#kiosk-glow)"
      />
    </svg>
  );
}

function ContactlessMark({ busy }: { busy: boolean }) {
  return (
    <span className="relative flex h-[clamp(56px,7vh,92px)] w-[clamp(56px,7vh,92px)] shrink-0 items-center justify-center">
      {!busy && (
        <>
          <span className="kiosk-ripple absolute inset-0 rounded-full border border-[#8ec5ff]/50" />
          <span className="kiosk-ripple kiosk-ripple-delay absolute inset-0 rounded-full border border-[#8ec5ff]/50" />
        </>
      )}
      <span
        className={`relative flex h-full w-full items-center justify-center rounded-full border ${busy ? 'border-[#8ec5ff]/20' : 'border-[#8ec5ff]/40'} bg-[#0b1430]`}
      >
        {busy && (
          <span className="kiosk-spin-fast absolute inset-[-1px] rounded-full border-2 border-transparent border-t-[#8ec5ff]" />
        )}
        <svg viewBox="0 0 24 24" className="h-[46%] w-[46%]" fill="none">
          {[5, 9, 13].map((radius) => {
            const dx = 4 + radius * 0.643;
            const dy = radius * 0.766;
            return (
              <path
                key={radius}
                d={`M${dx} ${12 - dy}A${radius} ${radius} 0 0 1 ${dx} ${12 + dy}`}
                stroke="#e6f2ff"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            );
          })}
        </svg>
      </span>
    </span>
  );
}

function PaymentMarks() {
  const pill =
    'flex h-[clamp(24px,2.8vh,34px)] items-center rounded-md border border-white/12 bg-white/[0.06] px-2.5 text-[clamp(11px,1.3vh,15px)] font-semibold text-white/85';
  return (
    <>
      <span className={`${pill} gap-1`}>
        <svg
          viewBox="0 0 24 24"
          className="-mt-0.5 h-3.5 w-3.5"
          fill="currentColor"
        >
          <path d={APPLE_LOGO_PATH} />
        </svg>
        Pay
      </span>
      <span className={pill}>G Pay</span>
      <span className={`${pill} italic tracking-tight`}>VISA</span>
      <span className={pill}>
        <span className="h-3.5 w-3.5 rounded-full bg-[#eb001b]/90" />
        <span className="-ml-1.5 h-3.5 w-3.5 rounded-full bg-[#f79e1b]/90" />
      </span>
    </>
  );
}
