import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ClientGuard, type ClientRequest } from '../auth/auth.controller';
import { DeviceLedgerService } from './device-ledger.service';
import { ThrottlerGuard } from '@nestjs/throttler';

function site(value: string) {
  if (
    !/^[1-9]\d*$/.test(value) ||
    !Number.isSafeInteger(Number(value)) ||
    Number(value) > 2147483647
  )
    throw new BadRequestException('Invalid device ID.');
  return Number(value);
}
@Controller()
@ApiTags('Demo devices and revenue')
@UseGuards(ThrottlerGuard)
export class DevicesController {
  constructor(private readonly ledger: DeviceLedgerService) {}
  @Get('devices')
  @ApiOperation({
    summary: 'Persistent device catalog, funding and received revenue',
  })
  list() {
    return this.ledger.catalogResponse();
  }
  @Get('devices/portfolio/:wallet')
  @ApiOperation({
    summary: 'Backend-owned investment positions and paid, claimable revenue',
  })
  portfolio(@Param('wallet') wallet: string) {
    return this.ledger.portfolio(wallet);
  }
  @Get('demo-wallet/:wallet')
  balance(@Param('wallet') wallet: string) {
    return this.ledger.balance(wallet);
  }
  @Post('demo-wallet/deposits')
  @ApiBearerAuth()
  @UseGuards(ClientGuard)
  deposit(
    @Req() req: ClientRequest,
    @Body() body: { id?: unknown; amount?: unknown },
  ) {
    return this.ledger.deposit(req.client.wallet, body);
  }
  @Post('devices/:siteId/investments')
  @ApiBearerAuth()
  @UseGuards(ClientGuard)
  invest(
    @Req() req: ClientRequest,
    @Param('siteId') id: string,
    @Body() body: { id?: unknown; amount?: unknown; memoReference?: unknown },
  ) {
    return this.ledger.invest(req.client.wallet, site(id), body);
  }
  @Post('devices/:siteId/claims')
  @ApiBearerAuth()
  @UseGuards(ClientGuard)
  claim(
    @Req() req: ClientRequest,
    @Param('siteId') id: string,
    @Body() body: { id?: unknown; memoReference?: unknown },
  ) {
    return this.ledger.claim(req.client.wallet, site(id), body);
  }
  @Get('devices/:siteId/sessions')
  async latest(
    @Param('siteId') id: string,
    @Query('wallet') wallet: string,
    @Res() response: { json: (value: unknown) => unknown },
  ) {
    // Nest's automatic handling ends a null response without a JSON body.
    // A first-time customer must receive the explicit JSON value `null`.
    response.json(await this.ledger.latestSession(wallet, site(id)));
  }
  @Post('devices/:siteId/sessions')
  @ApiBearerAuth()
  @UseGuards(ClientGuard)
  start(
    @Req() req: ClientRequest,
    @Param('siteId') id: string,
    @Body() body: { id?: unknown; kwh?: unknown },
  ) {
    return this.ledger.start(req.client.wallet, site(id), body);
  }
  @Get('device-sessions/:id')
  session(@Param('id') id: string) {
    return this.ledger.getSession(id);
  }
  @Post('device-sessions/:id/stop')
  @ApiBearerAuth()
  @UseGuards(ClientGuard)
  stop(@Req() req: ClientRequest, @Param('id') id: string) {
    return this.ledger.stop(req.client.wallet, id);
  }
  @Post('device-sessions/:id/pay')
  @ApiBearerAuth()
  @UseGuards(ClientGuard)
  pay(
    @Req() req: ClientRequest,
    @Param('id') id: string,
    @Body() body: { memoReference?: unknown },
  ) {
    return this.ledger.pay(req.client.wallet, id, body?.memoReference);
  }
  @Post('device-sessions/:id/cancel')
  @ApiBearerAuth()
  @UseGuards(ClientGuard)
  cancel(@Req() req: ClientRequest, @Param('id') id: string) {
    return this.ledger.cancelSession(req.client.wallet, id);
  }
}
