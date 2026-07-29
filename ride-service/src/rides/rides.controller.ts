import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { RidesService } from './rides.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('api/v1/ride')
@UseGuards(JwtAuthGuard)
export class RidesController {
  constructor(private readonly ridesService: RidesService) {}

  @Post('estimate')
  estimateRide(@Body() estimateDto: any) {
    return this.ridesService.estimateRide(estimateDto);
  }

  @Post('request')
  requestRide(@Req() req: any, @Body() requestDto: any) {
    const userId = req.user.id;
    return this.ridesService.requestRide(userId, requestDto);
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
  scheduleRide(@Req() req: any, @Body() scheduleDto: any) {
    const userId = req.user.id;
    return this.ridesService.scheduleRide(userId, scheduleDto);
  }

  @Post(':id/accept')
  async acceptRide(@Param('id') id: string, @Body() body: any) {
    // No seeded-driver fallback: accepting on behalf of an unnamed driver made
    // every anonymous call land on d1111111-… and take over someone's ride.
    const driverId = body?.driverId;
    if (!driverId) {
      throw new BadRequestException('driverId is required');
    }

    const result = await this.ridesService.acceptRide(id, driverId);
    if (!result.accepted) {
      // The offer moved on, or the passenger cancelled. Tell the driver app so
      // it can dismiss the request card instead of showing a false success.
      throw new ConflictException(
        result.reason === 'RIDE_NOT_FOUND'
          ? 'Ride not found'
          : 'This ride is no longer available',
      );
    }
    return { success: true, message: 'Ride accepted successfully' };
  }

  @Post(':id/complete')
  async completeRide(@Param('id') id: string, @Body() body: any) {
    // Coordinates are optional: when the driver app has no GPS fix we fall back
    // to the ride's stored drop location rather than the Bengaluru default this
    // used to assume, which silently recorded the wrong end point and fare.
    await this.ridesService.completeRide(id, body?.finalLat, body?.finalLng);
    return { success: true, message: 'Ride completed successfully' };
  }

  @Post('driver/go-online')
  async goOnline(@Body() body: any) {
    if (!body?.driverId) {
      throw new BadRequestException('driverId is required');
    }
    if (body.lat == null || body.lng == null) {
      throw new BadRequestException('lat and lng are required');
    }
    await this.ridesService.setDriverLocation(body.driverId, body.lat, body.lng);
    return { success: true, message: 'Driver is now online' };
  }

  @Post('driver/go-offline')
  async goOffline(@Body() body: any) {
    if (!body?.driverId) {
      throw new BadRequestException('driverId is required');
    }
    await this.ridesService.setDriverOffline(body.driverId);
    return { success: true, message: 'Driver is now offline' };
  }

  // ── History ───────────────────────────────────────────────────────────────
  //
  // These must stay ABOVE `@Get(':id')`. Nest matches in declaration order, so
  // a single-segment route declared after it is swallowed — `/ride/my-rides`
  // would be read as a ride whose id is the literal "my-rides" and blow up in
  // Postgres as an invalid uuid rather than 404ing.

  /** Rides this passenger has taken, newest first. */
  @Get('my-rides')
  getMyRides(@Req() req: any, @Query('limit') limit?: string) {
    // Reading req.user.id blind would 500 whenever the guard did not populate
    // it. Refusing is the only safe answer here — falling back to a default
    // passenger would hand the caller somebody else's ride history.
    const passengerId = req?.user?.id;
    if (!passengerId) {
      throw new UnauthorizedException('Could not identify the passenger');
    }
    return this.ridesService.getPassengerRides(passengerId, Number(limit));
  }

  @Get('driver/:driverId/trips')
  getDriverTrips(
    @Param('driverId') driverId: string,
    @Query('limit') limit?: string,
  ) {
    return this.ridesService.getDriverTrips(driverId, Number(limit));
  }

  @Get(':id')
  getRide(@Param('id') id: string) {
    return this.ridesService.getRideStatus(id);
  }
}
