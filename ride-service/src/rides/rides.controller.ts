import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
  Req,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { RidesService } from './rides.service';
import { JwtAuthGuard } from './jwt-auth.guard';

/**
 * Every route here is behind a verified token, and every route that names a
 * ride or a driver also checks the caller is entitled to it.
 *
 * Both halves matter. The guard used to wave everyone through, but even with a
 * real guard these routes took the subject from the URL or the request body —
 * so any signed-in account could cancel a stranger's ride, close out a trip it
 * never drove, or put another driver offline. The identity now always comes
 * from the token; ids in the body are only ever cross-checked against it.
 */
@Controller('api/v1/ride')
@UseGuards(JwtAuthGuard)
export class RidesController {
  constructor(private readonly ridesService: RidesService) {}

  /** The signed-in account. The guard guarantees this is present. */
  private callerId(req: any): string {
    return req.user.id;
  }

  @Post('estimate')
  estimateRide(@Body() estimateDto: any) {
    return this.ridesService.estimateRide(estimateDto);
  }

  @Post('request')
  requestRide(@Req() req: any, @Body() requestDto: any) {
    return this.ridesService.requestRide(this.callerId(req), requestDto);
  }

  @Post('schedule')
  scheduleRide(@Req() req: any, @Body() scheduleDto: any) {
    return this.ridesService.scheduleRide(this.callerId(req), scheduleDto);
  }

  // ── A named ride: passenger or assigned driver only ───────────────────────

  @Get(':id/status')
  async getRideStatus(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    await this.ridesService.findForParticipant(id, this.callerId(req));
    return this.ridesService.getRideStatus(id);
  }

  @Post(':id/cancel')
  async cancelRide(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    // Either side can call a ride off, so a driver who cannot make the pickup
    // is not forced to leave the passenger waiting.
    await this.ridesService.findForParticipant(id, this.callerId(req));
    return this.ridesService.cancelRide(id);
  }

  @Post(':id/rate')
  async rateRide(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() ratingDto: any,
  ) {
    // Rating is the passenger's verdict on the trip they actually took.
    await this.ridesService.findForPassenger(id, this.callerId(req));
    return this.ridesService.rateRide(id, ratingDto);
  }

  // ── Driver side ───────────────────────────────────────────────────────────

  @Post(':id/accept')
  async acceptRide(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    // Taken from the token, never the body. A driverId in the body was all it
    // used to take to accept a ride as somebody else.
    const driverId = this.callerId(req);

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
  async completeRide(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
  ) {
    // Completing a ride is what fixes the fare, so only the driver on it may.
    await this.ridesService.findForAssignedDriver(id, this.callerId(req));

    // Coordinates are optional: when the driver app has no GPS fix we fall back
    // to the ride's stored drop location rather than the Bengaluru default this
    // used to assume, which silently recorded the wrong end point and fare.
    await this.ridesService.completeRide(id, body?.finalLat, body?.finalLng);
    return { success: true, message: 'Ride completed successfully' };
  }

  @Post('driver/go-online')
  async goOnline(@Req() req: any, @Body() body: any) {
    const driverId = this.assertSelf(req, body?.driverId);
    if (body?.lat == null || body?.lng == null) {
      throw new BadRequestException('lat and lng are required');
    }
    await this.ridesService.setDriverLocation(driverId, body.lat, body.lng);
    return { success: true, message: 'Driver is now online' };
  }

  @Post('driver/go-offline')
  async goOffline(@Req() req: any, @Body() body: any) {
    const driverId = this.assertSelf(req, body?.driverId);
    await this.ridesService.setDriverOffline(driverId);
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
    return this.ridesService.getPassengerRides(
      this.callerId(req),
      Number(limit),
    );
  }

  /**
   * The same list under the name the customer app asks for.
   *
   * `/ride/history` was never declared, so it fell through to `@Get(':id')`
   * and asked Postgres for a ride whose id is the literal "history". Both
   * names now answer, rather than one of them being a 500.
   */
  @Get('history')
  getHistory(@Req() req: any, @Query('limit') limit?: string) {
    return this.getMyRides(req, limit);
  }

  @Get('driver/:driverId/trips')
  getDriverTrips(
    @Req() req: any,
    @Param('driverId') driverId: string,
    @Query('limit') limit?: string,
  ) {
    // A driver's trip list is their earnings history; the id in the path has to
    // be their own.
    return this.ridesService.getDriverTrips(
      this.assertSelf(req, driverId),
      Number(limit),
    );
  }

  @Get(':id')
  async getRide(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    await this.ridesService.findForParticipant(id, this.callerId(req));
    return this.ridesService.getRideStatus(id);
  }

  /**
   * Resolves a driver id the client supplied against the token.
   *
   * Callers may keep sending their own id — both apps read it from the profile
   * endpoint, which returns the same id the token carries — but sending someone
   * else's is refused rather than honoured.
   */
  private assertSelf(req: any, claimed: unknown): string {
    const callerId = this.callerId(req);
    if (claimed != null && claimed !== '' && claimed !== callerId) {
      throw new ForbiddenException('You can only act as yourself');
    }
    return callerId;
  }
}
