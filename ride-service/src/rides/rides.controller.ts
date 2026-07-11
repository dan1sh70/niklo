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
  async acceptRide(@Param('id') id: string, @Body() body: { driverId: string }) {
    await this.ridesService.acceptRide(id, body.driverId);
    return { success: true, message: 'Ride accepted successfully' };
  }

  @Post('driver/go-online')
  async goOnline(@Body() body: { driverId: string; lat: number; lng: number }) {
    await this.ridesService.setDriverLocation(body.driverId, body.lat, body.lng);
    return { success: true, message: 'Driver is now online' };
  }
}
