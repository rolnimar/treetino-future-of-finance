import { useEffect, useRef, useState } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ConnectedWallet } from '../../../chain/wallet';
import { buildPublicTransaction } from '../../../chain/public';
import { sendWalletTransaction } from '../../../chain/transaction';
import type { PublicAction } from '../schemas';

export function usePublicTransactions(wallet: ConnectedWallet | null) {
  const { connection } = useConnection();
  const queryClient = useQueryClient();
  const [signature, setSignature] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const mutation = useMutation({
    mutationFn: async (action: PublicAction) => {
      if (!wallet) throw new Error('Connect your wallet first');
      const current = new AbortController();
      controller.current = current;
      setSignature(null);
      const transaction = await buildPublicTransaction(
        connection,
        wallet.address,
        action,
      );
      current.signal.throwIfAborted();
      return sendWalletTransaction(
        connection,
        wallet,
        transaction,
        (signature) => {
          if (!current.signal.aborted) setSignature(signature);
        },
        current.signal,
      );
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['wallet', 'usdc', connection.rpcEndpoint, wallet?.address],
        }),
        queryClient.invalidateQueries({
          queryKey: [
            'wallet',
            'mockUsdc',
            connection.rpcEndpoint,
            wallet?.address,
          ],
        }),
        queryClient.invalidateQueries({ queryKey: ['trees'] }),
        queryClient.invalidateQueries({ queryKey: ['campaigns-list'] }),
        queryClient.invalidateQueries({
          queryKey: ['wallet', 'funding-positions'],
        }),
        queryClient.invalidateQueries({ queryKey: ['tree-reports'] }),
        queryClient.invalidateQueries({ queryKey: ['client'] }),
        queryClient.invalidateQueries({ queryKey: ['wallet', 'treeRewards'] }),
      ]);
    },
    retry: false,
  });
  return { ...mutation, signature };
}
