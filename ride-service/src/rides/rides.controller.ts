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
}
