import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import type { z } from 'zod';
import { faucetFormSchema } from '../schemas';
import { Card } from '../../../components/ui/card';
import { Field } from '../../../components/ui/field';
import { Button } from '../../../components/ui/button';

export function PublicFaucet({
  connected,
  disabled,
  onMint,
}: {
  connected: boolean;
  disabled: boolean;
  onMint: (amount: string) => void;
}) {
  const { setVisible } = useWalletModal();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<
    z.input<typeof faucetFormSchema>,
    unknown,
    z.output<typeof faucetFormSchema>
  >({
    resolver: zodResolver(faucetFormSchema),
    defaultValues: { amount: '1000' },
  });
  return (
    <Card title="USDC Demo Faucet">
      <p className="mb-4 text-sm text-zinc-500">
        Get test USDC on Solana devnet to fund green energy projects.
      </p>
      {connected ? (
        <form onSubmit={handleSubmit((data) => onMint(data.amount))}>
          <fieldset
            disabled={disabled}
            className="max-w-md space-y-3 disabled:opacity-60"
          >
            <Field
              label="Faucet amount (USDC)"
              inputMode="decimal"
              {...register('amount')}
              error={errors.amount?.message}
            />
            <Button type="submit">Mint USDC</Button>
          </fieldset>
        </form>
      ) : (
        <Button onClick={() => setVisible(true)}>
          Connect wallet for faucet
        </Button>
      )}
    </Card>
  );
}
