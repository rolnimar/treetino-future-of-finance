export function getCampaignCoverImage(key: string): string {
  switch (key) {
    case 'treetino-v1':
      return '/campaigns/treetino-v1.jpg';
    case 'ess':
      return '/campaigns/ess.jpg';
    case 'ev':
      return '/campaigns/ev.jpg';
    case 'offgrid':
    case 'wind':
      return '/campaigns/wind.jpg';
    default:
      return '/campaigns/treetino-v1.jpg';
  }
}

export const CAMPAIGN_METADATA: Record<
  string,
  {
    creator: string;
    daysLeft: number;
    backers: number;
    tagline: string;
    hardwareType: string;
  }
> = {
  'treetino-v1': {
    creator: 'MKovo Engineering',
    daysLeft: 14,
    backers: 48,
    tagline: '12m Sculptural solar & wind tree feeding metal fabrication plant',
    hardwareType: 'Dual-Modality Microgrid',
  },
  ess: {
    creator: 'WATTINO × ČEZ Distribuce',
    daysLeft: 21,
    backers: 46,
    tagline:
      '8.6 MW BESS capturing negative solar prices (20%) + ČEPS standby fees (15%)',
    hardwareType: 'Battery Storage (35% APY)',
  },
  ev: {
    creator: 'ChargeVolt Paris',
    daysLeft: 9,
    backers: 82,
    tagline:
      'Solar canopy & DC fast chargers with native energy stablecoin settlement',
    hardwareType: 'Fleet Charging Plaza',
  },
  offgrid: {
    creator: 'ČEZ Concession / Vestas',
    daysLeft: 18,
    backers: 64,
    tagline:
      'Two 2.0 MW Vestas V80 turbines tokenizing industrial-scale wind power on Solana',
    hardwareType: 'Utility Wind Turbines (14.2% APY)',
  },
  wind: {
    creator: 'ČEZ Concession / Vestas',
    daysLeft: 18,
    backers: 64,
    tagline:
      'Two 2.0 MW Vestas V80 turbines tokenizing industrial-scale wind power on Solana',
    hardwareType: 'Utility Wind Turbines (14.2% APY)',
  },
};
