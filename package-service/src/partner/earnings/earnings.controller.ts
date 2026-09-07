import { Controller, Get, Query, Param, Req, UseGuards, Post, Body } from '@nestjs/common';
import { EarningsService } from './earnings.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';

@Controller('api/v1/package-partner/earnings')
@UseGuards(JwtAuthGuard)
export class EarningsController {
  constructor(private readonly earningsService: EarningsService) {}

  @Get('overview')
  async getOverview(@Req() req: any, @Query() query: any) {
    const data = await this.earningsService.getOverview(req.user.partnerProfileId, query);
    return { success: true, data };
  }

  @Get('chart')
  async getChartData(@Req() req: any, @Query() query: any) {
    const data = await this.earningsService.getChartData(req.user.partnerProfileId, query.period || 'month');
    return { success: true, data };
  }

  @Get('payout-policy')
  getPayoutPolicy() {
    return { success: true, data: this.earningsService.getPayoutPolicy() };
  }

  @Get('transactions')
  async listSettlements(@Req() req: any, @Query() query: any) {
    const data = await this.earningsService.listSettlements(req.user.partnerProfileId, query);
    return { success: true, data };
  }

  @Get('transactions/:id')
  async getSettlement(@Req() req: any, @Param('id') id: string) {
    const data = await this.earningsService.getSettlement(req.user.partnerProfileId, id);
    return { success: true, data };
  }

  @Get('transactions/:id/invoice')
  async getInvoice(@Req() req: any, @Param('id') id: string) {
    return { success: true, data: { downloadUrl: `https://storage.niklo.com/invoices/tax_invoice_${id}.pdf` } };
  }

  @Post('withdraw')
  async withdraw(@Req() req: any, @Body() body: any) {
    const data = await this.earningsService.requestWithdrawal(req.user.partnerProfileId, body.amount);
    return { success: true, message: 'Withdrawal requested successfully', data };
  }
}
