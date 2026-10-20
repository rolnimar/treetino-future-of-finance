import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { createHash } from 'node:crypto';
import { DatabaseService } from '../database/database.service';
import {
  demoPayments,
  demoWallets,
  demoDeposits,
  deviceInvestments,
  deviceDistributions,
  deviceClaims,
  usageSessions,
  indexedTransactions,
  indexedTrees,
  deviceProjection,
} from '../database/schema';
import { validateWallet } from '../auth/auth.service';
import { DeviceCatalogService } from './device-catalog.service';
import {
  units,
  displayUnits,
  splitRevenue,
  meteredWh,
  usagePrice,
} from './device-math';

type Db = Parameters<Parameters<DatabaseService['db']['transaction']>[0]>[0];
type Session = typeof usageSessions.$inferSelect;
export function requestId(value: unknown): string {
  if (
    typeof value !== 'string' ||
    !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
      value,
    )
  )
    throw new BadRequestException('A request UUID is required.');
  return value.toLowerCase();
}
function memo(value: unknown) {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string' || value.length > 160)
    throw new BadRequestException('Invalid memo reference.');
  return value;
}

@Injectable()
export class DeviceLedgerService {
  constructor(
    private readonly database: DatabaseService,
    private readonly catalog: DeviceCatalogService,
  ) {}
  private async locked<T>(action: (tx: Db) => Promise<T>) {
    return this.database.db.transaction(async (tx) => {
      await tx.execute(
        sql`SELECT pg_advisory_xact_lock(hashtext('treetino-device-ledger'))`,
      );
      return action(tx);
    });
  }
  private async wallet(tx: Db, wallet: string) {
    await tx.insert(demoWallets).values({ wallet }).onConflictDoNothing();
    return (
      await tx.select().from(demoWallets).where(eq(demoWallets.wallet, wallet))
    )[0]!;
  }
  private async debit(tx: Db, wallet: string, amount: bigint) {
    const account = await this.wallet(tx, wallet);
    if (BigInt(account.balanceUnits) < amount)
      throw new ConflictException(
        'Insufficient demo USDC balance. Add test funds first.',
      );
    await tx
      .update(demoWallets)
      .set({ balanceUnits: (BigInt(account.balanceUnits) - amount).toString() })
      .where(eq(demoWallets.wallet, wallet));
  }

  // Import durable receipts from the previous flow; browser storage is never trusted.
  async synchronize() {
    const catalog = await this.catalog.list();
    await this.locked(async (tx) => {
      const bySite = new Set(catalog.map((d) => d.siteId));
      const cards = await tx
        .select()
        .from(demoPayments)
        .where(
          and(
            eq(demoPayments.status, 'completed'),
            isNull(demoPayments.chargingSessionId),
          ),
        );
      for (const payment of cards) {
        if (
          !bySite.has(payment.siteId) ||
          !payment.usdcAllocation ||
          !payment.transactionId
        )
          continue;
        await tx
          .insert(deviceInvestments)
          .values({
            source: `moonpay:${payment.id}`,
            siteId: payment.siteId,
            wallet: payment.wallet,
            units: (
              BigInt(
                payment.paymentAmounts?.principalCents ?? payment.amountCents,
              ) * 10000n
            ).toString(),
            method: 'card',
            createdAt: payment.completedAt ?? payment.createdAt,
            memoReference: payment.transactionId,
          })
          .onConflictDoNothing();
      }
      const trees = await tx.select().from(indexedTrees);
      const byMint = new Map(
        trees.flatMap((t) => {
          const device = catalog.find((d) => d.treeAddress === t.address);
          return device ? [[t.shareMint, device.siteId] as const] : [];
        }),
      );
      if (!byMint.size) return;
      const version = createHash('sha256')
        .update([...byMint.keys()].sort().join(','))
        .digest('hex')
        .slice(0, 16);
      const pending = await tx
        .select()
        .from(indexedTransactions)
        .where(
          and(
            isNull(indexedTransactions.error),
            sql`NOT EXISTS (SELECT 1 FROM device_projection p WHERE p.source = ${`chain:${version}:`} || ${indexedTransactions.signature})`,
          ),
        )
        .limit(1000);
      for (const row of pending) {
        const data = row.transaction as {
          meta?: {
            err?: unknown;
            preTokenBalances?: TokenBalance[];
            postTokenBalances?: TokenBalance[];
          };
        } | null;
        if (data?.meta && data.meta.err === null) {
          const before = new Map(
            (data.meta.preTokenBalances ?? []).map((b) => [
              b.accountIndex,
              BigInt(b.uiTokenAmount.amount),
            ]),
          );
          const after = new Map(
            (data.meta.postTokenBalances ?? []).map((b) => [
              b.accountIndex,
              BigInt(b.uiTokenAmount.amount),
            ]),
          );
          const accounts = new Map(
            [
              ...(data.meta.preTokenBalances ?? []),
              ...(data.meta.postTokenBalances ?? []),
            ].map((b) => [b.accountIndex, b]),
          );
          const deltas = new Map<
            string,
            { siteId: number; wallet: string; amount: bigint }
          >();
          for (const b of accounts.values()) {
            const siteId = byMint.get(b.mint);
            if (
              siteId === undefined ||
              !b.owner ||
              b.uiTokenAmount.decimals !== 6
            )
              continue;
            const key = `${siteId}:${b.owner}`;
            const value = deltas.get(key) ?? {
              siteId,
              wallet: b.owner,
              amount: 0n,
            };
            value.amount +=
              (after.get(b.accountIndex) ?? 0n) -
              (before.get(b.accountIndex) ?? 0n);
            deltas.set(key, value);
          }
          for (const delta of deltas.values())
            if (delta.amount !== 0n)
              await tx
                .insert(deviceInvestments)
                .values({
                  source: `chain:${row.signature}:${delta.siteId}:${delta.wallet}`,
                  siteId: delta.siteId,
                  wallet: delta.wallet,
                  units: delta.amount.toString(),
                  method: 'usdc',
                  createdAt: row.blockTime * 1000,
                  memoReference: row.signature,
                })
                .onConflictDoNothing();
        }
        await tx
          .insert(deviceProjection)
          .values({ source: `chain:${version}:${row.signature}` })
          .onConflictDoNothing();
      }
    });
  }

