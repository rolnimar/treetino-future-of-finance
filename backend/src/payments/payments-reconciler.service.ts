import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { and, asc, eq, gt, gte } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { demoPayments } from '../database/schema';
import { MoonpayClient } from './moonpay.client';
import { PaymentsService } from './payments.service';

@Injectable()
export class PaymentsReconciler {
  private readonly logger = new Logger(PaymentsReconciler.name);
  private running = false;
  private cursor: string | undefined;

  constructor(
    private readonly database: DatabaseService,
    private readonly payments: PaymentsService,
    private readonly moonpay: MoonpayClient,
  ) {}

  // The browser need not stay open for a paid order to reach the portfolio.
  @Interval(30_000)
  async reconcile() {
    if (this.running || process.env.PAYMENTS_RECONCILE_ENABLED === 'false')
      return;
    try {
      this.moonpay.assertConfigured();
    } catch {
      return;
    }
    this.running = true;
    try {
      const rows = await this.database.db
        .select({ id: demoPayments.id })
        .from(demoPayments)
        .where(
          and(
            eq(demoPayments.status, 'pending'),
            gte(demoPayments.createdAt, Date.now() - 7 * 86400_000),
            this.cursor ? gt(demoPayments.id, this.cursor) : undefined,
          ),
        )
        .orderBy(asc(demoPayments.id))
        .limit(10);
      if (!rows.length) this.cursor = undefined;
      for (const row of rows) {
        this.cursor = row.id;
        try {
          await this.payments.verify(row.id);
        } catch {
          this.logger.warn(
            `Payment ${row.id} needs another verification attempt.`,
          );
        }
      }
    } catch {
      this.logger.warn(
        'Background payment verification will retry on the next cycle.',
      );
    } finally {
      this.running = false;
    }
  }
}
