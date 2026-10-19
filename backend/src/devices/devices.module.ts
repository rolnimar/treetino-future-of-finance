import { Module, Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { VictronModule } from '../victron/victron.module';
import { DeviceCatalogService } from './device-catalog.service';
import { DeviceLedgerService } from './device-ledger.service';
import { DevicesController } from './devices.controller';

@Injectable()
class DeviceLedgerWorker {
  private running = false;
  private readonly logger = new Logger(DeviceLedgerWorker.name);
  constructor(private readonly ledger: DeviceLedgerService) {}
  @Interval(5000)
  async tick() {
    if (this.running || process.env.DEVICE_LEDGER_WORKER_ENABLED === 'false')
      return;
    this.running = true;
    try {
      await this.ledger.tick();
    } catch (error) {
      this.logger.warn(
        error instanceof Error ? error.message : 'Device ledger will retry.',
      );
    } finally {
      this.running = false;
    }
  }
}
@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    VictronModule,
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 180 }]),
  ],
  providers: [DeviceCatalogService, DeviceLedgerService, DeviceLedgerWorker],
  controllers: [DevicesController],
  exports: [DeviceLedgerService],
})
export class DevicesModule {}
