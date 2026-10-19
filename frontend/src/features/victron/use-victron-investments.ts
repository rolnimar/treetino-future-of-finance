import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useConnectedWallet } from '../wallet/use-connected-wallet';
import { demoPost, portfolioSchema, claimSchema } from '../devices/device-api';
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
    refetchInterval: 5000,
    staleTime: 1000,
  });
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
