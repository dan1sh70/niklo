import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Headers,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { HotelsService } from './hotels.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateHotelDto, UpdateHotelDto } from './dto/create-hotel.dto';
import { CreateRoomTypeDto, UpdateRoomTypeDto } from './dto/room-type.dto';
import { SearchHotelsDto } from './dto/search-hotels.dto';
import {
  CreateReviewDto,
  ReplyToReviewDto,
  TransferOwnershipDto,
  UpsertOfferDto,
} from './dto/review.dto';

/**
 * Browsing a property is public; changing one is not.
 *
 * Anything that writes — creating a property, editing rooms, replying to a
 * review, publishing an offer — is behind the JWT guard and scoped to the
 * partner who owns the property. Static paths precede `:hotelId` so they are
 * not captured by it.
 */
@Controller('api/v1/hotels')
export class HotelsController {
  constructor(private readonly hotelsService: HotelsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  createHotel(@Request() req: any, @Body() createHotelDto: CreateHotelDto) {
    return this.hotelsService.createHotel(req.user.id, createHotelDto);
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

  /** Properties managed by the signed-in partner. */
  @UseGuards(JwtAuthGuard)
  @Get('partner/properties')
  getPartnerProperties(@Request() req: any) {
    return this.hotelsService.getPartnerProperties(req.user.id);
  }

  /**
   * Ops-only: hand a property to a partner account.
   *
   * For properties that existed before partner accounts did — they have no
   * owner, so no partner can manage them. Requires the `x-admin-key` header and
   * is disabled entirely unless `ADMIN_API_KEY` is configured.
   */
  @Post(':hotelId/transfer-owner')
  transferOwnership(
    @Param('hotelId') hotelId: string,
    @Body() dto: TransferOwnershipDto,
    @Headers('x-admin-key') adminKey: string,
  ) {
    return this.hotelsService.transferOwnership(hotelId, dto.ownerId, adminKey);
  }

  @Post('search')
  searchHotels(@Body() searchParams: SearchHotelsDto) {
    return this.hotelsService.searchHotels(searchParams);
  }

  @Get(':hotelId')
  getHotelDetails(@Param('hotelId') hotelId: string) {
    return this.hotelsService.getHotelDetails(hotelId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':hotelId')
  updateHotel(
    @Request() req: any,
    @Param('hotelId') hotelId: string,
    @Body() dto: UpdateHotelDto,
  ) {
    return this.hotelsService.updateHotel(req.user.id, hotelId, dto);
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
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':hotelId/reviews')
  createReview(
    @Request() req: any,
    @Param('hotelId') hotelId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.hotelsService.createReview(req.user.id, hotelId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':hotelId/reviews/:reviewId/reply')
  replyToReview(
    @Request() req: any,
    @Param('hotelId') hotelId: string,
    @Param('reviewId') reviewId: string,
    @Body() dto: ReplyToReviewDto,
  ) {
    return this.hotelsService.replyToReview(
      req.user.id,
      hotelId,
      reviewId,
      dto,
    );
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

  // --- partner: room inventory ---------------------------------------------

  @UseGuards(JwtAuthGuard)
  @Get(':hotelId/rooms')
  listRooms(@Request() req: any, @Param('hotelId') hotelId: string) {
    return this.hotelsService.listRooms(req.user.id, hotelId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':hotelId/rooms')
  addRoom(
    @Request() req: any,
    @Param('hotelId') hotelId: string,
    @Body() dto: CreateRoomTypeDto,
  ) {
    return this.hotelsService.addRoom(req.user.id, hotelId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':hotelId/rooms/:roomId')
  updateRoom(
    @Request() req: any,
    @Param('hotelId') hotelId: string,
    @Param('roomId') roomId: string,
    @Body() dto: UpdateRoomTypeDto,
  ) {
    return this.hotelsService.updateRoom(req.user.id, hotelId, roomId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':hotelId/rooms/:roomId')
  removeRoom(
    @Request() req: any,
    @Param('hotelId') hotelId: string,
    @Param('roomId') roomId: string,
  ) {
    return this.hotelsService.removeRoom(req.user.id, hotelId, roomId);
  }

  // --- partner: offers ------------------------------------------------------

  @UseGuards(JwtAuthGuard)
  @Get(':hotelId/offers')
  listOffers(@Request() req: any, @Param('hotelId') hotelId: string) {
    return this.hotelsService.listOffers(req.user.id, hotelId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':hotelId/offers')
  addOffer(
    @Request() req: any,
    @Param('hotelId') hotelId: string,
    @Body() dto: UpsertOfferDto,
  ) {
    return this.hotelsService.addOffer(req.user.id, hotelId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':hotelId/offers/:offerId')
  removeOffer(
    @Request() req: any,
    @Param('hotelId') hotelId: string,
    @Param('offerId') offerId: string,
  ) {
    return this.hotelsService.removeOffer(req.user.id, hotelId, offerId);
  }
}
