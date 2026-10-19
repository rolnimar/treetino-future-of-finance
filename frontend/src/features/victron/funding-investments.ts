import type { Connection } from '@solana/web3.js';
import { api } from '../../lib/api';
import {
  campaignsResponseSchema,
  treesResponseSchema,
} from '../../lib/schemas';
import { readTreeRewards } from '../../chain/rewards';
import type { InvestmentsMap } from './use-victron-investments';

export interface FundingPosition {
  siteId: number;
  amountUsdc: number;
  observedAt: number;
}

export async function fetchFundingPositions(
  connection: Connection,
  wallet: string,
  signal?: AbortSignal,
) {
  const [campaigns, trees] = await Promise.all([
    api('campaigns', campaignsResponseSchema, { signal }),
    api('trees?limit=1000', treesResponseSchema, { signal }),
  ]);
  const byAddress = new Map(trees.trees.map((tree) => [tree.address, tree]));
  const positions = await Promise.all(
    campaigns.campaigns.map(async (campaign) => {
      const tree = byAddress.get(campaign.treeAddress);
      if (!tree || campaign.victronSiteId === undefined) return null;
      const position = await readTreeRewards(connection, wallet, tree);
      signal?.throwIfAborted();
      return {
        siteId: campaign.victronSiteId,
        amountUsdc: Number(BigInt(position.shares)) / 1e6,
        observedAt: Date.parse(tree.updatedAt),
      };
    }),
  );
  return positions.filter(
    (position): position is FundingPosition => position !== null,
  );
}

// Confirmed program positions are read afresh, never added into browser storage.
export function mergeFundingPositions(
  base: InvestmentsMap,
  positions: FundingPosition[],
): InvestmentsMap {
  const result = { ...base };
  const seen = new Set<number>();
  for (const position of positions) {
    if (position.amountUsdc <= 0 || seen.has(position.siteId)) continue;
    seen.add(position.siteId);
    const existing = base[position.siteId];
    result[position.siteId] = {
      ...existing,
      amountUsdc: (existing?.amountUsdc ?? 0) + position.amountUsdc,
      onchainAmountUsdc: position.amountUsdc,
      investedAt: existing?.investedAt ?? position.observedAt,
      lastClaimedAt: existing?.lastClaimedAt ?? position.observedAt,
      totalClaimedUsdc: existing?.totalClaimedUsdc ?? 0,
    };
  }
  return result;
}
