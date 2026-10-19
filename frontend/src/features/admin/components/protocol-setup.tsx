import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { useAdmin } from '../admin-context';
import { adminsFormSchema, type ChainState } from '../schemas';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { TextareaField } from '../../../components/ui/field';
import { AddressLink } from '../../../components/ui/feedback';
export function ProtocolSetup() {
  const { setup, transaction, disabled, wallet } = useAdmin();
  const state = setup.data;
  if (!state) return <p className="text-sm">Loading protocol configuration…</p>;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="On-chain admins">
        <p className="mb-3 text-sm">
          {state.adminsInitialized ? 'Initialized' : 'Not initialized'} · Only
          the upgrade authority can edit membership.
        </p>
        {state.upgradeAuthority ? (
          <AddressLink address={state.upgradeAuthority} />
        ) : (
          <p>Upgrade authority revoked. Membership changes are disabled.</p>
        )}
        <AdminsForm
          key={`${state.adminsInitialized}:${state.admins.join(',')}`}
          state={state}
        />
        {state.upgradeAuthority !== wallet && (
          <p className="mt-3 text-sm text-zinc-500">
            Connect the program’s upgrade authority wallet to manage this list.
          </p>
        )}
        <p className="mt-4 text-xs text-zinc-500">
          These wallets can create trees. Backend admin login access is managed
          separately.
        </p>
      </Card>
      <Card title="Payment token">
        <p className="mb-3 text-sm">
          USDC · 6 decimals · Solana devnet test token
        </p>
        <AddressLink address={state.paymentMint} />
        <p className="my-4 text-sm">
          {state.paymentTokenInitialized
            ? 'Payment token initialized.'
            : 'Initialize the payment mint and metadata before creating trees.'}
        </p>
        <Button
          disabled={disabled || state.paymentTokenInitialized}
          onClick={() => transaction.mutate({ action: 'initPaymentToken' })}
        >
          Initialize payment token
        </Button>
        <p className="mt-3 text-xs text-zinc-500">
          Your wallet pays account rent and transaction fees.
        </p>
      </Card>
    </div>
  );
}
function AdminsForm({ state }: { state: ChainState }) {
  const { wallet, disabled, transaction } = useAdmin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<
    z.input<typeof adminsFormSchema>,
    unknown,
    z.output<typeof adminsFormSchema>
  >({
    resolver: zodResolver(adminsFormSchema),
    defaultValues: {
      wallets: state.adminsInitialized ? state.admins.join('\n') : wallet,
    },
  });
  return (
    <form
      className="mt-4 space-y-4"
      onSubmit={handleSubmit((data) =>
        transaction.mutate({
          action: state.adminsInitialized ? 'setAdmins' : 'initAdmins',
          wallets: data.wallets,
        }),
      )}
    >
      <fieldset
        disabled={disabled || state.upgradeAuthority !== wallet}
        className="space-y-4 disabled:opacity-60"
      >
        <TextareaField
          label="Admin wallets (one per line, 1–10)"
          rows={5}
          {...register('wallets')}
          error={errors.wallets?.message}
        />
        <Button type="submit">
          {state.adminsInitialized
            ? 'Update chain admins'
            : 'Initialize chain admins'}
        </Button>
      </fieldset>
    </form>
  );
}
