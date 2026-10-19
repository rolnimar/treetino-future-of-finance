import { useState, useRef, useEffect } from 'react';
import { ArrowRightIcon } from '../features/victron/victron-icons';

interface TreetinoHeroCinematicProps {
  onSelectAsset?: (siteId: number) => void;
  onExploreCampaigns?: () => void;
  onBackProject?: (siteId: number) => void;
}

interface HeroSlide {
  id: string;
  tag: string;
  title: string;
  creator: string;
  tagline: string;
  type: 'video' | 'image';
  media: string;
  poster?: string;
  siteId: number;
  raised: string;
  target: string;
  percent: number;
  apy: string;
  backers: number;
  daysLeft: number;
  livePower: string;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'battery',
    tag: 'Dolní Lukavice / Přeštice',
    title: 'BESS Přeštice 8.6 MW',
    creator: 'WATTINO × ČEZ Distribuce',
    tagline:
      'Utility battery storage capturing negative solar prices & 24/7 grid standby fees.',
    type: 'image',
    media: '/campaigns/ess.jpg',
    poster: '/campaigns/ess.jpg',
    siteId: 219742,
    raised: 'USDC 84,200',
    target: 'USDC 108,000',
    percent: 78,
    apy: '35.0%',
    backers: 46,
    daysLeft: 21,
    livePower: '6.2 MW live',
  },
  {
    id: 'tree',
    tag: 'Prague, Czech Republic',
    title: 'Treetino V1 Energy Tree',
    creator: 'MKovo Engineering',
    tagline:
      'Signature kinetic solar & wind tree generating 24/7 clean power for industry.',
    type: 'video',
    media: '/video/hero-v1-cine-noaudio.webm',
    poster: '/img/hero-images/poster-v1_1.1.1.webp',
    siteId: 100001,
    raised: 'USDC 192,700',
    target: 'USDC 235,000',
    percent: 82,
    apy: '12.8%',
    backers: 48,
    daysLeft: 14,
    livePower: '42.8 kW live',
  },
  {
    id: 'ev',
    tag: 'Paris, France',
    title: 'Ultra-Fast EV Plaza',
    creator: 'ChargeVolt Paris',
    tagline:
      'Solar canopy & DC fast chargers with native energy-backed stablecoin settlement.',
    type: 'image',
    media: '/campaigns/ev.jpg',
    poster: '/campaigns/ev.jpg',
    siteId: 374891,
    raised: 'USDC 91,500',
    target: 'USDC 100,000',
    percent: 92,
    apy: '18.5%',
    backers: 82,
    daysLeft: 9,
    livePower: '18.2 kW live',
  },
  {
    id: 'wind',
    tag: 'Kryry Wind Corridor',
    title: 'Wind Park Kryry 4.0 MW',
    creator: 'EcoPower Solution',
    tagline:
      'Two 2.0 MW Vestas V80 turbines tokenizing industrial-scale wind power on Solana.',
    type: 'image',
    media: '/campaigns/wind.jpg',
    poster: '/campaigns/wind.jpg',
    siteId: 209689,
    raised: 'USDC 142,000',
    target: 'USDC 180,000',
    percent: 79,
    apy: '14.2%',
    backers: 64,
    daysLeft: 18,
    livePower: '3.4 MW live',
  },
];

