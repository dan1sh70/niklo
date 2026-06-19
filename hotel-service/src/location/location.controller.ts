import { Controller, Get, Query } from '@nestjs/common';
import { LocationService } from './location.service';

@Controller('api/v1/location')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Get('autocomplete')
  autocomplete(@Query('q') query: string, @Query('type') type: string) {
    return this.locationService.autocomplete(query, type);
  }
}
