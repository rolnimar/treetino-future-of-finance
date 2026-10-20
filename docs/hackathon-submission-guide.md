# The FinTechers Hackathon 2026 — Submission & Live Pitch Runbook

> **Team:** Treetino (Jakub Lustyk, Marian-Daniel Rolník)
> **Track:** Track 2 · Stablecoins & new financial infrastructure (+ Track 4 · Onboarding, KYC & trust)
> **Code Freeze (Circle Repo Post):** Tuesday 20 October 2026 at **13:30**
> **Pitch Deck Attachment Deadline:** Tuesday 20 October 2026 at **14:30** (Pitch clinic with Cedric Maloux: 13:30–14:30)
> **Live Pitches:** Tuesday 20 October 2026 at **15:00–17:00** (3 min pitch + 2 min jury Q&A, on-site presenters only)

---

## 1. Ready-to-Paste Circle Submission Post (Before 13:30)

Post **one message per team** in the Circle submissions thread before **13:30**:

```markdown
**1. Team & Track / Challenge**
- **Team:** Treetino (Jakub Lustyk, Marian-Daniel Rolník)
- **Track:** Track 2 · Stablecoins & new financial infrastructure (+ Track 4 · Onboarding, KYC & trust)

**2. Repository Link**
- **GitHub:** https://github.com/rolnimar/treetino-future-of-finance
- **Hackathon Kickoff Tag:** `hackathon-start` (commit `988ff79`)
- **README Delta Section:** https://github.com/rolnimar/treetino-future-of-finance#built-during-the-hackathon

**3. What we built during the hackathon (`hackathon-start..HEAD`)**
Building on our pre-existing Solana Anchor smart contract and Victron SCADA UI (`hackathon-start`), during the hackathon we built:
1. **Authoritative Device, Investment & Payment Ledger (`0007_device_ledger.sql`, `backend/src/devices/`)**: Serialized PostgreSQL ledger for fractional device investments, demo wallets, charging sessions, exact integer micro-USDC revenue waterfalls, and idempotent yield claims.
2. **Portrait EV Charging Kiosk & Live Yield Streaming (`/#charge/374891`)**: One-tap card/USDC EV charging terminal with 120x server-side meter simulation and sub-second (`0.8s`) real-time payout streaming to investor portfolios.
3. **MoonPay Sandbox Card Onboarding & Reconciler (`backend/src/payments/`)**: Embedded MoonPay sandbox card checkout and background status/fee reconciler for both fractional hardware investments and EV driver bill settlement.

