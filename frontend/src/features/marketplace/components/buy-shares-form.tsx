import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { Field } from '../../../components/ui/field';
import { Button } from '../../../components/ui/button';
import { formatTokenAmount } from '../../../chain/amounts';
import { buySharesFormSchema, spendLimit } from '../schemas';

export function BuySharesForm({
  balance,
  remaining,
  disabled,
  onBuy,
}: {
  balance: string;
  remaining: string;
  disabled: boolean;
  onBuy: (amount: string) => void;
}) {
  const schema = buySharesFormSchema(balance, remaining);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<z.input<typeof schema>, unknown, z.output<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { amount: '' },
  });
  const maximum = spendLimit(balance, remaining);
  return (
    <form
      onSubmit={handleSubmit((data) => onBuy(data.amount))}
      className="space-y-3"
    >
      <fieldset disabled={disabled} className="space-y-3 disabled:opacity-60">
        <Field
          label="Spend USDC"
          inputMode="decimal"
          {...register('amount')}
          error={errors.amount?.message}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            disabled={maximum === '0'}
            onClick={() =>
              setValue('amount', formatTokenAmount(maximum), {
                shouldValidate: true,
              })
            }
          >
            Max · {formatTokenAmount(maximum)}
          </Button>
          <Button type="submit" disabled={maximum === '0'}>
            Buy shares
          </Button>
        </div>
        <p className="text-xs text-zinc-500">
          1 USDC buys 1 share. Your wallet pays transaction fees in SOL.
        </p>
      </fieldset>
    </form>
  );
}
