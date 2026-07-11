import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { RidesService } from './rides.service';

@Controller('api/v1/ride')
export class RidesController {
  constructor(private readonly ridesService: RidesService) {}

  @Post('estimate')
  estimateRide(@Body() estimateDto: any) {
    return this.ridesService.estimateRide(estimateDto);
  }

  @Post('request')
  requestRide(@Body() requestDto: any) {
    return this.ridesService.requestRide(requestDto);
  }

  @Get(':id/status')
  getRideStatus(@Param('id') id: string) {
    return this.ridesService.getRideStatus(id);
  }

  @Post(':id/cancel')
  cancelRide(@Param('id') id: string) {
    return this.ridesService.cancelRide(id);
  }

  @Post(':id/rate')
  rateRide(@Param('id') id: string, @Body() ratingDto: any) {
    return this.ridesService.rateRide(id, ratingDto);
  }

  @Post('schedule')
  scheduleRide(@Body() scheduleDto: any) {
    return this.ridesService.scheduleRide(scheduleDto);
  }

  @Post(':id/accept')
  async acceptRide(@Param('id') id: string, @Body() body: any) {
    const driverId = body?.driverId || 'd1111111-1111-1111-1111-111111111111';
    await this.ridesService.acceptRide(id, driverId);
    return { success: true, message: 'Ride accepted successfully' };
  }

  @Post(':id/complete')
  async completeRide(@Param('id') id: string, @Body() body: any) {
    const finalLat = body?.finalLat ?? 12.9716;
    const finalLng = body?.finalLng ?? 77.5946;
    await this.ridesService.completeRide(id, finalLat, finalLng);
    return { success: true, message: 'Ride completed successfully' };
  }

  @Post('driver/go-online')
  async goOnline(@Body() body: any) {
    const lat = body.lat ?? 12.9716;
    const lng = body.lng ?? 77.5946;
    const driverId = body.driverId || 'd1111111-1111-1111-1111-111111111111';
    await this.ridesService.setDriverLocation(driverId, lat, lng);
    return { success: true, message: 'Driver is now online' };
  }

  @Get(':id')
  getRide(@Param('id') id: string) {
    return this.ridesService.getRideStatus(id);
  }
}
