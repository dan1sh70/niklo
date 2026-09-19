import { Controller, Get, Post, Body, Param, UseGuards, Req, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { RidesService } from './rides.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('api/v1/ride')
@UseGuards(JwtAuthGuard)
export class RidesController {
  constructor(private readonly ridesService: RidesService) {}

  @Post('estimate')
  @HttpCode(HttpStatus.OK)
  async estimateRide(@Body() estimateDto: any) {
    const data = await this.ridesService.estimateRide(estimateDto);
    return { success: true, statusCode: 200, data };
  }

  @Post('request')
  @HttpCode(HttpStatus.OK)
  async requestRide(@Req() req: any, @Body() requestDto: any) {
    const userId = req.user.id;
    const data = await this.ridesService.requestRide(userId, requestDto);
    return { success: true, statusCode: 200, data };
  }

  @Get('active')
  async getActiveRideForUser(@Req() req: any) {
    const data = await this.ridesService.getActiveRideForUser(req.user.id);
    return { success: true, statusCode: 200, data };
  }

  @Get(':id/status')
  async getRideStatus(@Param('id') id: string) {
    const data = await this.ridesService.getRideStatus(id);
    return { success: true, statusCode: 200, data };
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelRide(@Param('id') id: string) {
    const data = await this.ridesService.cancelRide(id);
    return { success: true, statusCode: 200, data };
  }

  @Post(':id/rate')
  @HttpCode(HttpStatus.OK)
  async rateRide(@Param('id') id: string, @Body() ratingDto: any) {
    const data = await this.ridesService.rateRide(id, ratingDto);
    return { success: true, statusCode: 200, data };
  }

  @Post('schedule')
  @HttpCode(HttpStatus.OK)
  async scheduleRide(@Req() req: any, @Body() scheduleDto: any) {
    const userId = req.user.id;
    const data = await this.ridesService.scheduleRide(userId, scheduleDto);
    return { success: true, statusCode: 200, data };
  }

  @Post(':id/accept')
  @HttpCode(HttpStatus.OK)
  async acceptRide(@Param('id') id: string, @Body() body: any) {
    const driverId = body?.driverId;
    if (!driverId) {
      return { success: false, statusCode: 400, message: 'driverId is required' };
    }
    await this.ridesService.acceptRide(id, driverId);
    return { success: true, statusCode: 200, data: { message: 'Ride accepted successfully' } };
  }

  @Post(':id/arrived')
  @HttpCode(HttpStatus.OK)
  async markArrived(@Param('id') id: string) {
    await this.ridesService.updateRideStatus(id, 'ARRIVED');
    return { success: true, statusCode: 200, data: { status: 'ARRIVED' } };
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  async completeRide(@Param('id') id: string, @Body() body: any) {
    if (!body?.finalLat || !body?.finalLng) {
      return { success: false, statusCode: 400, message: 'finalLat and finalLng are required' };
    }
    await this.ridesService.completeRide(id, body.finalLat, body.finalLng);
    return { success: true, statusCode: 200, data: { message: 'Ride completed successfully' } };
  }

  @Post(':id/verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Param('id') id: string, @Body() body: any) {
    const { otp } = body;
    if (!otp) {
      return { success: false, statusCode: 400, message: 'OTP is required' };
    }
    await this.ridesService.verifyRideOtp(id, otp);
    return { success: true, statusCode: 200, data: { status: 'IN_PROGRESS', started_at: new Date() } };
  }

  @Post('driver/go-online')
  @HttpCode(HttpStatus.OK)
  async goOnline(@Body() body: any) {
    const { lat, lng, driverId } = body;
    if (!driverId || lat === undefined || lng === undefined) {
      return { success: false, statusCode: 400, message: 'driverId, lat, and lng are required' };
    }
    await this.ridesService.setDriverLocation(driverId, lat, lng);
    return { success: true, statusCode: 200, data: { message: 'Driver is now online' } };
  }

  @Post('driver/go-offline')
  @HttpCode(HttpStatus.OK)
  async goOffline(@Body() body: any) {
    const { driverId } = body;
    if (!driverId) {
      return { success: false, statusCode: 400, message: 'driverId is required' };
    }
    await this.ridesService.setDriverOffline(driverId);
    return { success: true, statusCode: 200, data: { message: 'Driver is now offline' } };
  }

  @Get('my-rides')
  async getMyRides(
    @Req() req: any,
    @Query('limit') limit = '20',
    @Query('offset') offset = '0',
  ) {
    const data = await this.ridesService.getMyRides(req.user.id, +limit, +offset);
    return { success: true, statusCode: 200, data };
  }

  @Get('driver/active')
  async getActiveRideForDriver(@Req() req: any) {
    const data = await this.ridesService.getActiveRideForDriver(req.user.id);
    return { success: true, statusCode: 200, data };
  }

  @Get('driver/my-trips')
  async getDriverTrips(
    @Req() req: any,
    @Query('limit') limit = '20',
    @Query('offset') offset = '0',
  ) {
    const data = await this.ridesService.getDriverTrips(req.user.id, +limit, +offset);
    return { success: true, statusCode: 200, data };
  }

  @Get(':id/map-preview')
  async getMapPreview(@Param('id') id: string) {
    const ride = await this.ridesService.getRideMapPreview(id);
    return { success: true, statusCode: 200, data: ride };
  }

  @Get(':id')
  async getRide(@Param('id') id: string) {
    const data = await this.ridesService.getRideStatus(id);
    return { success: true, statusCode: 200, data };
  }
}
