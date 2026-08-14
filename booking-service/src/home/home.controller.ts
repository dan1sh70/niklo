import { Controller, Get, Query } from '@nestjs/common';
import { HomeService } from './home.service';

@Controller('api/v1')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get('user/active-trip')
  async getActiveTrip() {
    const data = await this.homeService.getActiveTrip();
    return { success: true, statusCode: 200, data };
  }

  @Get('recommendations/smart-suggestions')
  async getSmartSuggestions(@Query() query: any) {
    const data = await this.homeService.getSmartSuggestions(query);
    return { success: true, statusCode: 200, data };
  }

  @Get('promotions/banners')
  async getBanners() {
    const data = await this.homeService.getBanners();
    return { success: true, statusCode: 200, data };
  }
}
