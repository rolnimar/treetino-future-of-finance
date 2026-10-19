import {
  Injectable,
  NotFoundException,
  type OnModuleInit,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { createHash } from 'node:crypto';
import { FLAGSHIP_FUNDING } from '@treetino/contracts';
import { DatabaseService } from '../database/database.service';
import { campaigns, devices } from '../database/schema';
import { DEFAULT_FLAGSHIP_CAMPAIGNS } from '../campaigns/campaigns.service';
import { VictronService } from '../victron/victron.service';
import type { VictronDemoItemDto } from '../victron/victron.dto';

@Injectable()
export class DeviceCatalogService implements OnModuleInit {
  constructor(
    private readonly database: DatabaseService,
    private readonly victron: VictronService,
  ) {}
  async onModuleInit() {
    await this.seed();
  }
  async seed() {
    const templates = this.victron.getCatalogSeeds();
    const custom = await this.database.db.select().from(campaigns);
    const defaultSites = new Set(
      DEFAULT_FLAGSHIP_CAMPAIGNS.map((c) => c.victronSiteId),
    );
    const sources = [
      ...DEFAULT_FLAGSHIP_CAMPAIGNS.map((c) => ({
        ...c,
        treeAddress: FLAGSHIP_FUNDING[c.victronSiteId!]!.address,
      })),
      ...custom.filter((c) => !defaultSites.has(c.victronSiteId ?? undefined)),
    ];
    for (const c of sources) {
      const siteId =
        c.victronSiteId ??
        500000 +
          (createHash('sha256').update(c.id).digest().readUInt32LE(0) %
            1_000_000_000);
      if (!Number.isSafeInteger(siteId) || siteId < 1 || siteId > 2147483647)
        continue;
      const category = c.category.toLowerCase();
      const kind = /charging|charger|mobility/.test(category)
        ? 'ev'
        : /battery|bess|ess/.test(category)
          ? 'ess'
          : /tree|biomimetic/.test(category)
            ? 'treetino-v1'
            : 'offgrid';
      const template =
        templates.find((d) => d.siteId === siteId) ??
        templates.find((d) => d.key === kind)!;
      const target = Number(c.targetUsdc),
        apy = parseFloat(c.projectedApy);
      const catalog: VictronDemoItemDto = {
        ...template,
        siteId,
        identifier: c.treeAddress,
        title: c.title,
        category: c.category,
        categoryBadge: c.categoryBadge,
        narrative: c.narrative,
        investorHighlight: c.investorHighlight ?? template.investorHighlight,
        location: { ...template.location, city: c.city, country: c.country },
        financials: {
          ...template.financials,
          targetUsdc: target,
          totalShares: target,
          fundedUsdc: 0,
          fundedPercent: 0,
          projectedApy: apy,
          tariffRate: c.tariffRate,
        },
      };
      await this.database.db
        .insert(devices)
        .values({
          siteId,
          treeAddress: c.treeAddress,
          kind: catalog.key,
          catalog,
          tariffUnitsPerKwh:
            catalog.key === 'ev'
              ? '420000'
              : catalog.key === 'treetino-v1'
                ? '320000'
                : catalog.key === 'ess'
                  ? '180000'
                  : '95000',
          connectionFeeUnits: catalog.key === 'ev' ? '2500000' : '0',
          chargingPowerWatts: catalog.key === 'ev' ? 11000 : 5000,
        })
        .onConflictDoNothing();
    }
  }
  list() {
    return this.database.db.select().from(devices).orderBy(devices.siteId);
  }
  async get(siteId: number) {
    const [device] = await this.database.db
      .select()
      .from(devices)
      .where(eq(devices.siteId, siteId));
    if (!device) throw new NotFoundException('Device not found.');
    return device;
  }
}
