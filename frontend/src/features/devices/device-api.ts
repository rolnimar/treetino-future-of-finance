import { z } from 'zod';
import { api, jsonBody } from '../../lib/api';
import type { ConnectedWallet } from '../../chain/wallet';
import { signInClient } from '../auth/auth-api';
import type { ClientSession } from '../../lib/schemas';
const sessions = new Map<string, Promise<ClientSession>>();
async function session(wallet: ConnectedWallet): Promise<ClientSession> {
  let pending = sessions.get(wallet.address);
  if (!pending) {
    pending = signInClient(wallet, new AbortController().signal);
    sessions.set(wallet.address, pending);
  }
  try {
    const result = await pending;
    if (Date.parse(result.expiresAt) < Date.now() + 30000) {
      sessions.delete(wallet.address);
      return session(wallet);
    }
    return result;
  } catch (error) {
    sessions.delete(wallet.address);
    throw error;
  }
}
/** Signs the wallet in ahead of time so the first demo action is instant. */
export async function prewarmDemoSession(wallet: ConnectedWallet) {
  await session(wallet);
}
export async function demoPost<T>(
  wallet: ConnectedWallet,
  path: string,
  schema: z.ZodType<T>,
  body: unknown,
) {
  const auth = await session(wallet),
    options = jsonBody(body);
  return api(path, schema, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${auth.accessToken}`,
    },
  });
}
export const demoBalanceSchema = z.object({
  initialized: z.boolean(),
  balance: z.string(),
  simulated: z.literal(true),
});
export const investmentSchema = z.object({
  id: z.string(),
  siteId: z.number(),
  wallet: z.string(),
  units: z.string(),
  createdAt: z.number(),
});
export const claimSchema = z.object({
  id: z.string(),
  units: z.string(),
  amountUsdc: z.number(),
  simulated: z.literal(true),
});
export const holdingSchema = z.object({
  amountUsdc: z.number(),
  amountUnits: z.string(),
  investedAt: z.number(),
  lastClaimedAt: z.number(),
  totalClaimedUsdc: z.number(),
  earnedUsdc: z.number(),
  claimableUsdc: z.number(),
  claimableUnits: z.string(),
  poolSharePercent: z.string(),
  hourlyRateUsdc: z.number(),
  demoFiatAmountUsdc: z.number(),
});
export const portfolioSchema = z.object({
  wallet: z.string(),
  balance: z.string(),
  investments: z.record(z.string(), holdingSchema),
  totals: z.object({
    investedUsdc: z.number(),
    earnedUsdc: z.number(),
    claimableUsdc: z.number(),
    claimedUsdc: z.number(),
  }),
  receipts: z.array(
    z.object({
      id: z.string(),
      siteId: z.number(),
      sessionId: z.string(),
      amountUsdc: z.number(),
      createdAt: z.number(),
      claimId: z.string().nullable(),
    }),
  ),
  simulated: z.literal(true),
});
export const chargingSessionSchema = z.object({
  id: z.string(),
  siteId: z.number(),
  wallet: z.string(),
  status: z.enum(['charging', 'awaiting_payment', 'paid', 'cancelled']),
  targetWh: z.number(),
  deliveredWh: z.number(),
  powerWatts: z.number(),
  speed: z.number(),
  tariffUnitsPerKwh: z.string(),
  connectionFeeUnits: z.string(),
  amountUnits: z.string(),
  amountUsdc: z.number(),
  startedAt: z.number(),
  stoppedAt: z.number().nullable(),
  paidAt: z.number().nullable(),
  paymentMethod: z.enum(['usdc', 'card']).nullable(),
  contributors: z.array(z.object({ wallet: z.string(), units: z.string() })),
  simulated: z.literal(true),
});
export type ChargingSession = z.infer<typeof chargingSessionSchema>;
