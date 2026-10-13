import { useQuery } from '@tanstack/react-query';
import { useConnection } from '@solana/wallet-adapter-react';
import { readEurTreeBalance } from '../../../chain/public';

export function useEurTree(address: string | undefined) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: ['wallet', 'eurTree', connection.rpcEndpoint, address],
    enabled: !!address,
    queryFn: async ({ signal }) => {
      if (!address) throw new Error('Wallet connection required');
      const balance = await readEurTreeBalance(connection, address);
      signal.throwIfAborted();
      return balance;
    },
    staleTime: 5_000,
    refetchInterval: 10_000,
    refetchOnWindowFocus: true,
  });
}

export const useMockUsdc = useEurTree;
