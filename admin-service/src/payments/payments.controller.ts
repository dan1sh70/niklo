import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Permissions } from '../auth/roles.guard';

@Controller('api/v1/admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('payouts')
  @Permissions('read:payouts')
  async getPayouts() {
    return this.paymentsService.getPayouts();
  }

  @Post('payouts/:id/release')
  @Permissions('approve:payouts')
  async releasePayout(@Param('id') id: string) {
    return this.paymentsService.releasePayout(id);
  }

  @Get('refunds')
  @Permissions('read:refunds')
  async getRefunds() {
    return this.paymentsService.getRefunds();
  }

  @Post('refunds/:id/process')
  @Permissions('approve:refunds')
  async processRefund(@Param('id') id: string) {
    return this.paymentsService.processRefund(id);
  }
}
