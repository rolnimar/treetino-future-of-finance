import { BadRequestException } from '@nestjs/common';

export function units(value: unknown): bigint {
  if (
    typeof value !== 'string' ||
    !/^(0|[1-9]\d{0,8})(\.\d{1,6})?$/.test(value)
  )
    throw new BadRequestException(
      'Enter a USDC amount with at most six decimal places.',
    );
  const [whole, fraction = ''] = value.split('.');
  const amount = BigInt(whole!) * 1_000_000n + BigInt(fraction.padEnd(6, '0'));
  if (amount <= 0n || amount > 1_000_000_000_000n)
    throw new BadRequestException(
      'Amount must be between 0.000001 and 1,000,000 USDC.',
    );
  return amount;
}
export const displayUnits = (value: bigint | string) =>
  Number(BigInt(value)) / 1e6;

// Deterministic largest-remainder apportionment conserves every micro-USDC.
export function splitRevenue(
  amount: bigint,
  contributors: { wallet: string; units: string }[],
) {
  const weights = new Map<string, bigint>();
  for (const c of contributors) {
    const value = BigInt(c.units);
    if (value > 0n)
      weights.set(c.wallet, (weights.get(c.wallet) ?? 0n) + value);
  }
  const total = [...weights.values()].reduce((sum, value) => sum + value, 0n);
  if (!total || !amount) return [];
  const rows = [...weights].map(([wallet, weight]) => ({
    wallet,
    amount: (amount * weight) / total,
    remainder: (amount * weight) % total,
  }));
  rows.sort((a, b) =>
    a.remainder === b.remainder
      ? a.wallet.localeCompare(b.wallet)
      : a.remainder > b.remainder
        ? -1
        : 1,
  );
  let dust = amount - rows.reduce((sum, row) => sum + row.amount, 0n);
  for (const row of rows) {
    if (dust-- <= 0n) break;
    row.amount++;
  }
  return rows
    .filter((row) => row.amount > 0n)
    .map(({ wallet, amount }) => ({ wallet, units: amount.toString() }));
}

export function meteredWh(
  session: {
    startedAt: number;
    targetWh: number;
    powerWatts: number;
    speed: number;
  },
  now: number,
) {
  return Math.min(
    session.targetWh,
    Math.floor(
      (Math.max(0, now - session.startedAt) *
        session.powerWatts *
        session.speed) /
        3_600_000,
    ),
  );
}
export function usagePrice(wh: number, tariff: string, connection: string) {
  return (
    (BigInt(wh) * BigInt(tariff) + 500n) / 1000n +
    BigInt(connection)
  ).toString();
}
