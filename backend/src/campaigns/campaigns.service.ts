import { Injectable, Logger } from '@nestjs/common';
import { CampaignsRepository } from './campaigns.repository';
import { IndexerService } from '../indexer/indexer.service';
import { FLAGSHIP_FUNDING } from '@treetino/contracts';
import type {
  CampaignDossier,
  CampaignsResponse,
  CreateCampaignDto,
} from '@treetino/contracts';

const DEFAULT_FLAGSHIP_CAMPAIGNS: CampaignDossier[] = [
  {
    id: 'demo-campaign-209689',
    treeAddress: '48e7da86e0d9_victron_offgrid',
    treeId: '1',
    title: 'Wind Park Kryry 4.0 MW (Vestas V80)',
    subtitle: 'Two 2.0 MW Vestas V80 Industrial Turbines',
    category: 'Utility Wind Turbines',
    categoryBadge: 'Wind Turbines · 14.2% APY',
    narrative:
      'Two 2.0 MW Vestas V80 utility-scale wind turbines in Kryry, Czech Republic. Generates clean power fed directly into the 22 kV regional distribution network under a guaranteed 20-year concession agreement with ČEZ Distribuce.',
    story:
      'Located in Kryry (Ústí nad Labem region, Czech Republic), this 4.0 MW wind park consists of two Vestas V80-2.0 MW turbines with 80m hub height and 80m rotor diameter. Supplying electricity directly into the ČEZ 22 kV medium-voltage distribution grid under a guaranteed long-term feed-in tariff (USDC 88.00/MWh), it delivers 14.2% APY with on-site maintenance by certified Czech technicians.',
    investorHighlight:
      '4.0 MW industrial wind power on Solana: 20-year ČEZ concession, 22 kV grid feed-in, and 14.2% APY distributed on-chain.',
    victronSiteId: 209689,
    city: 'Kryry',
    country: 'Czech Republic',
    projectedApy: '14.2%',
    tariffRate:
      'USDC 88.00 / MWh guaranteed grid feed-in tariff (Vestas V80 2× 2.0 MW)',
    offTakerName: 'ČEZ Distribuce a.s. (20-Year Concession)',
    offTakerDescription:
      'High-voltage 22 kV utility distribution network purchasing all metered wind output.',
    supplierName: 'Vestas Wind Systems / EcoPower Solution',
    targetUsdc: '1850000',
    raisedUsdc: '1245000',
    phase: 'funding',
    canBuy: true,
    createdAt: 1728000000000,
    updatedAt: 1728000000000,
  },
  {
    id: 'demo-campaign-219742',
    treeAddress: 'c0619ab27f32_bess_prestice',
    treeId: '2',
    title: 'BESS Přeštice 8.6 MW (WATTINO hBESS)',
    subtitle: '22 kV Grid Frequency Regulation (ČEPS) & Spot Arbitrage',
    category: 'Battery Storage (BESS)',
    categoryBadge: 'BESS 8.6 MW · 35% APY',
    narrative:
      'High-capacity 8.6 MW / 10.0–17.2 MWh battery energy storage system (BESS) directly connected to the 110/22 kV Přeštice substation. Monetizes negative midday solar prices (20% spot arbitrage) and ČEPS transmission grid standby availability fees (15%), pushing total yield to 35.0% APY.',
    story:
      'Located on parcel 472 in Dolni Lukavice with direct 22 kV interconnection into Substation 110/22 kV Přeštice, this utility-scale installation holds 2 signed Connection Agreements (ČEZ Distribuce: Přeštice I 6.2 MW and Chlumčany II 2.4 MW). Powered by European ChinaFree technology WATTINO hBESS with Tier-1 Samsung SDI EU automotive cells (NCM 622), it operates dual revenue streams: ČEPS ancillary services (FCR, aFRR+, aFRR-) yielding standby fees plus automated 15-minute intraday spot power arbitrage on negative midday prices, achieving up to 35% projected APY.',
    investorHighlight:
      'Dual-engine grid battery: 20% spot arbitrage from negative prices + 15% ČEPS standby fee = 35% APY. 2 signed ČEZ connection agreements and 10-year EU warranty.',
    victronSiteId: 219742,
    city: 'Dolni Lukavice (Prestice)',
    country: 'Czech Republic',
    projectedApy: '35.0%',
    tariffRate:
      '2× Signed Connection Agreements (#4122602318 & #4122623464) · ČEPS Standby (15%) + OTE Arbitrage (20%)',
    offTakerName: 'ČEPS a.s. (TSO) & OTE Spot Market (22 kV Grid)',
    offTakerDescription:
      'Dual monetization: regulated grid balancing standby payments plus automated day-ahead and 15-min intraday power arbitrage.',
    supplierName: 'WATTINO / Treetino corp s.r.o. × EcoPower Solution',
    targetUsdc: '108000',
    raisedUsdc: '84200',
    phase: 'funding',
    canBuy: true,
    createdAt: 1728000000000,
    updatedAt: 1728000000000,
  },
  {
    id: 'demo-campaign-374891',
    treeAddress: 'par_evcs_374891_plaza',
    treeId: '3',
    title: 'Solar EV Fast-Charging Hub',
    subtitle: 'Parisian 10-Bay Commercial Mobility Plaza',
    category: 'EV Fast Charging',
    categoryBadge: 'EV Fast Charging',
    narrative:
      'Multi-bay commercial EV charging plaza buffered with solar and storage. Processes high daily energy throughput, laying the foundation for autonomous vehicle micro-billing and native energy stablecoins.',
    story:
      'Located at a high-traffic logistics hub near Paris, this installation deploys 10 high-power Victron EV Charging Stations backed by a 150 kW rooftop canopy and 200 kWh buffer storage. Retail drivers and fleet vehicles charge daily, paying USDC 0.42/kWh plus connection fees directly into the protocol.',
    investorHighlight:
      'High-velocity recurring transaction volume directly from EV fleet operators and retail drivers.',
    victronSiteId: 374891,
    city: 'Paris',
    country: 'France',
    projectedApy: '18.5%',
    tariffRate:
      'USDC 0.42 / kWh delivered + USDC 2.50 session connection fee per charge',
    offTakerName: 'Commercial Fleet Operators & Retail EV Drivers',
    offTakerDescription:
      'Automated point-of-sale micro-transactions across 10 commercial charging bays.',
    supplierName: 'ElectroCharge France SAS',
    targetUsdc: '100000',
    raisedUsdc: '91500',
    phase: 'funding',
    canBuy: true,
    createdAt: 1728000000000,
    updatedAt: 1728000000000,
  },
  {
    id: 'demo-campaign-100001',
    treeAddress: 'treetino_v1_mkovo_prague',
    treeId: '4',
    title: 'Treetino V1 · Smart Energy Tree',
    subtitle: 'Biomimetic Solar + Wind Dual-Modality Microgrid',
    category: 'Biomimetic Tree',
    categoryBadge: 'Solar + Wind Tree',
    narrative:
      'Flagship 12m vertical micro-power plant combining 300 heliotropic solar leaves and 12 ducted VAWT wind turbines on a 1.2 m² footprint. Powers industrial partner MKovo s.r.o. with clean baseload power, streaming metered repayments directly to tokenholders.',
    story:
      'Traditional ground-mounted solar requires hundreds of square meters of land. Treetino V1 integrates 300 astronomical sun-tracking photovoltaic leaves with 12 ducted vertical-axis wind turbines into a sculptural 12m smart tree. Installed directly at industrial partner MKovo s.r.o. in the Czech Republic, it provides 24/7 day-and-night power for precision CNC manufacturing under a 15-year corporate PPA.',
    investorHighlight:
      'Dual-modality 45 kW generation on 1.2 m² ground footprint replacing 300 m² of rooftop solar with 24/7 day-and-night output.',
    victronSiteId: 100001,
    city: 'Prague / Central Bohemia',
    country: 'Czech Republic',
    projectedApy: '12.8%',
    tariffRate: 'USDC 0.32 / kWh metered corporate PPA (MKovo s.r.o.)',
    offTakerName: 'MKovo s.r.o. (Precision Manufacturing)',
    offTakerDescription:
      'Long-term corporate power purchase agreement indexed to European industrial tariffs.',
    supplierName: 'Treetino CleanTech s.r.o.',
    targetUsdc: '235000',
    raisedUsdc: '192700',
    phase: 'funding',
    canBuy: true,
    createdAt: 1728000000000,
    updatedAt: 1728000000000,
  },
];

