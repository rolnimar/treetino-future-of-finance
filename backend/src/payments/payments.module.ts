import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from '../database/database.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { MoonpayClient } from './moonpay.client';
import { PaymentsReconciler } from './payments-reconciler.service';
import { DevicesModule } from '../devices/devices.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    DatabaseModule,
    DevicesModule,
    AuthModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 90 }]),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, MoonpayClient, PaymentsReconciler],
})
export class PaymentsModule {}
