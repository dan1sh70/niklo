import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { HotelsService } from './hotels.service';

@Controller('api/v1/hotels')
export class HotelsController {
  constructor(private readonly hotelsService: HotelsService) {}

  @Get('popular-destinations')
  getPopularDestinations() {
    return this.hotelsService.getPopularDestinations();
  }

  @Get('stay-types')
  getStayTypes() {
    return this.hotelsService.getStayTypes();
  }

  @Get('trending')
  getTrendingHotels(@Query('limit') limit: string) {
    return this.hotelsService.getTrendingHotels(limit ? parseInt(limit, 10) : 10);
  }

  @Get('promotions/active')
  getActivePromotions() {
    return this.hotelsService.getActivePromotions();
  }

  @Get('popular-cities')
  getPopularCities() {
    return this.hotelsService.getPopularCities();
  }

  @Post('search')
  searchHotels(@Body() searchParams: any) {
    return this.hotelsService.searchHotels(searchParams);
  }

  @Get(':hotelId')
  getHotelDetails(@Param('hotelId') hotelId: string) {
    return this.hotelsService.getHotelDetails(hotelId);
  }

  @Get(':hotelId/reviews')
  getHotelReviews(
    @Param('hotelId') hotelId: string,
    @Query('sort') sort: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    return this.hotelsService.getHotelReviews(hotelId, sort, page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 20);
  }

  @Get(':hotelId/photos')
  getHotelPhotos(
    @Param('hotelId') hotelId: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    return this.hotelsService.getHotelPhotos(hotelId, page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 30);
  }
}
