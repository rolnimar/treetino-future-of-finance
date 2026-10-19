import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ConnectedWallet } from '../../chain/wallet';
import { formatTokenAmount } from '../../chain/amounts';
import { api } from '../../lib/api';
import { treesResponseSchema, type ClientSession } from '../../lib/schemas';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { AddressLink, ErrorMessage } from '../../components/ui/feedback';
import { useUsdc } from '../marketplace/hooks/use-mock-usdc';
import { usePublicTransactions } from '../marketplace/hooks/use-public-transactions';
import { TreeInvoices } from '../marketplace/components/tree-invoices';

const PAGE_SIZE = 20;
export function ClientWorkspace({
  session,
  wallet,
}: {
  session: ClientSession;
  wallet: ConnectedWallet;
}) {
  const [page, setPage] = useState(0);
  const balance = useUsdc(wallet.address);
  const transaction = usePublicTransactions(wallet);
  const query = useQuery({
    queryKey: ['client', wallet.address, session.accessToken, 'trees', page],
    queryFn: ({ signal }) =>
      api(
        `client/trees?limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}`,
        treesResponseSchema,
        {
          signal,
          headers: { Authorization: `Bearer ${session.accessToken}` },
        },
      ),
    refetchInterval: 10_000,
    retry: false,
  });
  return (
    <div className="space-y-5">
      <p className="text-sm">
        Your balance:{' '}
        {balance.data
          ? `${formatTokenAmount(balance.data.balance)} USDC`
          : 'Loading…'}
        . Use the demo faucet in the marketplace to top up.
      </p>
      <ErrorMessage error={query.error ?? balance.error ?? transaction.error} />
      {transaction.signature && (
        <a
          className="block text-xs underline"
          href={`https://solscan.io/tx/${transaction.signature}?cluster=devnet`}
          target="_blank"
          rel="noreferrer"
        >
          View payment transaction ↗
        </a>
      )}
      {query.isPending && <p>Loading your trees…</p>}
      {query.data && (
        <>
          <p className="text-sm">
            {query.data.total} trees assigned to your wallet
          </p>
          {!query.data.trees.length && (
            <p className="text-sm">
              No trees are assigned to this client wallet.
            </p>
          )}
          <div className="grid gap-5 lg:grid-cols-2">
            {query.data.trees.map((tree) => (
              <Card key={tree.address} title={`Client tree #${tree.treeId}`}>
                <p className="mb-3 text-sm capitalize">{tree.phase}</p>
                <AddressLink address={tree.address} />
                <TreeInvoices
                  tree={tree}
                  wallet={wallet.address}
                  balance={balance.data?.balance ?? '0'}
                  disabled={transaction.isPending || !balance.data}
                  clientSession={session}
                  onPay={(report, amount) =>
                    transaction.mutate({
                      action: 'payInvoice',
                      tree,
                      report,
                      amount,
                    })
                  }
                />
              </Card>
            ))}
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              disabled={page === 0 || query.isFetching}
              onClick={() => setPage(page - 1)}
            >
              Previous client trees
            </Button>
            <Button
              variant="secondary"
              disabled={
                query.isFetching || (page + 1) * PAGE_SIZE >= query.data.total
              }
              onClick={() => setPage(page + 1)}
            >
              Next client trees
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
