import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { HomeDashboardService } from './home-dashboard.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';

@Controller('api/v1/package-partner/home')
@UseGuards(JwtAuthGuard)
export class HomeDashboardController {
  constructor(private readonly homeService: HomeDashboardService) {}

  @Get('dashboard')
  async getDashboard(@Req() req: any) {
    const data = await this.homeService.getDashboard(req.user.id);
    return { success: true, data };
  }

  @Get('chart')
  async getChartData(@Req() req: any, @Query('period') period: string) {
    const data = await this.homeService.getChartData(req.user.id, period || 'Week');
    return { success: true, data };
  }
}