**4. Pitch Deck**
- Attached: `Treetino_The_FinTechers_Pitch_Deck.pptx` (built on the official FinTechers pitch template; interactive web deck also live in the app).
```

---

## 2. Your 3-Minute Live Pitch Script & Timing (Strict Timer)

Per the Hackers' Guide (`Submission and judging › Your 3-minute pitch`):
- **0:00–0:30 — Problem:** Who has it, how much it costs them, who pays for a fix.
- **0:30–0:40 — What existed before vs. built here:** One line on what existed before, then what you built during the hackathon.
- **0:40–2:20 — Live Demo:** One end-to-end flow on the real prototype.
- **2:20–2:50 — Business Case:** Customer, business model, why now, why not a GPT wrapper.
- **2:50–3:00 — Ask:** What you need next (pilot, data, partner).

### Minute-by-Minute Breakdown

* **0:00 – 0:30 | Problem**
  > "Three trillion dollars was poured into global energy infrastructure last year—larger than the entire crypto market cap. Midday negative solar prices and evening grid spikes make utility batteries and EV fast-charging plazas 18% to 35% IRR cash machines. Yet everyday retail investors and SMEs are completely locked out—we only ever get the electricity bill. Meanwhile, existing on-chain RWA protocols fail because normal drivers and investors want to tap a credit card, not fight seed phrases and gas fees."

* **0:30 – 0:40 | Transparency: What Existed Before vs. Built Here**
  > "Before Monday's kickoff—marked at our `hackathon-start` tag—we had our Solana Anchor smart contract, Victron SCADA topology visualizer, and Czech OTE/ČNB spot-price billing engine. During these 30 hours, we built the complete fintech transaction engine: an authoritative PostgreSQL device and payment ledger, MoonPay sandbox card onboarding, our fullscreen portrait EV charging kiosk, and sub-second micro-USDC dividend distribution."

* **0:40 – 2:20 | Live End-to-End Demo (1 min 40 sec)**
  1. **Step 1 — Fractional Investment (Card or USDC):** Open the Treetino marketplace, select the **Solar EV Fast-Charging Hub (`#374891`)**, and back the project using either **Direct USDC** or **Card via MoonPay sandbox / Instant Card Checkout**. Show the position recorded in the Investor Portfolio.
  2. **Step 2 — Portrait EV Charging Kiosk (`/#charge/374891`):** Open `/#charge/374891` side-by-side. With a single tap on the Apple-Pay-style card button, the kiosk authenticates the terminal, runs the 120x server-side kWh meter to target, and settles the bill via card/USDC.
  3. **Step 3 — Instant Micro-USDC Yield & Claim:** Watch the Investor Portfolio update in under 0.8 seconds as 100% of the charging revenue is distributed proportionally in exact integer micro-USDC across contributors. Click **Claim Yield** to transfer the earned dividend straight into the investor's wallet balance.

* **2:20 – 2:50 | Business Case & Why Not a GPT Wrapper**
  > "Why now and why us? We don't build vaporware or thin GPT wrappers—probabilistic text generation cannot custody capital, sign hardware kWh telemetry, or conserve integer micro-USDC across concurrent transactions. Our Flagship Treetino V1 smart tree has 5 commercial units contracted with MKovo, and our 8.6 MW BESS Přeštice utility battery has secured its ČEZ Distribuce interconnection ($1M–$1.5M annual EBITDA, 2.95-year payback). Treetino charges a 1.5% origination fee and a 10% performance fee on net energy yield, while hosts get zero-capex installations secured by staked Marinade SOL collateral."

* **2:50 – 3:00 | The Ask**
  > "We are looking for European banking and MiCA regulatory partners, commercial EV/BESS pilot hosts, and seed co-investors to unlock the 3-trillion-dollar grid. We only ever had to pay for energy—now it's time to earn from it."

---

## 3. Alignment with Judging Criteria (100%)

| Criterion | Weight | How Treetino Scores 5/5 |
| :--- | :--- | :--- |
| **Impact & Relevance** | **25%** | Solves retail/SME exclusion from high-yield clean energy infrastructure (14–35% IRR) and bridges frictionless card payments (Track 4) with instant programmable stablecoin settlement (Track 2). |
| **Technical Execution** | **25%** | End-to-end working prototype: Solana Anchor Rust contract, NestJS + Drizzle PostgreSQL ACID ledger, MoonPay card checkout reconciler, 120x EV meter worker, and sub-second cross-tab UI sync. |
| **Innovation** | **20%** | Combines cryptographic hardware telemetry (Victron Cerbo GX + OTE/ČNB 15-min spot curves), zero-capex Marinade mSOL host collateral, Kamino yield compounding, and 1-tap card-to-micro-USDC waterfalls. |
| **Responsible AI & Compliance** | **15%** | Wallet-bound challenge-signature auth, idempotent request keys preventing double-spends, MiCA-aligned USDC/EURTree reserve transparency, and zero real PII (sandboxed MoonPay & synthetic personas). |
| **Business Viability & Pitch** | **15%** | Real commercial traction: 5 contracted Treetino V1 trees (MKovo) + 8.6 MW ČEZ interconnection at BESS Přeštice ($1.0M–$1.5M annual net EBITDA, <3y payback). |
