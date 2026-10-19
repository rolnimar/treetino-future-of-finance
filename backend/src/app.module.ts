import { PaymentsModule } from './payments/payments.module';
import { DevicesModule } from './devices/devices.module';
import { AuthModule } from './auth/auth.module';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthController } from './health/health.controller';
import { IndexerModule } from './indexer/indexer.module';
import { ProtocolModule } from './protocol/protocol.module';

import { VictronModule } from './victron/victron.module';
import { CampaignsModule } from './campaigns/campaigns.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    AuthModule,
    ProtocolModule,
    IndexerModule,
    VictronModule,
    CampaignsModule,
    PaymentsModule,
    DevicesModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
