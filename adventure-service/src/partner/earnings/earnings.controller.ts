import { Controller, Get, Query, Param, Req, UseGuards } from '@nestjs/common';
import { EarningsService } from './earnings.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';

@Controller('api/v1/adventure/earnings')
@UseGuards(JwtAuthGuard)
export class EarningsController {
  constructor(private readonly earningsService: EarningsService) {}

  @Get('analytics')
  async getAnalytics(@Req() req: any, @Query() query: any) {
    const data = await this.earningsService.getAnalytics(req.user.id, query);
    return { success: true, data };
  }

  @Get('payout-policy')
  getPayoutPolicy() {
    return { success: true, data: this.earningsService.getPayoutPolicy() };
  }

  @Get('settlements')
  async listSettlements(@Req() req: any, @Query() query: any) {
    const data = await this.earningsService.listSettlements(req.user.id, query);
    return { success: true, data };
  }

  @Get('settlements/:id')
  async getSettlement(@Req() req: any, @Param('id') id: string) {
    const data = await this.earningsService.getSettlement(req.user.id, id);
    return { success: true, data };
  }
}