export function TreetinoHeroCinematic({
  onSelectAsset,
  onExploreCampaigns,
  onBackProject,
}: TreetinoHeroCinematicProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const slide = HERO_SLIDES[currentSlideIndex];

  useEffect(() => {
    if (slide.type === 'video' && videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [currentSlideIndex, slide.type]);

  return (
    <section className="relative min-h-[92vh] sm:min-h-screen w-full bg-zinc-950 overflow-hidden select-none flex flex-col justify-end pt-28 pb-12 sm:pb-16">
      {/* 1. Cinematic Background: Authentic Video or High-Res Image for each project */}
      <div className="pointer-events-none absolute inset-0 h-full w-full overflow-hidden bg-zinc-950">
        {slide.type === 'video' ? (
          <video
            ref={videoRef}
            key={slide.media}
            poster={slide.poster}
            className="absolute inset-0 h-full w-full object-cover opacity-85 transition-opacity duration-1000 scale-105"
            muted
            loop
            playsInline
            autoPlay
            preload="auto"
          >
            <source src={slide.media} type="video/webm" />
          </video>
        ) : (
          <img
            key={slide.media}
            src={slide.media}
            alt={slide.title}
            className="absolute inset-0 h-full w-full object-cover opacity-85 transition-opacity duration-1000 scale-105"
          />
        )}

        {/* Soft, clean gradients so the hardware breathes while text is perfectly legible */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-zinc-950/70" />

        {/* Ethereal Atmospheric Radial Spotlights for Dynamic Depth - Strictly Blue */}
        <div className="pointer-events-none absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[140px]" />
        <div className="pointer-events-none absolute bottom-10 right-10 h-[400px] w-[400px] rounded-full bg-blue-500/10 blur-[130px]" />
      </div>

      {/* 2. Main High-Impact Hero Content */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col justify-end">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-end">
          {/* Left: Punchy Title & Pitch */}
          <div className="lg:col-span-7 space-y-5 text-white">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="font-semibold text-blue-300 uppercase tracking-widest">
                {slide.tag}
              </span>
              <span className="text-zinc-500">·</span>
              <span className="text-zinc-300">{slide.livePower}</span>
            </div>

            <h1 className="text-3xl sm:text-6xl lg:text-8xl font-normal tracking-tight text-white leading-[1.08]">
              {slide.title}
            </h1>

            <p className="max-w-xl text-base sm:text-lg text-zinc-300 font-normal leading-relaxed">
              {slide.tagline}
            </p>
          </div>

          {/* Right: The High-Yield Investment Card */}
          <div className="lg:col-span-5">
            <div className="relative group">
              {/* Ambient back-glow - strictly blue */}
              <div className="pointer-events-none absolute -inset-1 rounded-3xl bg-blue-600/15 blur-xl opacity-60 transition duration-500 group-hover:opacity-80" />

              <div className="relative rounded-3xl border border-white/15 bg-zinc-950/80 p-6 sm:p-7 backdrop-blur-2xl text-white space-y-5 shadow-2xl">
                {/* Pledged Amount */}
                <div>
                  <div className="flex items-baseline justify-between font-mono">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">
                        {slide.raised}
                      </span>
                      <span className="text-xs text-zinc-400 font-normal">
                        of {slide.target}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-medium text-sky-400">
                      {slide.percent}% funded
                    </span>
                  </div>

                  {/* Luminous progress bar - using the ONE signature gradient */}
                  <div className="mt-3.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-[#183d89] to-[#2563eb] transition-all duration-700 rounded-full shadow-[0_0_12px_rgba(37,99,235,0.5)]"
                      style={{ width: `${slide.percent}%` }}
                    />
                  </div>
                </div>

                {/* 3 Core Stats: APY · Days Left · Backers */}
                <div className="grid grid-cols-3 gap-3 border-t border-white/10 pt-4 font-mono">
                  <div>
                    <span className="block text-2xl sm:text-3xl font-semibold text-sky-400">
                      {slide.apy}
                    </span>
                    <span className="mt-1 block text-[10px] text-zinc-400 uppercase tracking-wider font-sans">
                      Fixed APY
                    </span>
                  </div>
                  <div>
                    <span className="block text-2xl sm:text-3xl font-light text-white">
                      {slide.daysLeft}d
                    </span>
                    <span className="mt-1 block text-[10px] text-zinc-400 uppercase tracking-wider font-sans">
                      Days Left
                    </span>
                  </div>
                  <div>
                    <span className="block text-2xl sm:text-3xl font-light text-white">
                      {slide.backers}
                    </span>
                    <span className="mt-1 block text-[10px] text-zinc-400 uppercase tracking-wider font-sans">
                      Backers
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (onBackProject) {
                        onBackProject(slide.siteId);
                      } else {
                        onSelectAsset?.(slide.siteId);
                      }
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#183d89] to-[#2563eb] hover:from-[#1d4bb5] hover:to-[#3b82f6] px-6 py-3.5 text-center text-sm font-semibold text-white shadow-lg shadow-blue-950/40 transition-all active:scale-[0.99] cursor-pointer"
                  >
                    <span>Back This Project</span>
                    <ArrowRightIcon className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectAsset?.(slide.siteId)}
                    className="flex items-center justify-center gap-1.5 w-full text-center text-xs font-mono text-zinc-400 hover:text-white transition cursor-pointer py-1"
                  >
                    <span>Live SCADA Telemetry ↗</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Bottom Minimal Controls */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4 text-white">
          <div className="flex items-center gap-6 sm:gap-8">
            {HERO_SLIDES.map((s, idx) => {
              const shortNames = [
                'Battery Storage (35%)',
                'Energy Tree',
                'EV Plaza',
                'Wind Turbines',
              ];
              const isCurrent = idx === currentSlideIndex;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setCurrentSlideIndex(idx)}
                  className={`group relative pb-2 text-xs font-mono transition-colors cursor-pointer ${
                    isCurrent
                      ? 'text-white font-medium'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={
                        isCurrent ? 'text-white font-medium' : 'text-zinc-600'
                      }
                    >
                      0{idx + 1}
                    </span>
                    <span className="hidden sm:inline">{shortNames[idx]}</span>
                  </span>
                  {isCurrent && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
                  )}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              if (onExploreCampaigns) {
                onExploreCampaigns();
              } else {
                const el =
                  document.getElementById('kickstarter-campaigns') ??
                  document.getElementById('campaigns');
                el?.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <span>Explore campaigns</span>
            <span className="text-white/70">↓</span>
          </button>
        </div>
      </div>
    </section>
  );
}
