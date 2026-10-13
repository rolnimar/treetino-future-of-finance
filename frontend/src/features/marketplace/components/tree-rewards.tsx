import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import type { IndexedTree } from '../../../lib/schemas';
import { formatTokenAmount } from '../../../chain/amounts';
import { Button } from '../../../components/ui/button';
import { ErrorMessage } from '../../../components/ui/feedback';
import { useTreeRewards } from '../hooks/use-tree-rewards';

export function TreeRewards({
  tree,
  wallet,
  disabled,
  onClaim,
}: {
  tree: IndexedTree;
  wallet: string | undefined;
  disabled: boolean;
  onClaim: () => void;
}) {
  const rewards = useTreeRewards(tree, wallet);
  const { setVisible } = useWalletModal();
  const state = rewards.data;
  return (
    <section
      aria-label="Investor rewards"
      className="mt-5 rounded-2xl border border-sky-200 bg-sky-50/70 p-4"
    >
      <h3 className="font-bold text-zinc-950">Your investor rewards</h3>
      {!wallet ? (
        <Button className="mt-3" onClick={() => setVisible(true)}>
          Connect wallet to view rewards
        </Button>
      ) : (
        <>
          <p
            role="status"
            aria-label="Claimable yield"
            className="my-2 text-xl font-black text-t-blue"
          >
            {rewards.isError
              ? 'Rewards unavailable'
              : state
                ? `${formatTokenAmount(state.claimable)} EURTree`
                : 'Loading rewards…'}
          </p>
          {state && !rewards.isError && state.claimable !== '0' && (
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-100/70 border border-emerald-300 px-2.5 py-0.5 text-[11px] font-mono font-medium text-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Kamino Pool (+8.85% APY) Auto-Compounding</span>
            </div>
          )}
          <ErrorMessage error={rewards.error} />
          {state && !rewards.isError && (
            <p className="mb-3 text-sm text-zinc-600">
              {!state.hasPosition
                ? 'This wallet has no investment in this tree.'
                : !state.active
                  ? 'Rewards can be claimed once the tree is active.'
                  : state.claimable === '0'
                    ? 'No paid invoice rewards are available to claim yet.'
                    : !state.canClaim
                      ? 'The tree revenue vault cannot cover this claim yet.'
                      : 'Your share of paid invoices, ready to claim.'}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={
                disabled ||
                rewards.isError ||
                !state?.canClaim ||
                rewards.isFetching
              }
              onClick={onClaim}
            >
              Claim Yield
            </Button>
            <Button
              variant="secondary"
              disabled={rewards.isFetching || disabled}
              onClick={() => void rewards.refetch()}
            >
              Refresh rewards
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
