import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import {
  type IndexedTree,
  campaignsResponseSchema,
} from '../../../lib/schemas';
import { useAdmin } from '../admin-context';
import { Card } from '../../../components/ui/card';
import { AddressLink } from '../../../components/ui/feedback';
import { Button } from '../../../components/ui/button';
import { formatTokenAmount } from '../../../chain/amounts';
import { ActivationForm } from './activation-form';
import { ReportsPanel } from './reports-panel';
import { MockReporterStatus } from './mock-reporter-status';
export function TreeCard({ tree }: { tree: IndexedTree }) {
  const { wallet, disabled, transaction } = useAdmin();
  const mine = tree.creator === wallet;

  const campaignsQuery = useQuery({
    queryKey: ['campaigns-list'],
    queryFn: ({ signal }) =>
      api('campaigns', campaignsResponseSchema, { signal }),
  });
  const campaign = campaignsQuery.data?.campaigns.find(
    (c) => c.treeAddress === tree.address || c.treeId === tree.treeId,
  );

  return (
    <Card
      title={`Tree #${tree.treeId}${campaign ? ` · ${campaign.title}` : ''}`}
    >
      <div className="mb-3 flex items-center gap-3">
        <span className="rounded-full bg-sky-100 text-t-blue px-3 py-1 text-xs font-semibold">
          {tree.phase}
        </span>
        <span className="text-xs text-zinc-500">
          Indexed {new Date(tree.updatedAt).toLocaleString()}
        </span>
      </div>

      {campaign && (
        <div className="mb-4 rounded-2xl border border-black/10 bg-zinc-50 p-4 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono font-bold text-zinc-700 uppercase">
              {campaign.categoryBadge} · {campaign.city}, {campaign.country}
            </span>
            <span className="font-mono font-extrabold text-t-blue">
              {campaign.projectedApy} APY
            </span>
          </div>
          <p className="mt-1 text-zinc-600">{campaign.narrative}</p>
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-black/10 pt-2 font-mono text-[11px] text-zinc-500">
            <span>
              Off-Taker:{' '}
              <strong className="text-zinc-900">{campaign.offTakerName}</strong>
            </span>
            <span>
              Tariff:{' '}
              <strong className="text-zinc-900">{campaign.tariffRate}</strong>
            </span>
            {campaign.victronSiteId && (
              <a
                href={`#asset/${campaign.victronSiteId}`}
                className="text-t-blue font-bold hover:underline"
              >
                Inspect Live Hardware & Telemetry ↗
              </a>
            )}
          </div>
        </div>
      )}

      <AddressLink address={tree.address} />
      <dl className="my-5 grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-zinc-500">Funding</dt>
          <dd>
            {formatTokenAmount(tree.raised)} / {formatTokenAmount(tree.target)}{' '}
            EURTree
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">Creator</dt>
          <dd>
            <AddressLink address={tree.creator} />
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">Supplier</dt>
          <dd>
            <AddressLink address={tree.supplier} />
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">Client</dt>
          <dd>
            <AddressLink address={tree.client} />
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">Reporter</dt>
          <dd>
            <AddressLink address={tree.reporter} />
          </dd>
        </div>
      </dl>
      <MockReporterStatus tree={tree} />
      {!mine && (
        <p className="mb-3 text-sm text-zinc-500">
          Lifecycle actions require this tree’s creator wallet.
        </p>
      )}
      {tree.phase === 'funding' && (
        <p className="text-sm">
          Purchase becomes available when funding reaches the target.
        </p>
      )}
      {tree.phase === 'funded' && (
        <>
          <p className="mb-3 text-sm">
            Purchase sends the funding target to the supplier’s payment ATA.
          </p>
          <Button
            disabled={disabled || !mine}
            onClick={() => transaction.mutate({ action: 'purchaseTree', tree })}
          >
            Purchase tree
          </Button>
        </>
      )}
      {tree.phase === 'purchased' && <ActivationForm tree={tree} />}
      {tree.phase === 'active' && <ReportsPanel tree={tree} />}
    </Card>
  );
}
