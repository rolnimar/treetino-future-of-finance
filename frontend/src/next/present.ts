/**
 * Presentation layer for the redesigned app.
 *
 * The API payloads carry marketing-heavy titles ("BESS Přeštice 8.6 MW (WATTINO hBESS)")
 * and inconsistent badges. The UI should speak in short, plain names that match the
 * /web3 landing page wallet ("BESS Přeštice", "Kryry wind farm", "EV hub Paris-Nord").
 */
import type { VictronDemoItem } from '../features/victron/victron-types';

export type AssetKey = VictronDemoItem['key'];

export interface AssetCopy {
  name: string;
  kind: string;
  place: string;
  capacity: string;
  image: string;
  /** One sentence. No jargon. */
  summary: string;
  filter: 'storage' | 'wind' | 'mobility' | 'trees';
  operator: string;
  closesInDays: number;
  backers: number;
  facts: Array<{ label: string; value: string }>;
}

export const ASSET_COPY: Record<AssetKey, AssetCopy> = {
  ess: {
    name: 'BESS Přeštice',
    kind: 'Grid battery',
    place: 'Přeštice, Czech Republic',
    capacity: '8.6 MW · 17.2 MWh',
    image: '/campaigns/ess.jpg',
    summary:
      'A utility battery on the Přeštice substation. It charges when solar floods the grid with cheap power, sells it back at the evening peak, and is paid by ČEPS to stand by for grid balancing.',
    filter: 'storage',
    operator: 'WATTINO × ČEZ Distribuce',
    closesInDays: 21,
    backers: 46,
    facts: [
      { label: 'Grid connection', value: '8.6 MW' },
      { label: 'Storage', value: '10–17.2 MWh' },
      { label: 'Payback', value: '3–4.2 years' },
      { label: 'Warranty', value: '10 years' },
    ],
  },
  'treetino-v1': {
    name: 'Treetino V1',
    kind: 'Solar + wind tree',
    place: 'Central Bohemia, Czech Republic',
    capacity: '45 kW peak',
    image: '/campaigns/treetino-v1.jpg',
    summary:
      'A 12-metre energy tree with 300 solar leaves and 12 wind turbines on 1.2 m² of ground. It powers the MKovo factory under a 15-year contract, day and night.',
    filter: 'trees',
    operator: 'MKovo Engineering',
    closesInDays: 14,
    backers: 48,
    facts: [
      { label: 'Peak output', value: '45 kW' },
      { label: 'Footprint', value: '1.2 m²' },
      { label: 'Contract', value: 'USDC 0.32 / kWh' },
      { label: 'Payback', value: '5.2–7.1 years' },
    ],
  },
  ev: {
    name: 'EV hub Paris-Nord',
    kind: 'EV fast charging',
    place: 'Paris, France',
    capacity: '10 bays · 350 kW',
    image: '/campaigns/ev.jpg',
    summary:
      'Ten fast-charging bays under a 150 kWp solar canopy with a battery buffer. Fleet operators and drivers pay per kWh and per session.',
    filter: 'mobility',
    operator: 'ChargeVolt Paris',
    closesInDays: 9,
    backers: 82,
    facts: [
      { label: 'Peak power', value: '350 kW' },
      { label: 'Solar + storage', value: '150 kWp / 200 kWh' },
      { label: 'Tariff', value: 'USDC 0.42 / kWh' },
      { label: 'Payback', value: '3.9–5.4 years' },
    ],
  },
  offgrid: {
    name: 'Kryry wind farm',
    kind: 'Wind',
    place: 'Kryry, Czech Republic',
    capacity: '2 × Vestas V80 · 4 MW',
    image: '/campaigns/wind.jpg',
    summary:
      'Two Vestas V80 turbines in the Kryry wind corridor feeding the regional 22 kV grid under a 20-year concession at a guaranteed feed-in tariff.',
    filter: 'wind',
    operator: 'EcoPower Solution',
    closesInDays: 18,
    backers: 64,
    facts: [
      { label: 'Capacity', value: '4.0 MW' },
      { label: 'Feed-in tariff', value: 'USDC 95 / MWh' },
      { label: 'Concession', value: '20 years' },
      { label: 'Availability', value: '> 98%' },
    ],
  },
};

export const FILTERS: Array<{
  id: 'all' | AssetCopy['filter'];
  label: string;
}> = [
  { id: 'all', label: 'All' },
  { id: 'storage', label: 'Storage' },
  { id: 'wind', label: 'Wind' },
  { id: 'mobility', label: 'Mobility' },
  { id: 'trees', label: 'Energy trees' },
];

export function copyFor(demo: VictronDemoItem): AssetCopy {
  return ASSET_COPY[demo.key];
}

// ---------------------------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------------------------

export function usdc(value: number, decimals: 0 | 2 = 0): string {
  return `USDC ${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)}`;
}

export function pct(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function power(watts: number): string {
  const abs = Math.abs(watts);
  if (abs >= 1_000_000) return `${(watts / 1_000_000).toFixed(1)} MW`;
  if (abs >= 1000) return `${(watts / 1000).toFixed(1)} kW`;
  return `${Math.round(watts)} W`;
}

export function energy(kwh: number): string {
  if (Math.abs(kwh) >= 1000) return `${(kwh / 1000).toFixed(1)} MWh`;
  return `${kwh.toFixed(1)} kWh`;
}

export function shortAddress(address: string): string {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

/** Strips the "Revenue Pillar 1:" prefixes and parentheticals the dossiers ship with. */
export function cleanLabel(raw: string): string {
  return raw
    .replace(/^Revenue Pillar \d+:\s*/i, '')
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .trim();
}
