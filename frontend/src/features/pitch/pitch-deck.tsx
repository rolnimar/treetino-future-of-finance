import { useState, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';
import { PITCH_SLIDES } from './pitch-slides';
import { PitchVictronTopology } from './pitch-victron-topology';
import { LogoType } from '../../components/LogoType';

function TreetinoXQRCode({ className = 'w-32 h-32' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 31 31"
      shapeRendering="crispEdges"
      className={className}
    >
      <path fill="#ffffff" d="M0 0h31v31H0z" />
      <path
        stroke="#09090b"
        d="M1 1.5h7m2 0h4m2 0h3m2 0h1m1 0h7M1 2.5h1m5 0h1m2 0h1m1 0h2m4 0h1m2 0h1m1 0h1m5 0h1M1 3.5h1m1 0h3m1 0h1m1 0h1m3 0h1m1 0h1m1 0h1m2 0h2m1 0h1m1 0h3m1 0h1M1 4.5h1m1 0h3m1 0h1m1 0h1m2 0h2m3 0h2m1 0h1m2 0h1m1 0h3m1 0h1M1 5.5h1m1 0h3m1 0h1m1 0h2m1 0h5m2 0h3m1 0h1m1 0h3m1 0h1M1 6.5h1m5 0h1m1 0h1m2 0h1m1 0h6m3 0h1m5 0h1M1 7.5h7m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h7M9 8.5h1m4 0h1m1 0h1m3 0h2M1 9.5h1m1 0h5m2 0h1m4 0h2m1 0h1m1 0h1m2 0h5M11 10.5h3m2 0h10m3 0h1M3 11.5h1m1 0h3m1 0h1m8 0h1m2 0h1m1 0h2M1 12.5h1m2 0h1m5 0h1m1 0h1m2 0h1m1 0h1m6 0h1m1 0h1m1 0h1M7 13.5h1m1 0h1m1 0h1m5 0h2m1 0h1m1 0h1m3 0h2M1 14.5h2m2 0h2m1 0h1m1 0h1m1 0h5m3 0h6m3 0h1M5 15.5h3m1 0h2m2 0h7m3 0h2m1 0h2M1 16.5h1m3 0h1m3 0h3m1 0h2m1 0h1m2 0h1m1 0h1m1 0h1m1 0h1m2 0h1M1 17.5h1m1 0h2m2 0h2m1 0h1m4 0h2m1 0h1m2 0h1m4 0h2M1 18.5h2m1 0h2m2 0h1m1 0h1m1 0h1m3 0h2m2 0h2m1 0h3m1 0h1m1 0h1M1 19.5h1m2 0h4m1 0h1m1 0h3m5 0h1m1 0h1m5 0h1M1 20.5h1m1 0h2m1 0h1m1 0h1m6 0h1m1 0h1m1 0h1m1 0h2m1 0h1m3 0h1M1 21.5h1m4 0h7m4 0h1m1 0h1m1 0h5m1 0h3M9 22.5h2m1 0h5m1 0h2m1 0h1m3 0h5M1 23.5h7m2 0h1m3 0h5m1 0h2m1 0h1m1 0h3M1 24.5h1m5 0h1m1 0h4m1 0h1m1 0h1m1 0h4m3 0h1m3 0h1M1 25.5h1m1 0h3m1 0h1m1 0h1m1 0h1m3 0h2m4 0h5m1 0h3M1 26.5h1m1 0h3m1 0h1m1 0h1m1 0h1m4 0h2m1 0h2m5 0h2M1 27.5h1m1 0h3m1 0h1m1 0h2m1 0h1m6 0h2m2 0h1m1 0h4M1 28.5h1m5 0h1m2 0h1m3 0h1m2 0h1m3 0h2m2 0h2m1 0h1M1 29.5h7m1 0h1m1 0h2m1 0h2m1 0h1m1 0h2m1 0h2m2 0h2"
      />
    </svg>
  );
}

interface PitchDeckProps {
  onExit: () => void;
  onExploreCampaigns: () => void;
  onOpenDeposit?: () => void;
}

export function PitchDeck({ onExit }: PitchDeckProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPresenterNotesOpen, setIsPresenterNotesOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBlackout, setIsBlackout] = useState(false);

  // 3-Minute Pitch Timer (In Presenter Drawer)
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const currentSlide = PITCH_SLIDES[currentSlideIndex];
  const totalSlides = PITCH_SLIDES.length;

  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  useEffect(() => {
    QRCode.toDataURL('https://x.com/treetino_corp', {
      width: 400,
      margin: 1,
      color: { dark: '#09090b', light: '#ffffff' },
    })
      .then(setQrCodeDataUrl)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () =>
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleNext = useCallback(() => {
    setCurrentSlideIndex((prev) => (prev < totalSlides - 1 ? prev + 1 : prev));
  }, [totalSlides]);

  const handlePrev = useCallback(() => {
    setCurrentSlideIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  // Hardware Clicker & Keyboard navigation
  // Supports all standard presentation remotes (Logitech, Kensington, Areson RF, DinoFire)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // If screen is currently blacked out, any click or key unblanks it
      if (isBlackout) {
        e.preventDefault();
        setIsBlackout(false);
        return;
      }

      const key = e.key;
      const code = e.code;

      // 1. Next Slide (Hardware Clicker Next, PageDown, Right/Down Arrow, Space, Enter)
      const isNext =
        key === 'PageDown' ||
        code === 'PageDown' ||
        key === 'ArrowRight' ||
        code === 'ArrowRight' ||
        key === 'ArrowDown' ||
        code === 'ArrowDown' ||
        key === ' ' ||
        code === 'Space' ||
        key === 'Enter' ||
        code === 'Enter' ||
        code === 'NumpadEnter' ||
        key === ']' ||
        code === 'BracketRight' ||
        key === 'MediaTrackNext';

      // 2. Previous Slide (Hardware Clicker Back, PageUp, Left/Up Arrow, Backspace)
      const isPrev =
        key === 'PageUp' ||
        code === 'PageUp' ||
        key === 'ArrowLeft' ||
        code === 'ArrowLeft' ||
        key === 'ArrowUp' ||
        code === 'ArrowUp' ||
        key === 'Backspace' ||
        code === 'Backspace' ||
        key === '[' ||
        code === 'BracketLeft' ||
        key === 'MediaTrackPrevious';

      // 3. Fullscreen / Slideshow Launch (F5 on presenter remotes, 'f')
      const isFullscreenToggle =
        key === 'F5' || code === 'F5' || key === 'f' || key === 'F';

      // 4. Black Screen / Mute Screen ('.' or 'b' on presenter remotes)
      const isBlackoutToggle =
        key === 'b' ||
        key === 'B' ||
        key === '.' ||
        code === 'Period' ||
        code === 'KeyB';

      // 5. Presenter Script Notes Drawer ('n' or 's')
      const isNotesToggle =
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        (key === 'n' || key === 'N' || key === 's' || key === 'S');

      if (isNext) {
        e.preventDefault();
        handleNext();
      } else if (isPrev) {
        e.preventDefault();
        handlePrev();
      } else if (isFullscreenToggle) {
        // Prevent default browser page reload on F5 and toggle fullscreen instead
        e.preventDefault();
        handleToggleFullscreen();
      } else if (isBlackoutToggle) {
        e.preventDefault();
        setIsBlackout(true);
      } else if (isNotesToggle) {
        e.preventDefault();
        setIsPresenterNotesOpen((prev) => !prev);
      } else if (key === 'Escape') {
        if (isPresenterNotesOpen) {
          setIsPresenterNotesOpen(false);
        } else {
          onExit();
        }
      } else if (['1', '2', '3', '4', '5', '6', '7'].includes(key)) {
        const targetIndex = parseInt(key, 10) - 1;
        if (targetIndex >= 0 && targetIndex < totalSlides) {
          setCurrentSlideIndex(targetIndex);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleNext,
    handlePrev,
    isBlackout,
    isPresenterNotesOpen,
    onExit,
    totalSlides,
  ]);

  return (
    <div className="fixed inset-0 z-50 w-screen h-screen flex flex-col justify-between overflow-hidden select-none font-sans bg-white text-zinc-950">
      {/* Dynamic Full-Bleed Media Backgrounds with Projector Contrast */}
      {currentSlide.id === 'hardware-gateway' && (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none transition-opacity duration-700">
          <video
            autoPlay
            loop
            muted
            playsInline
            poster="/img/hero-images/poster-v1_1.1.1.webp"
            className="w-full h-full object-cover object-[75%_center]"
          >
            <source src="/video/hero-v1-cine-noaudio.webm" type="video/webm" />
          </video>
          {/* Clean directional scrim: keeps text on the left pure white and razor sharp, leaves tree video 100% visible with zero bottom fog */}
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 via-35% to-transparent" />
        </div>
      )}

      {currentSlide.id === 'financial-engine' && (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none transition-opacity duration-700">
          <img
            src="/campaigns/ess.jpg"
            alt="BESS Přeštice 8.6 MW Utility Battery Storage"
            className="w-full h-full object-cover object-right opacity-85"
          />
          {/* Solid white under text on left, smoothly fading out over the battery racks on the right */}
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 via-45% to-white/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 via-25% to-transparent" />
        </div>
      )}

      {/* 1. Clean Top Header matching Whitemode/Cinematic Branding */}
      <header className="relative z-40 h-20 px-8 sm:px-12 flex items-center justify-between border-b border-zinc-100 transition-colors duration-500">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onExit}
            className="flex items-center gap-2 cursor-pointer transition hover:opacity-80"
          >
            <LogoType className="h-6 text-zinc-950" />
          </button>
          <div className="h-5 w-px hidden sm:block bg-zinc-200" />
          <span className="font-mono text-sm font-bold text-zinc-500">
            0{currentSlide.number} / 0{totalSlides}
          </span>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3.5">
          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 transition cursor-pointer shadow-sm"
            title="Toggle Fullscreen (F)"
          >
            <svg
              className="h-4 w-4 text-zinc-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
            <span className="hidden sm:inline">
              {isFullscreen ? 'Exit' : 'Fullscreen'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsPresenterNotesOpen((prev) => !prev)}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold transition cursor-pointer shadow-sm ${
              isPresenterNotesOpen
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950'
            }`}
            title="Toggle Presenter Script (N)"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z"
              />
            </svg>
            <span className="hidden sm:inline">Script [N]</span>
          </button>

          <button
            type="button"
            onClick={onExit}
            className="flex items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 h-9 w-9 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 transition cursor-pointer shadow-sm"
            title="Exit Presentation (ESC)"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* 2. Main Slide Presentation Stage: Whitemode, Giant Projector Typography (<20 Words) */}
      <main
        onClick={(e) => {
          const target = e.target as HTMLElement | null;
          if (target?.closest('button, a, input, textarea, select')) {
            return;
          }
          handleNext();
        }}
        className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-8 sm:px-12 flex flex-col justify-center cursor-default select-none"
      >
        {/* SLIDE 1: THREE TRILLION DOLLARS */}
        {currentSlide.id === 'market-gap' && (
          <div className="w-full flex flex-col justify-center max-w-6xl mx-auto space-y-12">
            {/* Top Massive Hero Headline */}
            <div className="space-y-4">
              <div className="font-mono text-sm font-bold text-blue-600 tracking-widest uppercase">
                01 / Global Energy
              </div>
              <h1 className="text-8xl sm:text-9xl lg:text-[11rem] font-black tracking-tighter text-zinc-950 leading-none">
                $3 Trillion.
              </h1>
              <p className="text-2xl sm:text-4xl font-bold text-zinc-600 tracking-tight max-w-4xl pt-2">
                Poured into global energy last year alone. Larger than the
                entire market cap of crypto.
              </p>
            </div>

            {/* Bottom 3-Part Contrast: Minimal, Sleek, No Heavy Bubbles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t-2 border-zinc-100">
              <div className="space-y-2">
                <span className="font-mono text-xs font-bold text-zinc-400 uppercase tracking-widest block">
                  The Capital
                </span>
                <div className="text-4xl sm:text-5xl font-black text-zinc-950 font-mono">
                  $3,000B
                </div>
                <p className="text-base font-bold text-zinc-600">
                  Global energy investment in 2025. Shut off from retail.
                </p>
              </div>

              <div className="space-y-2">
                <span className="font-mono text-xs font-bold text-rose-500 uppercase tracking-widest block">
                  The Problem
                </span>
                <div className="text-4xl sm:text-5xl font-black text-rose-600 font-mono">
                  0% Access
                </div>
                <p className="text-base font-bold text-zinc-600">
                  Anyone buys $10 of Bitcoin. Ordinary people only get the bill.
                </p>
              </div>

              <div className="space-y-2">
                <span className="font-mono text-xs font-bold text-blue-600 uppercase tracking-widest block">
                  The Shift
                </span>
                <div className="text-4xl sm:text-5xl font-black text-blue-600">
                  Treetino
                </div>
                <p className="text-base font-bold text-zinc-600">
                  Turning everyday consumers into profitable energy owners.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 2: WHY SOLANA */}
        {currentSlide.id === 'why-solana' && (
          <div className="w-full flex flex-col justify-between py-4 min-h-[58vh]">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="font-mono text-sm font-bold text-blue-600 tracking-widest uppercase">
                  02 / Blockchain Moat
                </div>
                <a
                  href="https://solscan.io/account/EEbZ5DVTQ9f4XeRwmSh4u2QPiMSSmQjqKPNEpDHoBU2n?cluster=devnet"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 font-mono text-xs font-bold text-emerald-700 hover:text-emerald-900 transition"
                  title="View live Anchor Program on Solscan"
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                  <span>Live Program:</span>
                  <span className="underline underline-offset-4">
                    EEbZ5DVT...BU2n ↗
                  </span>
                </a>
              </div>
              <h2 className="text-8xl sm:text-9xl lg:text-[10rem] font-black tracking-tighter text-zinc-950 leading-none">
                Why Solana.
              </h2>
              <p className="text-2xl sm:text-4xl font-bold text-zinc-600 tracking-tight max-w-4xl pt-2">
                Sub-second synchronization. Zero gas drag. Real-time energy
                settlement.
              </p>
            </div>

            {/* Bottom 3-Part Contrast: Minimal, Sleek, No Heavy Bubbles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t-2 border-zinc-100">
              <div className="space-y-2">
                <span className="font-mono text-xs font-bold text-zinc-400 uppercase tracking-widest block">
                  Edge Synchronization
                </span>
                <div className="text-4xl sm:text-5xl font-black text-zinc-950 font-mono">
                  400 ms
                </div>
                <p className="text-base font-bold text-zinc-600">
                  Sub-second slot times synchronize directly with live grid
                  frequency balancing.
                </p>
              </div>

              <div className="space-y-2">
                <span className="font-mono text-xs font-bold text-zinc-400 uppercase tracking-widest block">
                  Zero Fee Erosion
                </span>
                <div className="text-4xl sm:text-5xl font-black text-zinc-950 font-mono">
                  $0.0002
                </div>
                <p className="text-base font-bold text-zinc-600">
                  Continuous micro-dividends stream directly to retail wallets
                  with zero gas drag.
                </p>
              </div>

              <div className="space-y-2">
                <span className="font-mono text-xs font-bold text-blue-600 uppercase tracking-widest block">
                  Trustless Security
                </span>
                <div className="text-4xl sm:text-5xl font-black text-blue-600 font-sans">
                  Atomic Revoke
                </div>
                <p className="text-base font-bold text-zinc-600">
                  Non-custodial PDA escrow vault; mint authority burned on-chain
                  forever.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 3: FULLSIZE TREE VIDEO - TREETINO V1 */}
        {currentSlide.id === 'hardware-gateway' && (
          <div className="w-full flex flex-col justify-between py-4 min-h-[58vh]">
            <div className="space-y-4">
              <div className="font-mono text-sm font-bold text-blue-600 tracking-widest uppercase">
                03 / Clean Energy RWA
              </div>
              <h2 className="text-8xl sm:text-9xl lg:text-[10rem] font-black tracking-tighter text-zinc-950 leading-none">
                Treetino V1.
              </h2>
              <p className="text-2xl sm:text-4xl font-bold text-zinc-600 tracking-tight max-w-2xl pt-2">
                Patented kinetic solar &amp; micro-wind tree generating 49 kW of
                clean power.
              </p>
            </div>

            {/* Bottom 3-Part Contrast: Minimal, Sleek, No Heavy Bubbles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t-2 border-zinc-200/80 max-w-4xl">
              <div className="space-y-2">
                <span className="font-mono text-xs font-bold text-zinc-400 uppercase tracking-widest block">
                  Generation Capacity
                </span>
                <div className="text-4xl sm:text-5xl font-black text-zinc-950 font-mono">
                  49 kW
                </div>
                <p className="text-base font-bold text-zinc-600">
                  Clean dual-source kinetic solar and micro-wind generation.
                </p>
              </div>

              <div className="space-y-2">
                <span className="font-mono text-xs font-bold text-blue-600 uppercase tracking-widest block">
                  RWA Protocol
                </span>
                <div className="text-4xl sm:text-5xl font-black text-blue-600 font-sans">
                  Flagship
                </div>
                <p className="text-base font-bold text-zinc-600">
                  Physical tokenized clean energy asset deployed in Prague.
                </p>
              </div>

              <div className="space-y-2">
                <span className="font-mono text-xs font-bold text-emerald-600 uppercase tracking-widest block">
                  First Client
                </span>
                <div className="text-4xl sm:text-5xl font-black text-zinc-950 font-sans">
                  MKovo
                </div>
                <p className="text-base font-bold text-zinc-600">
                  5 contracted units with deliveries from now till Q2 2027.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 4: UTILITY BATTERY STORAGE */}
        {currentSlide.id === 'financial-engine' && (
          <div className="w-full flex flex-col justify-between py-4 min-h-[58vh]">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="font-mono text-sm font-bold text-blue-600 tracking-widest uppercase">
                  04 / Financial Engine
                </div>
                <div className="flex items-center gap-2 font-mono text-xs font-bold text-blue-700">
                  <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                  <span>
                    Pipeline Anchor: 8.6 MW ČEZ Grid Interconnection Secured
                  </span>
                </div>
              </div>
              <h2 className="text-8xl sm:text-9xl lg:text-[10rem] font-black tracking-tighter text-zinc-950 leading-none">
                Battery Storage.
              </h2>
              <p className="text-2xl sm:text-4xl font-bold text-zinc-600 tracking-tight max-w-4xl pt-2">
                Grid volatility creates Europe’s most lucrative cash-flow asset.
              </p>
            </div>

            {/* Bottom 3-Part Contrast: Minimal, Sleek, No Heavy Bubbles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t-2 border-zinc-100">
              <div className="space-y-2">
                <span className="font-mono text-xs font-bold text-zinc-400 uppercase tracking-widest block">
                  Net Annual EBITDA
                </span>
                <div className="text-4xl sm:text-5xl font-black text-zinc-950 font-mono">
                  €1.0M–€1.5M
                </div>
                <p className="text-base font-bold text-zinc-600">
                  Dual revenue: 24/7 grid balancing capacity fees + negative
                  price spot arbitrage.
                </p>
              </div>

              <div className="space-y-2">
                <span className="font-mono text-xs font-bold text-emerald-600 uppercase tracking-widest block">
                  Capital Payback
                </span>
                <div className="text-4xl sm:text-5xl font-black text-emerald-600 font-mono">
                  &lt; 3 Years
                </div>
                <p className="text-base font-bold text-zinc-600">
                  25%–35% unlevered project IRR outperforming traditional
                  infrastructure.
                </p>
              </div>

              <div className="space-y-2">
                <span className="font-mono text-xs font-bold text-blue-600 uppercase tracking-widest block">
                  Dual Revenue Engine
                </span>
                <div className="text-4xl sm:text-5xl font-black text-blue-600 font-mono">
                  24/7 Yield
                </div>
                <p className="text-base font-bold text-zinc-600">
                  Paid to charge during negative solar midday; discharging at
                  evening peak spreads.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 5: MULTI-LAYER DEFI FINANCIAL ENGINE */}
        {currentSlide.id === 'defi-financial-engine' && (
          <div className="w-full flex flex-col justify-between py-4 min-h-[58vh]">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="font-mono text-sm font-bold text-blue-600 tracking-widest uppercase">
                  05 / Multi-Layer Financial Engine
                </div>
                <div className="flex items-center gap-2 font-mono text-xs font-bold text-blue-700">
                  <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                  <span>Triple Yield Stack</span>
                </div>
              </div>
              <h2 className="text-8xl sm:text-9xl lg:text-[10rem] font-black tracking-tighter text-zinc-950 leading-none">
                Triple Yield.
              </h2>
              <p className="text-2xl sm:text-4xl font-bold text-zinc-600 tracking-tight max-w-4xl pt-2">
                Compounding real-world clean energy revenues with liquid Solana
                DeFi.
              </p>
            </div>

            {/* Bottom 3-Part Contrast: Minimal, Sleek, No Heavy Bubbles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t-2 border-zinc-100">
              <div className="space-y-2">
                <span className="font-mono text-xs font-bold text-blue-600 uppercase tracking-widest block">
                  Institutional Yield
                </span>
                <div className="text-4xl sm:text-5xl font-black text-blue-600 font-mono">
                  9% – 21%
                </div>
                <p className="text-base font-bold text-zinc-600">
                  Predictable base revenue from long-term PPAs and ČEPS grid
                  balancing.
                </p>
              </div>

              <div className="space-y-2">
                <span className="font-mono text-xs font-bold text-zinc-400 uppercase tracking-widest block">
                  Host Collateral (mSOL)
                </span>
                <div className="text-4xl sm:text-5xl font-black text-zinc-950 font-sans">
                  Zero CapEx
                </div>
                <p className="text-base font-bold text-zinc-600">
                  Hosts get free trees by locking Marinade SOL collateral to
                  secure investors.
                </p>
              </div>

              <div className="space-y-2">
                <span className="font-mono text-xs font-bold text-emerald-600 uppercase tracking-widest block">
                  Yield Multiplier
                </span>
                <div className="text-4xl sm:text-5xl font-black text-emerald-600 font-mono">
                  +6% – 9%
                </div>
                <p className="text-base font-bold text-zinc-600">
                  USDC dividend payouts auto-staked into Kamino / RockawayX
                  earning pools.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 6: LIVE VICTRON SCADA INTEGRATION */}
        {currentSlide.id === 'victron-integration' && (
          <div className="w-full flex flex-col justify-between py-2 min-h-[58vh]">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="font-mono text-sm font-bold text-blue-600 tracking-widest uppercase">
                  06 / Edge Architecture
                </div>
                <div className="flex items-center gap-2 font-mono text-xs font-bold text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                  <span>
                    96 Signed SCADA Readings / Day · Modbus TCP &lt; 10 ms RTT
                  </span>
                </div>
              </div>
              <h2 className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tighter text-zinc-950 leading-none">
                Live Victron SCADA.
              </h2>
              <p className="text-xl sm:text-2xl font-bold text-zinc-600 tracking-tight max-w-4xl">
                Physical edge telemetry streaming straight from Venus OS into
                Solana state.
              </p>
            </div>

            {/* Seamless Light Industrial Topology Canvas - No Outer Bubble */}
            <div className="w-full flex justify-center pt-4 border-t-2 border-zinc-100">
              <PitchVictronTopology />
            </div>
          </div>
        )}

        {/* SLIDE 7: SIMPLIFIED FINALE & CTA TO FOLLOW ON X */}
        {currentSlide.id === 'vision-round' && (
          <div className="w-full flex flex-col justify-between py-6 min-h-[62vh]">
            {/* Top Indicator */}
            <div className="flex items-center justify-between">
              <div className="font-mono text-sm font-bold text-blue-600 tracking-widest uppercase">
                07 / The New Energy Era
              </div>
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                <span>Live on Solana Devnet</span>
              </div>
            </div>

            {/* Hero Punchline Quote with Generous Breathing Room */}
            <div className="py-8 max-w-5xl">
              <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-zinc-950 leading-[1.15]">
                &ldquo;We only ever had to pay for energy. It&rsquo;s time to
                earn from the global energy transformation.&rdquo;
              </h2>
            </div>

            {/* Streamlined Minimalist CTA to Follow on X */}
            <div className="pt-8 border-t-2 border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-1.5">
                <div className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight flex items-center gap-2.5">
                  <span>Follow our journey on</span>
                  <svg
                    className="h-6 w-6 fill-current text-zinc-950"
                    viewBox="0 0 24 24"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </div>
                <div className="font-mono text-xl font-bold text-blue-600">
                  @treetino_corp
                </div>
              </div>

              {/* Scannable Vector QR Code linking to https://x.com/treetino_corp */}
              <a
                href="https://x.com/treetino_corp"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-4 group cursor-pointer"
                title="Scan to follow @treetino_corp on X"
              >
                <div className="bg-white p-2 border border-zinc-200 group-hover:border-zinc-950 transition-colors shadow-sm">
                  {qrCodeDataUrl ? (
                    <img
                      src={qrCodeDataUrl}
                      alt="QR Code for @treetino_corp on X"
                      className="w-24 h-24 sm:w-28 sm:h-28"
                    />
                  ) : (
                    <TreetinoXQRCode className="w-24 h-24 sm:w-28 sm:h-28" />
                  )}
                </div>
                <div className="hidden sm:block text-left space-y-1">
                  <div className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Scan to Follow
                  </div>
                  <div className="text-sm font-mono font-bold text-blue-600 group-hover:underline flex items-center gap-1">
                    <span>x.com/treetino_corp</span>
                    <span>↗</span>
                  </div>
                </div>
              </a>
            </div>

            {/* Clean Hackathon Team Attribution */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-zinc-100 text-xs font-mono text-zinc-500">
              <div className="flex items-center gap-2">
                <span className="font-bold text-zinc-900">Jakub Lustyk</span>
                <span className="text-blue-600">(CTO, Treetino)</span>
                <span className="text-zinc-300">·</span>
                <span className="font-bold text-zinc-900">
                  Marian-Daniel Rolník
                </span>
                <span className="text-zinc-500">(Cleevio)</span>
              </div>
              <div className="text-zinc-400">Solana Global Hackathon 2026</div>
            </div>
          </div>
        )}
      </main>

      {/* 3. Perimeter Bottom Bar (Indicators & Navigation) */}
      <footer className="relative z-40 h-20 px-8 sm:px-12 flex items-center justify-between border-t border-zinc-100 bg-white/90 backdrop-blur-sm transition-colors duration-500">
        <div className="text-xs font-mono font-bold hidden sm:block text-zinc-400">
          Clicker · Space · ← / → to advance
        </div>

        {/* 7 Clean Pill Indicators */}
        <div className="flex items-center gap-2.5">
          {PITCH_SLIDES.map((slide, idx) => (
            <button
              key={slide.id}
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                setCurrentSlideIndex(idx);
              }}
              className={`h-2 transition-all duration-300 rounded-full cursor-pointer ${
                currentSlideIndex === idx
                  ? 'w-10 bg-blue-600 shadow-md shadow-blue-600/40'
                  : 'w-2.5 bg-zinc-200 hover:bg-zinc-400'
              }`}
              title={`Slide ${idx + 1}: ${slide.title}`}
            />
          ))}
        </div>

        {/* Prev / Next Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              handlePrev();
            }}
            disabled={currentSlideIndex === 0}
            className="rounded-xl border-2 border-zinc-200 bg-white px-5 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer shadow-sm"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              handleNext();
            }}
            className="rounded-xl bg-blue-600 px-6 py-2 text-xs font-black text-white shadow-md shadow-blue-600/30 hover:bg-blue-700 transition cursor-pointer"
          >
            {currentSlideIndex === totalSlides - 1 ? 'Finish' : 'Next →'}
          </button>
        </div>
      </footer>

      {/* 4. Slide-Out Presenter Drawer for Rehearsal / Script */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[460px] bg-white border-l border-zinc-200 shadow-2xl z-50 p-7 flex flex-col justify-between transition-transform duration-300 ease-out ${
          isPresenterNotesOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="space-y-6 overflow-y-auto">
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
            <div>
              <h3 className="text-base font-black text-zinc-950 tracking-tight">
                Presenter Script ({currentSlide.timeRange})
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsPresenterNotesOpen(false)}
              className="text-xs font-mono font-bold text-zinc-500 hover:text-zinc-950 cursor-pointer"
            >
              Close [ESC]
            </button>
          </div>

          {/* 3-Minute Rehearsal Timer */}
          <div className="rounded-2xl border-2 border-zinc-200 bg-zinc-50 p-4 flex items-center justify-between font-mono">
            <div>
              <span className="text-xs font-bold text-zinc-500">
                Pitch Timer:{' '}
              </span>
              <span
                className={`text-base font-black ${elapsedSeconds > 180 ? 'text-rose-600' : 'text-blue-600'}`}
              >
                {formatTimer(elapsedSeconds)} / 3:00
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsTimerRunning((prev) => !prev)}
              className="rounded-xl bg-zinc-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-zinc-800 transition cursor-pointer"
            >
              {isTimerRunning ? 'Pause' : 'Start'}
            </button>
          </div>

          {/* Spoken Script */}
          <div className="space-y-2">
            <div className="text-xs font-mono font-bold text-blue-600 uppercase tracking-wider">
              Say this out loud:
            </div>
            <div className="rounded-2xl border-2 border-zinc-200 bg-zinc-50 p-5 text-sm leading-relaxed text-zinc-900 italic whitespace-pre-line font-medium">
              &ldquo;{currentSlide.script}&rdquo;
            </div>
          </div>

          {/* Delivery Cues */}
          <div className="space-y-2">
            <div className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-wider">
              Delivery Cues:
            </div>
            <ul className="space-y-2 text-xs font-medium text-zinc-700">
              {currentSlide.presenterNotes.map((note) => (
                <li key={note} className="flex items-start gap-2.5">
                  <span className="text-blue-600 font-black mt-0.5">•</span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Drawer Footer Hotkey info */}
        <div className="border-t border-zinc-200 pt-4 flex items-center justify-between font-mono text-xs text-zinc-500">
          <span>[SPACE] Advance · [N] Toggle</span>
          <span className="font-bold">Slide 0{currentSlide.number}</span>
        </div>
      </div>

      {/* 5. Blackout Screen Overlay (Activated by '.' or 'B' on Presenter Clickers) */}
      {isBlackout && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsBlackout(false)}
          className="fixed inset-0 z-50 bg-black flex items-center justify-center cursor-pointer transition-opacity duration-200"
        >
          <div className="text-center space-y-2">
            <span className="text-zinc-500 text-xs font-mono tracking-widest uppercase select-none">
              Display Paused
            </span>
            <p className="text-zinc-600 text-xs font-sans">
              Click anywhere or press any key / clicker button to resume
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
