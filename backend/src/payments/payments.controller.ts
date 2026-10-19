import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import {
  ClientGuard,
  type ClientRequest as WalletRequest,
} from '../auth/auth.controller';

interface ClientRequest {
  headers: Record<string, string | string[] | undefined>;
  socket: { remoteAddress?: string };
}

function clientIp(request: ClientRequest) {
  // Railway forwards these through the frontend API proxy.
  const header =
    request.headers['true-client-ip'] ?? request.headers['x-forwarded-for'];
  return (
    (Array.isArray(header) ? header[0] : header)?.split(',')[0].trim() ??
    request.socket.remoteAddress ??
    ''
  );
}

@Controller('payments/moonpay')
@UseGuards(ThrottlerGuard)
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post('charging/:sessionId/orders')
  @ApiBearerAuth()
  @UseGuards(ClientGuard)
  createCharging(
    @Param('sessionId') id: string,
    @Req() request: WalletRequest,
  ) {
    return this.payments.createCharging(request.client.wallet, id);
  }

  @Post('charging/:sessionId/status')
  @ApiBearerAuth()
  @UseGuards(ClientGuard)
  chargingStatus(
    @Param('sessionId') id: string,
    @Req() request: WalletRequest,
  ) {
    return this.payments.chargingOrder(request.client.wallet, id);
  }

  @Post('quote')
  quote(@Body() body: { amount?: unknown }) {
    return this.payments.quote(body?.amount);
  }

  @Post('orders')
  create(
    @Body() body: { wallet?: unknown; siteId?: unknown; amount?: unknown },
  ) {
    return this.payments.create(body);
  }

  @Post('orders/:id/sign')
  sign(
    @Param('id') id: string,
    @Body() body: { url?: unknown },
    @Req() request: ClientRequest,
  ) {
    return this.payments.sign(id, body?.url, clientIp(request));
  }

  @Post('orders/:id/checkout')
  checkout(@Param('id') id: string, @Req() request: ClientRequest) {
    return this.payments.checkout(id, clientIp(request));
  }

  @Post('orders/:id/verify')
  verify(@Param('id') id: string) {
    return this.payments.verify(id);
  }

  @Post('orders/:id/cancel')
  cancel(@Param('id') id: string) {
    return this.payments.cancel(id);
  }

  @Get('receipts')
  list(@Query('wallet') wallet: string) {
    return this.payments.list(wallet);
  }
}
