export function parseTokenAmount(value: string, allowZero = false): string {
  if (!/^(0|[1-9][0-9]*)(\.[0-9]{1,6})?$/.test(value))
    throw new Error('Enter an amount with at most six decimal places');
  const [whole, fraction = ''] = value.split('.');
  const raw = BigInt(whole!) * 1_000_000n + BigInt(fraction.padEnd(6, '0'));
  if (raw > 18446744073709551615n || (!allowZero && raw === 0n))
    throw new Error('Amount must be positive and fit in u64');
  return raw.toString();
}
export function formatTokenAmount(value?: string | null) {
  if (!value) return '0';
  try {
    const raw = BigInt(value);
    const fraction = (raw % 1_000_000n)
      .toString()
      .padStart(6, '0')
      .replace(/0+$/, '');
    return `${raw / 1_000_000n}${fraction ? '.' + fraction : ''}`;
  } catch {
    return '0';
  }
}
export const nextUtcDay = () =>
  new Date((Math.floor(Date.now() / 86_400_000) + 1) * 86_400_000)
    .toISOString()
    .slice(0, 10);
export const lastCompletedUtcDay = () =>
  new Date((Math.floor(Date.now() / 86_400_000) - 1) * 86_400_000)
    .toISOString()
    .slice(0, 10);
export const utcDay = (timestamp: string) =>
  new Date(Number(timestamp) * 1000).toISOString().slice(0, 10);
