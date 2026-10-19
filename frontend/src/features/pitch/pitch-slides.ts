export interface PitchSlide {
  id: string;
  number: number;
  timeRange: string;
  category:
    | 'hook'
    | 'solana'
    | 'hardware'
    | 'victron'
    | 'defi'
    | 'financials'
    | 'vision';
  title: string;
  subtitle: string;
  script: string;
  presenterNotes: string[];
  keyTakeaway: string;
  revealSteps?: Array<{
    step: number;
    label: string;
    description: string;
    highlightText?: string;
  }>;
}

export const PITCH_SLIDES: PitchSlide[] = [
  {
    id: 'market-gap',
    number: 1,
    timeRange: '0:00 - 0:25',
    category: 'hook',
    title: 'The Energy Monopoly',
    subtitle: 'USDC 3 Trillion Injected, 0% Public Ownership',
    script:
      'Three trillion dollars.\n\n(Pause. Make direct eye contact.)\n\nThat’s how much capital was poured into global energy last year alone. That is larger than the entire market cap of crypto.\n\nYet, while any teenager with a phone can buy ten dollars of Bitcoin, ordinary people are completely shut out from the energy boom. We don’t get to profit from the grid. We only get the bill.\n\nWhat if we flipped that script? At Treetino, we’re turning everyday consumers from passive bill-payers into direct, profitable energy owners.',
    presenterNotes: [
      'Command the room: Deliver "Three trillion dollars" and hold eye contact for 2 full seconds.',
      'Contrast: USDC 3T invested in energy vs entire crypto market cap (USDC 2.6T).',
      'Visceral pain point: Teenagers can buy USDC 10 BTC on a phone, but ordinary people only get electricity bills.',
      'The Shift: Introduce Treetino as the inversion of passive bill-payers into profitable energy owners.',
    ],
    keyTakeaway:
      'The USDC 3T energy transition is closed to the public. Treetino democratizes physical energy ownership.',
    revealSteps: [
      {
        step: 0,
        label: 'USDC 3,000B',
        description:
          'Global energy investment in 2025 alone. Exceeds total crypto market cap.',
        highlightText:
          'Invested in 2025 alone. Larger than the entire market cap of crypto.',
      },
      {
        step: 1,
        label: '0%',
        description:
          'Ordinary people shut out from grid revenue. We only receive bills.',
        highlightText:
          'Any teenager can buy USDC 10 Bitcoin. Everyday people get 0% grid access.',
      },
      {
        step: 2,
        label: 'Treetino',
        description:
          'Turning everyday consumers from passive bill-payers into direct, profitable energy owners.',
        highlightText: 'What if we flipped that script?',
      },
    ],
  },
  {
    id: 'why-solana',
    number: 2,
    timeRange: '0:25 - 0:50',
    category: 'solana',
    title: 'Why Solana: Built for Real Grids',
    subtitle:
      'Sub-Second Edge Telemetry, Micro-Dividends, and Non-Custodial PDA Architecture',
    script:
      'To tokenize the electric grid, you need extreme throughput.\n\n(Hold up a phone)\n\nEthereum cannot do this. Layer-twos cannot do this. We chose Solana because the energy grid moves in milliseconds, not minutes.\n\nWith four-hundred-millisecond slot times, Solana syncs directly with our industrial edge controllers for millisecond grid stabilization.\n\nWith gas fees under a tenth of a cent, we can stream micro-dividends continuously: when someone earns fifty cents of clean power yield, zero percent is eaten by transaction fees.\n\nAnd through non-custodial Program Derived Addresses under Program ID EEbZ5DVTQ..., capital is locked in trustless escrow until milestones hit—at which point the mint authority is burned forever on-chain. Zero inflation. Zero dilution.',
    presenterNotes: [
      'Hold up phone: "Ethereum cannot do this. Layer-twos cannot do this."',
      'Cite physical grid constraint: 400ms Solana slot times match millisecond grid frequency regulation.',
      'Highlight micro-dividends: Gas fees at USDC 0.0002 allow continuous streaming of small yields without fee drag.',
      'Security proof: Non-custodial PDA escrow and mint authority burned forever on-chain (Program EEbZ5DVTQ...).',
    ],
    keyTakeaway:
      'Solana is the only blockchain with the sub-second speed and sub-cent fees required to stream micro-dividends from live grid telemetry.',
  },
  {
    id: 'hardware-gateway',
    number: 3,
    timeRange: '0:50 - 1:15',
    category: 'hardware',
    title: 'Treetino V1',
    subtitle:
      'Flagship Sculptural Kinetic Hardware for Clean Energy RWA Tokenization',
    script:
      'And here is our physical anchor:\n\n(Gesture firmly to the screen)\n\nWe don’t do vaporware. We build heavy steel and industrial silicon.\n\nThis is Treetino V1—our patented, biomimetic solar and micro-wind tree generating forty-nine kilowatts of clean power.\n\nMKovo is our first commercial client, with five contracted units delivering between now and Q2 2027.\n\nTreetino V1 is our flagship physical branding for the clean energy RWA protocol. It proves that real-world kinetic hardware can be tokenized, tracked, and owned directly on Solana.',
    presenterNotes: [
      'Contrast sharply with typical crypto projects: "We don’t do vaporware. We build heavy steel and industrial silicon."',
      'Point to Treetino V1: 49 kW patented micro-wind and bifacial solar kinetic tree.',
      'Explain positioning: Treetino V1 is our flagship physical branding for the clean energy RWA tokenization protocol.',
      'Highlight commercial traction: MKovo is our first client with 5 contracted units through Q2 2027.',
    ],
    keyTakeaway:
      'Treetino V1 generates 49 kW of clean power as the physical flagship for our on-chain clean energy RWA protocol.',
  },
  {
    id: 'financial-engine',
    number: 4,
    timeRange: '1:15 - 1:40',
    category: 'financials',
    title: 'Utility Battery Storage',
    subtitle:
      'Europe’s Volatility Engine: <3Y Payback, 25%–35% IRR, USDC 1M–USDC 1.5M EBITDA',
    script:
      'However a design energy producing tree is not the most interesting financial product in the market. But we can use the experience learned from it in some of the most lucrative business opportunities available in Europe right now.\n\n(Lean in, speak with fast authority)\n\nUtility battery storage is the single most lucrative cash-flow engine in European infrastructure.\n\nWhy? Renewable volatility has broken the grid. Midday solar drives power prices into negative territory, followed by extreme evening price spikes.\n\nBatteries capture dual revenue streams: grid operators like ČEPS pay 24/7 capacity fees just for standby frequency balancing, and we get paid to charge when power prices are negative, dumping power at peak spreads.\n\nThe numbers are unmatched:\nAn 8 to 10 megawatt battery generates over one to one-point-five million USDC in clean net EBITDA every year.\nThe capital payback? Two-point-nine-five years.\nProject IRR is over thirty percent.\n\nOur flagship site—BESS Přeštice—has already secured its 8.6 megawatt interconnection with ČEZ Distribuce. Treetino tokenizes these institutional cash flows so anyone can co-own this yield on Solana.',
    presenterNotes: [
      'Deliver exact opener: "However a design energy producing tree is not the most interesting financial product in the market. But we can use the experience learned from it in some of the most lucrative business opportunities available in Europe right now."',
      'Explain the macro opportunity: Renewable volatility creates negative power prices midday and massive evening spreads.',
      'Highlight dual revenue streams: 24/7 grid balancing standby fees (ČEPS) + negative spot arbitrage.',
      'Drop the hard numbers fast: USDC 1.0M–USDC 1.5M net annual EBITDA, <3 year payback, 25%–35% project IRR.',
      'Anchor to pipeline: Signed 8.6 MW ČEZ interconnection in Přeštice.',
    ],
    keyTakeaway:
      'Utility battery storage delivers institutional-grade USDC 1.0M–USDC 1.5M EBITDA with 2.95y payback and 25%–35% IRR.',
  },
  {
    id: 'defi-financial-engine',
    number: 5,
    timeRange: '1:40 - 2:05',
    category: 'defi',
    title: 'Multi-Layer Financial Engine',
    subtitle:
      'Base Clean Energy Yield Multiplied by Marinade Collateral Staking and Kamino Auto-Compounding',
    script:
      'Nine to twenty-one percent.\n\n(Point to the Institutional Yield card)\n\nThat number is the base yield from physical kilowatt sales and grid balancing alone.\n\n(Lean in, lower voice slightly)\n\nNow look at the financial tools we built on top of it.\n\nFirst, zero-capex host adoption with Marinade SOL collateral. Commercial hosts—like hotels or factories—get our trees or batteries installed for free, eliminating all sales friction. But to protect our investors, the host must post collateral in staked Marinade SOL. They buy the energy daily to repay investors, while their staked SOL earns native yield. If they ever default, the collateral covers it.\n\nSecond, automated yield compounding through Kamino and RockawayX. The USDC dividends generated from energy sales don’t sit idle. They are automatically routed into institutional Kamino liquidity pools, compounding a second layer of yield on top of the physical energy returns.\n\nReal kilowatt cash flow, secured by staked collateral, multiplied by institutional DeFi.',
    presenterNotes: [
      'Point to the 9%–21% card: Emphasize that this is base yield from real energy sales alone.',
      'Explain Marinade SOL host collateral: Host gets infrastructure for free (zero Capex), but stakes collateral in Marinade SOL.',
      'De-risked structure: Host buys energy daily to repay investors; collateral protects investor capital against default.',
      'Kamino / RockawayX yield multiplier: USDC dividends auto-compound in Kamino liquidity pools for additional yield.',
      'Punchline: Physical kilowatt cash flows multiplied by institutional Solana DeFi.',
    ],
    keyTakeaway:
      'Base 9%–21% clean energy yields are secured by host Marinade SOL collateral and compounded via Kamino USDC pools.',
  },
  {
    id: 'victron-integration',
    number: 6,
    timeRange: '2:05 - 2:35',
    category: 'victron',
    title: 'Live Victron SCADA Integration',
    subtitle:
      'Industrial Cerbo-S GX Gateway Running Venus OS D-Bus and Cryptographic On-Chain Telemetry',
    script:
      'How does physical hardware actually talk to Web3?\n\n(Point to the central node on the diagram)\n\nLook at this topology—this is our live operational architecture running across both our trees and our utility batteries.\n\nAt the edge, we deploy industrial Victron Cerbo-S GX controllers running Venus OS on an internal D-Bus. Over Modbus TCP, CAN bus, and RS-485, the controller polls inverters and battery racks in real time.\n\nWhen the national grid operator ČEPS demands frequency containment, our automated system responds in under ten milliseconds.\n\nEvery single day, the Victron gateway cryptographically signs ninety-six telemetry snapshots and commits them directly to Solana. Every kilowatt-hour you see on your screen is physically measured, hardware-signed, and mathematically immutable.',
    presenterNotes: [
      'Direct attention to the interactive circuit graph on screen.',
      'Explain the physical edge stack: Cerbo-S GX hardware running Venus OS on internal D-Bus.',
      'Industrial protocols: Modbus TCP, CAN bus, and RS-485 communicating across inverters and battery racks.',
      'Highlight grid-speed execution: Under 10 ms response time for ČEPS FCR and aFRR.',
      'Cryptographic trust: 96 signed hardware readings per day broadcast directly to Solana.',
    ],
    keyTakeaway:
      'Industrial Victron Cerbo hardware running Venus OS bridges heavy grid assets directly to Solana with cryptographic signatures.',
  },
  {
    id: 'vision-round',
    number: 7,
    timeRange: '2:35 - 3:00',
    category: 'vision',
    title: 'Unlocking the USDC 3 Trillion Grid',
    subtitle:
      'Built for Solana Hackathon by Jakub Lustyk (CTO, Treetino) & Marian-Daniel Rolník (Cleevio)',
    script:
      'We started this pitch with three trillion dollars.\n\n(Pause. Direct eye contact)\n\nThat is the massive global energy boom that everyday people have been shut out from for a century.\n\nOver this hackathon, Marian-Daniel Rolník from Cleevio and I built the protocol that flips that script.\n\nWe proved that physical clean energy hardware can cryptographically sign its own telemetry. We proved that non-custodial Solana smart contracts can stream micro-dividends at scale. And we proved that multi-layered DeFi tools—combining physical power yields, Marinade staking, and Kamino earning pools—can make energy ownership liquid and accessible to anyone with ten dollars.\n\nWe only ever had to pay for energy.\n\nIt’s time to earn from the global energy transformation.\n\nFollow our journey on X at @treetino_corp. Thank you.',
    presenterNotes: [
      'Loop back to the opening hook: "We started this pitch with three trillion dollars."',
      'State hackathon achievements: Real physical hardware bridged with Solana smart contracts.',
      'Highlight technical trifecta: Hardware SCADA oracle, non-custodial PDA micro-dividends, multi-layer DeFi yields.',
      'Team shoutout: Built during the hackathon by Jakub Lustyk (CTO, Treetino) and Marian-Daniel Rolník (Cleevio).',
      'Deliver the final punchlines with calm, unshakeable energy: "We only ever had to pay for energy. It’s time to earn from the global energy transformation."',
      'Call to Action: Direct judges and audience to follow @treetino_corp on X (https://x.com/treetino_corp).',
    ],
    keyTakeaway:
      'Treetino bridges physical clean energy infrastructure directly into liquid Solana DeFi, turning passive bill-payers into direct energy owners.',
  },
];
