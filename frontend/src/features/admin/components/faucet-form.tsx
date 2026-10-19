import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { faucetFormSchema } from '../schemas';
import { useAdmin } from '../admin-context';
import { Card } from '../../../components/ui/card';
import { Field } from '../../../components/ui/field';
import { Button } from '../../../components/ui/button';
export function FaucetForm() {
  const { setup, disabled, transaction } = useAdmin();
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
    <Card title="Get demo USDC">
      <p className="mb-4 text-sm">
        Mint test USDC tokens into your payment account on Solana devnet.
      </p>
      <form
        onSubmit={handleSubmit((data) =>
          transaction.mutate({ action: 'giveMeMoney', amount: data.amount }),
        )}
      >
        <fieldset
          disabled={disabled || !setup.data?.paymentTokenInitialized}
          className="max-w-md space-y-4 disabled:opacity-60"
        >
          <Field
            label="Amount (USDC)"
            {...register('amount')}
            error={errors.amount?.message}
          />
          <Button type="submit">Mint USDC</Button>
        </fieldset>
      </form>
    </Card>
  );
}
