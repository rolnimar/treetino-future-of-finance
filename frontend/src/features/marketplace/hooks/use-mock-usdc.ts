import { useQuery } from '@tanstack/react-query';
import { useConnection } from '@solana/wallet-adapter-react';
import { readUsdcBalance } from '../../../chain/public';

export function useUsdc(address: string | undefined) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: ['wallet', 'usdc', connection.rpcEndpoint, address],
    enabled: !!address,
    queryFn: async ({ signal }) => {
      if (!address) throw new Error('Wallet connection required');
      const balance = await readUsdcBalance(connection, address);
      signal.throwIfAborted();
      return balance;
    },
    staleTime: 5_000,
    refetchInterval: 10_000,
    refetchOnWindowFocus: true,
  });
}

export const useMockUsdc = useUsdc;