  async balance(input: string) {
    const wallet = validateWallet(input);
    return this.locked(async (tx) => ({
      initialized: true,
      balance: (await this.wallet(tx, wallet)).balanceUnits,
      simulated: true,
    }));
  }
  async deposit(wallet: string, body: { id?: unknown; amount?: unknown }) {
    const id = requestId(body?.id),
      amount = units(body?.amount);
    return this.locked(async (tx) => {
      const [previous] = await tx
        .select()
        .from(demoDeposits)
        .where(eq(demoDeposits.id, id));
      if (
        previous &&
        (previous.wallet !== wallet || previous.units !== amount.toString())
      )
        throw new ConflictException('Request ID already used.');
      const account = await this.wallet(tx, wallet);
      if (!previous) {
        await tx
          .insert(demoDeposits)
          .values({ id, wallet, units: amount.toString() });
        await tx
          .update(demoWallets)
          .set({
            balanceUnits: (BigInt(account.balanceUnits) + amount).toString(),
          })
          .where(eq(demoWallets.wallet, wallet));
      }
      return {
        initialized: true,
        balance: (await this.wallet(tx, wallet)).balanceUnits,
        simulated: true,
      };
    });
  }
  async invest(
    wallet: string,
    siteId: number,
    body: { id?: unknown; amount?: unknown; memoReference?: unknown },
  ) {
    const id = requestId(body?.id),
      amount = units(body?.amount),
      reference = memo(body?.memoReference);
    const device = await this.catalog.get(siteId);
    await this.synchronize();
    return this.locked(async (tx) => {
      const source = `demo:${id}`;
      const [previous] = await tx
        .select()
        .from(deviceInvestments)
        .where(eq(deviceInvestments.source, source));
      if (previous) {
        if (
          previous.wallet !== wallet ||
          previous.siteId !== siteId ||
          previous.units !== amount.toString()
        )
          throw new ConflictException('Request ID already used.');
        return previous;
      }
      const holdings = await tx
        .select()
        .from(deviceInvestments)
        .where(eq(deviceInvestments.siteId, siteId));
      const funded = holdings.reduce(
        (total, row) => total + BigInt(row.units),
        0n,
      );
      if (
        funded + amount >
        BigInt(Math.round(device.catalog.financials.targetUsdc * 1e6))
      )
        throw new ConflictException('Amount exceeds remaining device funding.');
      await this.debit(tx, wallet, amount);
      return (
        await tx
          .insert(deviceInvestments)
          .values({
            source,
            siteId,
            wallet,
            units: amount.toString(),
            method: 'usdc',
            createdAt: Date.now(),
            memoReference: reference,
          })
          .returning()
      )[0]!;
    });
  }
  private async contributors(tx: Db, siteId: number) {
    const investments = await tx
      .select()
      .from(deviceInvestments)
      .where(eq(deviceInvestments.siteId, siteId));
    const sums = new Map<string, bigint>();
    for (const investment of investments)
      sums.set(
        investment.wallet,
        (sums.get(investment.wallet) ?? 0n) + BigInt(investment.units),
      );
    return [...sums]
      .filter(([, amount]) => amount > 0n)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([wallet, amount]) => ({ wallet, units: amount.toString() }));
  }
  async catalogResponse() {
    await this.catalog.seed();
    await this.synchronize();
    const [rows, investments, sessions] = await Promise.all([
      this.catalog.list(),
      this.database.db.select().from(deviceInvestments),
      this.database.db
        .select()
        .from(usageSessions)
        .where(eq(usageSessions.status, 'paid')),
    ]);
    const demos = rows.map((row) => {
      const principal = investments
        .filter((i) => i.siteId === row.siteId)
        .reduce((sum, i) => sum + BigInt(i.units), 0n);
      const paid = sessions.filter((s) => s.siteId === row.siteId);
      const received = paid.reduce((sum, s) => sum + BigInt(s.amountUnits), 0n);
      return {
        ...row.catalog,
        financials: {
          ...row.catalog.financials,
          fundedUsdc: displayUnits(principal),
          fundedPercent: Math.min(
            100,
            (displayUnits(principal) / row.catalog.financials.targetUsdc) * 100,
          ),
        },
        usage: {
          tariffUsdcPerKwh: displayUnits(row.tariffUnitsPerKwh),
          connectionFeeUsdc: displayUnits(row.connectionFeeUnits),
          powerKw: row.chargingPowerWatts / 1000,
        },
        revenue: {
          receivedUsdc: displayUnits(received),
          paidSessions: paid.length,
          energyKwh: paid.reduce((sum, s) => sum + s.deliveredWh, 0) / 1000,
        },
      };
    });
    return {
      demos,
      source: 'Backend device catalog · Demo ledger',
      updatedAt: new Date().toISOString(),
      simulated: true,
    };
  }
  async portfolio(input: string) {
    const wallet = validateWallet(input);
    await this.synchronize();
    return this.locked(async (tx) => {
      const investments = await tx.select().from(deviceInvestments);
      const distributions = await tx
        .select()
        .from(deviceDistributions)
        .where(eq(deviceDistributions.wallet, wallet));
      const holdings: Record<number, Record<string, number | string>> = {};
      const sites = new Set([
        ...investments.filter((i) => i.wallet === wallet).map((i) => i.siteId),
        ...distributions.map((d) => d.siteId),
      ]);
      for (const siteId of sites) {
        const mine = investments.filter(
          (i) => i.wallet === wallet && i.siteId === siteId,
        );
        const total = investments
          .filter((i) => i.siteId === siteId)
          .reduce((sum, i) => sum + BigInt(i.units), 0n);
        const principal = mine.reduce((sum, i) => sum + BigInt(i.units), 0n);
        const earned = distributions.filter((d) => d.siteId === siteId);
        const sum = (rows: typeof earned) =>
          rows.reduce((total, d) => total + BigInt(d.units), 0n);
        const available = sum(earned.filter((d) => !d.claimId));
        holdings[siteId] = {
          amountUsdc: displayUnits(principal),
          amountUnits: principal.toString(),
          investedAt: mine.length
            ? Math.min(...mine.map((i) => i.createdAt))
            : 0,
          lastClaimedAt: 0,
          totalClaimedUsdc: displayUnits(
            sum(earned.filter((d) => !!d.claimId)),
          ),
          earnedUsdc: displayUnits(sum(earned)),
          claimableUsdc: displayUnits(available),
          claimableUnits: available.toString(),
          poolSharePercent:
            total > 0n
              ? (Number((principal * 10000n) / total) / 100).toFixed(2)
              : '0.00',
          hourlyRateUsdc:
            displayUnits(
              sum(earned.filter((d) => d.createdAt >= Date.now() - 86400_000)),
            ) / 24,
          demoFiatAmountUsdc: displayUnits(
            mine
              .filter((i) => i.method === 'card')
              .reduce((sum, i) => sum + BigInt(i.units), 0n),
          ),
        };
      }
      const sumUnits = (rows: { units: string }[]) =>
        rows.reduce((total, row) => total + BigInt(row.units), 0n);
      return {
        wallet,
        balance: (await this.wallet(tx, wallet)).balanceUnits,
        investments: holdings,
        totals: {
          investedUsdc: displayUnits(
            sumUnits(investments.filter((i) => i.wallet === wallet)),
          ),
          earnedUsdc: displayUnits(sumUnits(distributions)),
          claimableUsdc: displayUnits(
            sumUnits(distributions.filter((d) => !d.claimId)),
          ),
          claimedUsdc: displayUnits(
            sumUnits(distributions.filter((d) => !!d.claimId)),
          ),
        },
        receipts: distributions.map((row) => ({
          ...row,
          amountUsdc: displayUnits(row.units),
        })),
        simulated: true,
      };
    });
  }

  private async session(id: string, tx: Pick<Db, 'select'> = this.database.db) {
    requestId(id);
    const [session] = await tx
      .select()
      .from(usageSessions)
      .where(eq(usageSessions.id, id));
    if (!session) throw new NotFoundException('Charging session not found.');
    return session;
  }
  private owner(session: Session, wallet: string) {
    if (session.wallet !== wallet)
      throw new ForbiddenException('This session belongs to another wallet.');
  }
  private present(session: Session) {
    const deliveredWh =
      session.status === 'charging'
        ? meteredWh(session, Date.now())
        : session.deliveredWh;
    return {
      ...session,
      deliveredWh,
      amountUnits:
        session.status === 'charging'
          ? usagePrice(
              deliveredWh,
              session.tariffUnitsPerKwh,
              session.connectionFeeUnits,
            )
          : session.amountUnits,
      amountUsdc: displayUnits(
        session.status === 'charging'
          ? usagePrice(
              deliveredWh,
              session.tariffUnitsPerKwh,
              session.connectionFeeUnits,
            )
          : session.amountUnits,
      ),
      simulated: true,
    };
  }
  async start(
    wallet: string,
    siteId: number,
    body: { id?: unknown; kwh?: unknown },
  ) {
    const id = requestId(body?.id);
    if (
      typeof body?.kwh !== 'string' ||
      !/^(0|[1-9]\d{0,2})(\.\d{1,3})?$/.test(body.kwh)
    )
      throw new BadRequestException('Choose between 0.001 and 200 kWh.');
    const targetWh = Math.round(Number(body.kwh) * 1000);
    if (targetWh < 1 || targetWh > 200000)
      throw new BadRequestException('Choose between 0.001 and 200 kWh.');
    const device = await this.catalog.get(siteId);
    if (device.kind !== 'ev')
      throw new BadRequestException(
        'This device is not an EV charging station.',
      );
    await this.synchronize();
    return this.locked(async (tx) => {
      const [existing] = await tx
        .select()
        .from(usageSessions)
        .where(eq(usageSessions.id, id));
      if (existing) {
        this.owner(existing, wallet);
        if (existing.siteId !== siteId || existing.targetWh !== targetWh)
          throw new ConflictException('Request ID already used.');
        return this.present(existing);
      }
      const [active] = await tx
        .select()
        .from(usageSessions)
        .where(
          and(
            eq(usageSessions.wallet, wallet),
            eq(usageSessions.siteId, siteId),
            sql`${usageSessions.status} IN ('charging','awaiting_payment')`,
          ),
        );
      if (active) return this.present(active);
      const [created] = await tx
        .insert(usageSessions)
        .values({
          id,
          siteId,
          wallet,
          targetWh,
          powerWatts: device.chargingPowerWatts,
          speed: 120,
          tariffUnitsPerKwh: device.tariffUnitsPerKwh,
          connectionFeeUnits: device.connectionFeeUnits,
          contributors: await this.contributors(tx, siteId),
          startedAt: Date.now(),
        })
        .returning();
      return this.present(created!);
    });
  }
  async getSession(id: string) {
    await this.finishIfCharged(id);
    return this.present(await this.session(id));
  }
  async latestSession(wallet: string, siteId: number) {
    validateWallet(wallet);
    const [session] = await this.database.db
      .select()
      .from(usageSessions)
      .where(
        and(
          eq(usageSessions.wallet, wallet),
          eq(usageSessions.siteId, siteId),
          sql`${usageSessions.status} <> 'cancelled'`,
        ),
      )
      .orderBy(sql`${usageSessions.startedAt} DESC`)
      .limit(1);
    return session ? this.getSession(session.id) : null;
  }
  private async finishIfCharged(id: string) {
    const session = await this.session(id);
    if (
      session.status === 'charging' &&
      meteredWh(session, Date.now()) >= session.targetWh
    )
      await this.stop(session.wallet, id);
  }
  async stop(wallet: string, id: string, deliverFullTarget = false) {
    return this.locked(async (tx) => {
      const session = await this.session(id, tx);
      this.owner(session, wallet);
      if (session.status !== 'charging') return this.present(session);
      const deliveredWh = deliverFullTarget
        ? session.targetWh
        : meteredWh(session, Date.now());
      const [updated] = await tx
        .update(usageSessions)
        .set({
          deliveredWh,
          stoppedAt: Date.now(),
          status: 'awaiting_payment',
          amountUnits: usagePrice(
            deliveredWh,
            session.tariffUnitsPerKwh,
            session.connectionFeeUnits,
          ),
        })
        .where(eq(usageSessions.id, id))
        .returning();
      return this.present(updated!);
    });
  }
  async pay(
    wallet: string,
    id: string,
    reference: unknown,
    refreshContributors = false,
    paymentMethod: 'usdc' | 'card' = 'usdc',
  ) {
    const memoReference = memo(reference);
    return this.locked(async (tx) => {
      const session = await this.session(id, tx);
      this.owner(session, wallet);
      if (session.status === 'paid') return this.present(session);
      if (session.status !== 'awaiting_payment')
        throw new ConflictException('Stop charging before paying.');
      await this.assertNoCardPayment(tx, id);
      await this.debit(tx, wallet, BigInt(session.amountUnits));
      const contributors = refreshContributors
        ? await this.contributors(tx, session.siteId)
        : session.contributors;
      return this.recordPayment(
        tx,
        { ...session, contributors },
        paymentMethod,
        memoReference,
      );
    });
  }
  private async recordPayment(
    tx: Db,
    session: Session,
    paymentMethod: 'usdc' | 'card',
    memoReference: string | null,
  ) {
    const now = Date.now(),
      id = session.id;
    const shares = splitRevenue(
      BigInt(session.amountUnits),
      session.contributors,
    );
    for (const share of shares)
      await tx.insert(deviceDistributions).values({
        sessionId: id,
        siteId: session.siteId,
        wallet: share.wallet,
        units: share.units,
        createdAt: now,
      });
    const [paid] = await tx
      .update(usageSessions)
      .set({
        status: 'paid',
        paidAt: now,
        memoReference,
        paymentMethod,
        contributors: session.contributors,
      })
      .where(eq(usageSessions.id, id))
      .returning();
    return this.present(paid!);
  }
  private async assertNoCardPayment(tx: Db, sessionId: string) {
    const [open] = await tx
      .select()
      .from(demoPayments)
      .where(
        and(
          eq(demoPayments.chargingSessionId, sessionId),
          sql`((${demoPayments.status} = 'pending' AND ${demoPayments.cancelledAt} IS NULL) OR (${demoPayments.status} = 'completed' AND ${demoPayments.settledAt} IS NULL))`,
        ),
      )
      .limit(1);
    if (open)
      throw new ConflictException(
        'Cancel or finish the current card checkout before using another payment method or cancelling the session.',
      );
  }
  async chargingCardOrder(wallet: string, id: string) {
    this.owner(await this.session(id), wallet);
    return (
      (
        await this.database.db
          .select()
          .from(demoPayments)
          .where(eq(demoPayments.chargingSessionId, id))
          .orderBy(sql`${demoPayments.createdAt} DESC`)
          .limit(1)
      )[0] ?? null
    );
  }
  async createChargingCardOrder(
    wallet: string,
    id: string,
    amountCents: number,
  ) {
    return this.locked(async (tx) => {
      const session = await this.session(id, tx);
      this.owner(session, wallet);
      if (session.status !== 'awaiting_payment')
        throw new ConflictException('Stop charging before paying.');
      const [open] = await tx
        .select()
        .from(demoPayments)
        .where(
          and(
            eq(demoPayments.chargingSessionId, id),
            eq(demoPayments.status, 'pending'),
            isNull(demoPayments.cancelledAt),
          ),
        )
        .limit(1);
      if (open) return open;
      await this.assertNoCardPayment(tx, id);
      return (
        await tx
          .insert(demoPayments)
          .values({
            wallet,
            siteId: session.siteId,
            chargingSessionId: id,
            amountCents,
            fiatCurrency: 'USD',
            createdAt: Date.now(),
          })
          .returning()
      )[0]!;
    });
  }
  async settleChargingCardOrder(id: string) {
    return this.locked(async (tx) => {
      const [order] = await tx
        .select()
        .from(demoPayments)
        .where(eq(demoPayments.id, requestId(id)));
      if (
        !order?.chargingSessionId ||
        order.status !== 'completed' ||
        !order.transactionId ||
        !order.usdcAllocation ||
        order.settledAt
      )
        return;
      const session = await this.session(order.chargingSessionId, tx);
      this.owner(session, order.wallet);
      const principal =
        BigInt(order.paymentAmounts?.principalCents ?? order.amountCents) *
        10000n;
      const account = await this.wallet(tx, order.wallet);
      const credited = BigInt(account.balanceUnits) + principal;
      await tx
        .update(demoWallets)
        .set({ balanceUnits: credited.toString() })
        .where(eq(demoWallets.wallet, order.wallet));
      // A late provider completion still credits the driver, but cannot pay a
      // cancelled/already-paid bill or distribute its revenue for a second time.
      if (
        session.status === 'awaiting_payment' &&
        credited >= BigInt(session.amountUnits)
      ) {
        await this.debit(tx, order.wallet, BigInt(session.amountUnits));
        await this.recordPayment(tx, session, 'card', order.transactionId);
      }
      await tx
        .update(demoPayments)
        .set({ settledAt: Date.now() })
        .where(eq(demoPayments.id, order.id));
    });
  }
  async cancelSession(wallet: string, id: string) {
    return this.locked(async (tx) => {
      const session = await this.session(id, tx);
      this.owner(session, wallet);
      if (session.status === 'paid')
        throw new ConflictException('This session is already paid.');
      await this.assertNoCardPayment(tx, id);
      const [cancelled] = await tx
        .update(usageSessions)
        .set({ status: 'cancelled' })
        .where(eq(usageSessions.id, id))
        .returning();
      return this.present(cancelled!);
    });
  }
  async claim(
    wallet: string,
    siteId: number,
    body: { id?: unknown; memoReference?: unknown },
  ) {
    const id = requestId(body?.id),
      reference = memo(body?.memoReference);
    await this.catalog.get(siteId);
    return this.locked(async (tx) => {
      const [previous] = await tx
        .select()
        .from(deviceClaims)
        .where(eq(deviceClaims.id, id));
      if (previous) {
        if (previous.wallet !== wallet || previous.siteId !== siteId)
          throw new ConflictException('Request ID already used.');
        return {
          ...previous,
          amountUsdc: displayUnits(previous.units),
          simulated: true,
        };
      }
      const available = await tx
        .select()
        .from(deviceDistributions)
        .where(
          and(
            eq(deviceDistributions.wallet, wallet),
            eq(deviceDistributions.siteId, siteId),
            isNull(deviceDistributions.claimId),
          ),
        );
      const amount = available.reduce((sum, d) => sum + BigInt(d.units), 0n);
      if (!amount)
        throw new ConflictException(
          'No paid device revenue is available to claim.',
        );
      const account = await this.wallet(tx, wallet);
      const [claim] = await tx
        .insert(deviceClaims)
        .values({
          id,
          wallet,
          siteId,
          units: amount.toString(),
          createdAt: Date.now(),
          memoReference: reference,
        })
        .returning();
      await tx
        .update(deviceDistributions)
        .set({ claimId: id })
        .where(
          and(
            eq(deviceDistributions.wallet, wallet),
            eq(deviceDistributions.siteId, siteId),
            isNull(deviceDistributions.claimId),
          ),
        );
      await tx
        .update(demoWallets)
        .set({
          balanceUnits: (BigInt(account.balanceUnits) + amount).toString(),
        })
        .where(eq(demoWallets.wallet, wallet));
      return { ...claim!, amountUsdc: displayUnits(amount), simulated: true };
    });
  }
  async tick() {
    await this.synchronize();
    const sessions = await this.database.db
      .select()
      .from(usageSessions)
      .where(eq(usageSessions.status, 'charging'));
    for (const session of sessions) await this.finishIfCharged(session.id);
  }
}
interface TokenBalance {
  accountIndex: number;
  mint: string;
  owner?: string;
  uiTokenAmount: { amount: string; decimals: number };
}
