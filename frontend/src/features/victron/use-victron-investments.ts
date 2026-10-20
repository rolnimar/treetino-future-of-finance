import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useConnectedWallet } from '../wallet/use-connected-wallet';
import { demoPost, portfolioSchema, claimSchema } from '../devices/device-api';
export const YIELD_CHANNEL = 'treetino-yield';
export interface InvestmentRecord {
  amountUsdc: number;
  investedAt: number;
  lastClaimedAt: number;
  totalClaimedUsdc: number;
  claimableUsdc?: number;
  earnedUsdc?: number;
  claimableUnits?: string;
  amountUnits?: string;
  poolSharePercent?: string;
  hourlyRateUsdc?: number;
  onchainAmountUsdc?: number;
  totalKaminoBonusClaimed?: number;
  kaminoAutoCompound?: boolean;
  demoFiatAmountUsdc?: number;
  demoFiatFeesUsdc?: number;
  demoFiatPaidUsdc?: number;
}
export type InvestmentsMap = Record<number, InvestmentRecord>;
export function useVictronInvestments(walletAddress: string | undefined) {
  const wallet = useConnectedWallet(),
    queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['device-portfolio', walletAddress],
    queryFn: ({ signal }) =>
      api(`devices/portfolio/${walletAddress}`, portfolioSchema, { signal }),
    enabled: !!walletAddress,
    refetchInterval: 800,
    staleTime: 300,
  });
  const { refetch } = query;
  // Same-browser shortcut: the EV kiosk announces payouts so an open
  // portfolio refreshes immediately instead of waiting for the next poll.
  useEffect(() => {
    if (!walletAddress || typeof BroadcastChannel === 'undefined') return;
    const channel = new BroadcastChannel(YIELD_CHANNEL);
    channel.onmessage = () => void refetch();
    return () => channel.close();
  }, [walletAddress, refetch]);
  const claimYield = async (siteId: number, memoReference?: string) => {
    if (!wallet || wallet.address !== walletAddress)
      throw new Error('Connect your wallet first.');
    const result = await demoPost(
      wallet,
      `devices/${siteId}/claims`,
      claimSchema,
      { id: crypto.randomUUID(), memoReference },
    );
    await Promise.all([
      query.refetch(),
      queryClient.invalidateQueries({ queryKey: ['wallet', 'usdc'] }),
    ]);
    return result;
  };
  return {
    investments: (query.data?.investments ?? {}) as InvestmentsMap,
    claimYield,
    totals: query.data?.totals ?? {
      investedUsdc: 0,
      earnedUsdc: 0,
      claimableUsdc: 0,
      claimedUsdc: 0,
    },
    receipts: query.data?.receipts ?? [],
    isPending: query.isPending,
    error: query.error,
    refetch: query.refetch,
  };
}
