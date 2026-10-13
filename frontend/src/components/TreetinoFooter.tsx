import { LogoType } from './LogoType';

interface TreetinoFooterProps {
  protocolStatus?: {
    connected: boolean;
    unavailable: boolean;
  };
}

export function TreetinoFooter({ protocolStatus }: TreetinoFooterProps) {
  return (
    <footer className="relative mt-20 border-t border-black/10 bg-white text-zinc-950 overflow-hidden">
      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        {/* Top brand header */}
        <div className="flex flex-col gap-6 border-b border-black/10 pb-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <LogoType className="h-6 md:h-7 text-zinc-950" />
            <span className="rounded-full bg-blue-50 px-3 py-1 font-mono text-[10px] font-semibold text-[#183d89] uppercase tracking-wider">
              Clean Energy Protocol
            </span>
          </div>

          <div className="flex items-center gap-5 text-zinc-600">
            {/* X / Twitter */}
            <a
              href="https://x.com/treetino_corp"
              target="_blank"
              rel="noreferrer"
              aria-label="Treetino on X"
              className="transition hover:text-zinc-950"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>

            {/* LinkedIn */}
            <a
              href="https://linkedin.com/company/treetino"
              target="_blank"
              rel="noreferrer"
              aria-label="Treetino on LinkedIn"
              className="transition hover:text-zinc-950"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
              </svg>
            </a>

            {/* Instagram */}
            <a
              href="https://instagram.com/treetino_corp"
              target="_blank"
              rel="noreferrer"
              aria-label="Treetino on Instagram"
              className="transition hover:text-zinc-950"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689-.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
          </div>
        </div>

        {/* 3-Column Navigation Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 py-10">
          {/* Column 1: Platform Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold tracking-tight text-zinc-950">
              Platform & Investing
            </h4>
            <div className="flex flex-col gap-2.5 text-xs text-zinc-600">
              <a
                href="#kickstarter-campaigns"
                className="hover:text-zinc-950 transition"
              >
                Explore Energy Assets
              </a>
              <a
                href="#bond-explainer"
                className="hover:text-zinc-950 transition"
              >
                How Yield Works (12.8% – 35.0%)
              </a>
              <a href="#portfolio" className="hover:text-zinc-950 transition">
                My Investor Portfolio
              </a>
              <a
                href="https://treetino.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-zinc-950 transition inline-flex items-center gap-1"
              >
                <span>Treetino Main Site</span>
                <span className="text-[10px]">↗</span>
              </a>
            </div>
          </div>

          {/* Column 2: Hardware Infrastructure */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold tracking-tight text-zinc-950">
              Hardware Infrastructure
            </h4>
            <div className="flex flex-col gap-2.5 text-xs text-zinc-600">
              <span className="hover:text-zinc-950 transition cursor-default">
                BESS Přeštice 8.6 MW (Utility Battery)
              </span>
              <span className="hover:text-zinc-950 transition cursor-default">
                Treetino V1 · Smart Energy Tree
              </span>
              <span className="hover:text-zinc-950 transition cursor-default">
                Ultra-Fast EV Charging Plaza
              </span>
              <span className="hover:text-zinc-950 transition cursor-default">
                Wind Park Kryry 4.0 MW (Vestas V80)
              </span>
            </div>
          </div>

          {/* Column 3: Legal & Trust */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold tracking-tight text-zinc-950">
              Legal & Compliance
            </h4>
            <div className="flex flex-col gap-2.5 text-xs text-zinc-600">
              <span className="hover:text-zinc-950 transition cursor-default">
                Token Terms & PPA Conditions
              </span>
              <span className="hover:text-zinc-950 transition cursor-default">
                Investor Privacy Policy
              </span>
              <span className="hover:text-zinc-950 transition cursor-default">
                Non-Disclosure Agreement
              </span>
              <span className="hover:text-zinc-950 transition cursor-default">
                Mediation Agreement
              </span>
            </div>
          </div>
        </div>

        {/* Clean CzechInvest Grant Acknowledgment Banner (Divider Line) */}
        <div className="border-y border-black/10 py-6 my-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <img
                src="/partners/image.png"
                alt="Technology Incubation & CzechInvest"
                className="h-8 w-auto object-contain shrink-0"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <p className="max-w-3xl text-xs leading-relaxed text-zinc-600 font-normal">
                Supported by the Technological incubation project of the
                CzechInvest Agency: Verification of clean energy yield and
                distributed ledger hardware integration under Grant EP-4664750.
              </p>
            </div>
            <a
              href="https://www.czechinvest.org"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#183d89] hover:underline shrink-0"
            >
              <span>Technology Incubation</span>
              <span>→</span>
            </a>
          </div>
        </div>

        {/* Bottom Cards Row (Exact Layout from treetino-website-dev) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {/* Left Card: Signature Blue Company Card */}
          <div className="relative flex flex-col justify-between rounded-3xl bg-gradient-to-br from-[#081838] via-[#102d6b] to-[#183d89] border border-blue-900/30 p-7 text-white shadow-xl overflow-hidden">
            <div className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="relative z-10 flex items-center justify-between">
              <span className="font-mono text-xs font-bold tracking-wider text-blue-300 uppercase">
                Company Information
              </span>
              <span className="font-mono text-xs text-blue-300/80">
                Czech Republic
              </span>
            </div>

            <div className="relative z-10 mt-4 text-white">
              <h3 className="text-2xl font-semibold tracking-tight">
                Treetino Corp s.r.o.
              </h3>
              <p className="mt-2 font-mono text-xs text-white/80">
                IČO: 10800107
              </p>
              <p className="mt-0.5 font-mono text-xs text-white/80">
                DIČ: CZ10800107
              </p>
              <p className="mt-2 text-xs text-white/80 leading-relaxed">
                Bílá - Vlčetín 62, <br />
                463 43 — Bílá - Vlčetín, Czech Republic
              </p>
            </div>

            <div className="relative z-10 mt-6 pt-4 border-t border-white/10 text-xs text-white/70">
              © 2026, Treetino Corp s.r.o. All rights reserved. Clean Energy
              Crowdfunding built for Solana.
            </div>
          </div>

          {/* Right Card: Clean DePIN Network Status Card */}
          <div className="flex flex-col justify-between rounded-3xl border border-black/10 bg-white p-7 text-zinc-950 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold tracking-wider text-[#183d89] uppercase">
                DePIN Network & Settlement
              </span>
              <div className="flex items-center gap-1.5">
                <span
                  className={`h-2 w-2 rounded-full ${
                    protocolStatus?.connected ? 'bg-[#183d89]' : 'bg-blue-400'
                  }`}
                />
                <span className="font-mono text-xs text-zinc-600">
                  {protocolStatus?.connected ? 'Active' : 'Solana Devnet'}
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <h3 className="text-xl font-semibold tracking-tight text-zinc-950">
                Victron Energy + Anchor PDA Escrow
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Each tokenized pool represents verified physical energy
                infrastructure. Live kilowatt-hour telemetry is attested
                on-chain via Victron Cerbo GX controllers, distributing
                proportional dividends in 1:1 stable currency.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-black/10 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-zinc-500">
              <span>Cluster: Solana Devnet</span>
              <span>Program: EEbZ5...BU2n</span>
              <span>Oracle: Cerbo GX SCADA</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
