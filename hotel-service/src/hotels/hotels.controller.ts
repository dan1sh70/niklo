import { Controller, Get, Post, Body, Param, Query, UseGuards, Req, Patch, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { HotelsService } from './hotels.service';
import { CreateHotelDto } from './dto/create-hotel.dto';

@Controller('api/v1/hotels')
export class HotelsController {
  constructor(private readonly hotelsService: HotelsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  createHotel(@Req() req: any, @Body() createHotelDto: CreateHotelDto) {
    const partnerId = req.user.id;
    // Inject partnerId into DTO if needed or pass directly
    return this.hotelsService.createHotel({ ...createHotelDto, partner_id: partnerId });
  }

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
    return this.hotelsService.getTrendingHotels(
      limit ? parseInt(limit, 10) : 10,
    );
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
  @HttpCode(HttpStatus.OK)
  async searchHotels(@Body() searchParams: any) {
    const data = await this.hotelsService.searchHotels(searchParams);
    return { success: true, statusCode: 200, data };
  }

  @Post(':hotelId/check-availability')
  @HttpCode(HttpStatus.OK)
  async checkAvailability(@Param('hotelId') hotelId: string, @Body() checkParams: any) {
    const data = await this.hotelsService.checkAvailability(hotelId, checkParams);
    return { success: true, statusCode: 200, data };
  }

  @Get(':hotelId')
  async getHotelDetails(@Param('hotelId') hotelId: string) {
    const data = await this.hotelsService.getHotelDetails(hotelId);
    return { success: true, statusCode: 200, data };
  }

  @Get(':hotelId/reviews')
  getHotelReviews(
    @Param('hotelId') hotelId: string,
    @Query('sort') sort: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    return this.hotelsService.getHotelReviews(
      hotelId,
      sort,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
  }

  @UseGuards(JwtAuthGuard)
  @Post(':hotelId/reviews')
  @HttpCode(HttpStatus.OK)
  submitReview(@Req() req: any, @Param('hotelId') hotelId: string, @Body() body: any) {
    return this.hotelsService.submitReview(req.user.id, hotelId, body);
  }

  @Get(':hotelId/photos')
  getHotelPhotos(
    @Param('hotelId') hotelId: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    return this.hotelsService.getHotelPhotos(
      hotelId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 30,
    );
  }

  // --- HOTEL PARTNER PROPERTY MANAGEMENT ENDPOINTS --- //

  @UseGuards(JwtAuthGuard)
  @Get('partner/properties')
  getPartnerProperties(@Req() req: any) {
    return this.hotelsService.getPartnerProperties(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':hotelId/rooms')
  getHotelRooms(@Param('hotelId') hotelId: string) {
    return this.hotelsService.getHotelRooms(hotelId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':hotelId/rooms')
  addHotelRoom(@Req() req: any, @Param('hotelId') hotelId: string, @Body() roomData: any) {
    return this.hotelsService.addHotelRoom(hotelId, req.user.id, roomData);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':hotelId/rooms/:roomId')
  updateHotelRoom(@Req() req: any, @Param('hotelId') hotelId: string, @Param('roomId') roomId: string, @Body() roomData: any) {
    return this.hotelsService.updateHotelRoom(hotelId, roomId, req.user.id, roomData);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':hotelId/rooms/:roomId')
  deleteHotelRoom(@Req() req: any, @Param('hotelId') hotelId: string, @Param('roomId') roomId: string) {
    return this.hotelsService.deleteHotelRoom(hotelId, roomId, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':hotelId/offers')
  getHotelOffers(@Param('hotelId') hotelId: string) {
    return this.hotelsService.getHotelOffers(hotelId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':hotelId/offers')
  addHotelOffer(@Req() req: any, @Param('hotelId') hotelId: string, @Body() offerData: any) {
    return this.hotelsService.addHotelOffer(hotelId, req.user.id, offerData);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':hotelId/offers/:offerId')
  updateHotelOffer(@Req() req: any, @Param('hotelId') hotelId: string, @Param('offerId') offerId: string, @Body() offerData: any) {
    return this.hotelsService.updateHotelOffer(hotelId, offerId, req.user.id, offerData);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':hotelId/offers/:offerId')
  deleteHotelOffer(@Req() req: any, @Param('hotelId') hotelId: string, @Param('offerId') offerId: string) {
    return this.hotelsService.deleteHotelOffer(hotelId, offerId, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':hotelId/reviews/:reviewId/reply')
  replyToReview(@Req() req: any, @Param('hotelId') hotelId: string, @Param('reviewId') reviewId: string, @Body() replyData: any) {
    return this.hotelsService.replyToReview(hotelId, reviewId, req.user.id, replyData);
  }
}