@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name);

  constructor(
    private readonly repository: CampaignsRepository,
    private readonly indexer: IndexerService,
  ) {}

  async listCampaigns(): Promise<CampaignsResponse> {
    const dbCampaigns = await this.repository.listAll();
    const indexedData = await this.indexer.listTrees(undefined, 1000, 0);
    const treeMap = new Map(indexedData.trees.map((t) => [t.address, t]));

    // Start with default flagship campaigns
    const result: CampaignDossier[] = DEFAULT_FLAGSHIP_CAMPAIGNS.map((def) => {
      const funding = FLAGSHIP_FUNDING[def.victronSiteId!];
      const bound = {
        ...def,
        treeAddress: funding.address,
        treeId: funding.treeId,
      };
      const matched = treeMap.get(funding.address);
      if (matched) {
        return {
          ...bound,
          targetUsdc: (Number(BigInt(matched.target)) / 1e6).toString(),
          raisedUsdc: (Number(BigInt(matched.raised)) / 1e6).toString(),
          phase: matched.phase,
          canBuy: matched.canBuy,
          treeId: matched.treeId,
        };
      }
      return { ...bound, raisedUsdc: '0', canBuy: false };
    });

    const defaultIds = new Set(DEFAULT_FLAGSHIP_CAMPAIGNS.map((d) => d.id));
    const defaultAddresses = new Set(
      DEFAULT_FLAGSHIP_CAMPAIGNS.map((d) => d.treeAddress),
    );
    const defaultSiteIds = new Set(
      DEFAULT_FLAGSHIP_CAMPAIGNS.map((d) => d.victronSiteId).filter(Boolean),
    );

    // Add or merge any DB-stored custom campaigns (skipping stale default campaign seeds)
    for (const c of dbCampaigns) {
      if (
        defaultIds.has(c.id) ||
        defaultAddresses.has(c.treeAddress) ||
        (c.victronSiteId && defaultSiteIds.has(c.victronSiteId))
      ) {
        continue;
      }

      const matched = treeMap.get(c.treeAddress);
      const existingIdx = result.findIndex(
        (r) =>
          r.treeAddress === c.treeAddress ||
          (c.victronSiteId && r.victronSiteId === c.victronSiteId),
      );

      const dossier: CampaignDossier = {
        id: c.id,
        treeAddress: c.treeAddress,
        treeId: c.treeId ?? (matched ? matched.treeId : '1'),
        title: c.title,
        subtitle: c.subtitle ?? undefined,
        category: c.category,
        categoryBadge: c.categoryBadge,
        narrative: c.narrative,
        story: c.story ?? undefined,
        investorHighlight: c.investorHighlight ?? undefined,
        victronSiteId: c.victronSiteId ?? undefined,
        city: c.city,
        country: c.country,
        projectedApy: c.projectedApy,
        tariffRate: c.tariffRate,
        offTakerName: c.offTakerName,
        offTakerDescription: c.offTakerDescription ?? undefined,
        supplierName: c.supplierName ?? undefined,
        targetUsdc: matched
          ? (Number(BigInt(matched.target)) / 1e6).toString()
          : c.targetUsdc,
        raisedUsdc: matched
          ? (Number(BigInt(matched.raised)) / 1e6).toString()
          : '0',
        phase: matched?.phase ?? 'funding',
        canBuy: matched?.canBuy ?? true,
        createdAt: Number(c.createdAt),
        updatedAt: Number(c.updatedAt),
      };

      if (existingIdx >= 0) {
        result[existingIdx] = dossier;
      } else {
        result.push(dossier);
      }
    }

    return { campaigns: result, total: result.length };
  }

  async getCampaign(
    idOrAddressOrSite: string,
  ): Promise<CampaignDossier | null> {
    const list = await this.listCampaigns();
    const siteNum = parseInt(idOrAddressOrSite, 10);

    const found = list.campaigns.find(
      (c) =>
        c.id === idOrAddressOrSite ||
        c.treeAddress === idOrAddressOrSite ||
        (!isNaN(siteNum) && c.victronSiteId === siteNum),
    );

    return found ?? null;
  }

  async createCampaign(dto: CreateCampaignDto): Promise<CampaignDossier> {
    const now = Date.now();
    const row = await this.repository.upsert({
      treeAddress: dto.treeAddress,
      treeId: dto.treeId ?? null,
      title: dto.title,
      subtitle: dto.subtitle ?? null,
      category: dto.category,
      categoryBadge: dto.categoryBadge,
      narrative: dto.narrative,
      story: dto.story ?? null,
      investorHighlight: dto.investorHighlight ?? null,
      victronSiteId: dto.victronSiteId ?? null,
      city: dto.city,
      country: dto.country,
      projectedApy: dto.projectedApy,
      tariffRate: dto.tariffRate,
      offTakerName: dto.offTakerName,
      offTakerDescription: dto.offTakerDescription ?? null,
      supplierName: dto.supplierName ?? null,
      targetUsdc: dto.targetUsdc,
      createdAt: now,
      updatedAt: now,
    });

    return {
      id: row.id,
      treeAddress: row.treeAddress,
      treeId: row.treeId ?? '1',
      title: row.title,
      subtitle: row.subtitle ?? undefined,
      category: row.category,
      categoryBadge: row.categoryBadge,
      narrative: row.narrative,
      story: row.story ?? undefined,
      investorHighlight: row.investorHighlight ?? undefined,
      victronSiteId: row.victronSiteId ?? undefined,
      city: row.city,
      country: row.country,
      projectedApy: row.projectedApy,
      tariffRate: row.tariffRate,
      offTakerName: row.offTakerName,
      offTakerDescription: row.offTakerDescription ?? undefined,
      supplierName: row.supplierName ?? undefined,
      targetUsdc: row.targetUsdc,
      createdAt: Number(row.createdAt),
      updatedAt: Number(row.updatedAt),
    };
  }
}
