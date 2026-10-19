import { formatTokenAmount } from '../../../chain/amounts';

export function FundingBar({
  raised,
  target,
}: {
  raised: string;
  target: string;
}) {
  const goal = BigInt(target);
  const basisPoints = goal > 0n ? Number((BigInt(raised) * 10_000n) / goal) : 0;
  const percent = Math.min(100, Math.max(0, basisPoints / 100));

  return (
    <div className="my-5 space-y-2">
      <div className="flex flex-wrap justify-between gap-2 text-xs font-mono">
        <span className="text-zinc-600">
          <strong className="text-zinc-950 font-bold">
            {formatTokenAmount(raised)}
          </strong>{' '}
          / {formatTokenAmount(target)} USDC
        </span>
        <span className="font-bold text-t-blue">{percent}% funded</span>
      </div>
      <div
        role="progressbar"
        aria-label="Tree funding"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="h-2.5 overflow-hidden rounded-full bg-zinc-100"
      >
        <div
          className="h-full rounded-full bg-linear-to-r from-t-blue to-t-accent transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
