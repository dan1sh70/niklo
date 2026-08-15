import { Controller, Get, Query } from '@nestjs/common';
import { HomeService } from './home.service';

@Controller('api/v1')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  /**
   * 1. Fetches latest booked upcoming trip for the active user
   */
  @Get('user/active-trip')
  async getActiveTrip(@Query('userId') userId?: string) {
    const data = await this.homeService.getActiveTrip(userId);
    return { success: true, statusCode: 200, data };
  }

  /**
   * 2. Fetches location-wise smart suggestions based on user city / GPS
   */
  @Get('recommendations/smart-suggestions')
  async getSmartSuggestions(
    @Query('city') city?: string,
    @Query('latitude') latitude?: number,
    @Query('longitude') longitude?: number,
    @Query('limit') limit?: number,
  ) {
    const data = await this.homeService.getSmartSuggestions({ city, latitude, longitude, limit });
    return { success: true, statusCode: 200, data };
  }

  /**
   * 3. Fetches marketing promo banners
   */
  @Get('promotions/banners')
  async getBanners() {
    const data = await this.homeService.getBanners();
    return { success: true, statusCode: 200, data };
  }
}
