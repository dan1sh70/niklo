import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ride, RideStatus, RideType } from './entities/ride.entity';
import { RedisService } from '../redis/redis.service';
import { DriverDirectoryService } from './driver-directory.service';
import { quoteFare, toLatLng, LatLng } from './fare';

// How long a single driver has to answer before the offer moves on.
const OFFER_TIMEOUT_MS = 20_000;

// Widening search rings. Each ring is only searched if the previous one is
// exhausted without an acceptance.
const SEARCH_RADII_KM = [5, 10, 15];

@Injectable()
export class RidesService {
  private readonly logger = new Logger(RidesService.name);

  /**
   * rideId -> resolver for the offer currently outstanding on that ride.
   *
   * Lets `acceptRide` / `rejectRide` end the wait immediately instead of
   * letting the dispatch loop sit out the full timeout.
   *
   * NOTE: in-memory, so it assumes a single ride-service replica. With more
   * than one, an accept landing on another instance will not short-circuit the
   * wait — the timeout path re-reads the ride from Postgres and still resolves
   * correctly, just up to OFFER_TIMEOUT_MS later. Move this to a Redis channel
   * before scaling out.
   */
  private readonly pendingOffers = new Map<
    string,
    (accepted: boolean) => void
  >();

  constructor(
    @InjectRepository(Ride)
    private readonly rideRepository: Repository<Ride>,
    private readonly redisService: RedisService,
    private readonly driverDirectory: DriverDirectoryService,
  ) {}

  // ── Fare ──────────────────────────────────────────────────────────────────

  async estimateRide(estimateDto: any) {
    const pickup = toLatLng(estimateDto?.pickup);
    const drop = toLatLng(estimateDto?.drop ?? estimateDto?.dropoff);
    const rideType = this.parseRideType(
      estimateDto?.rideType ?? estimateDto?.vehicleType,
    );

    const quote = quoteFare(pickup, drop, rideType);

    if (!quote) {
      // Previously this returned a fixed ₹250 for any input, including an empty
      // body. Saying "we cannot quote this" is more honest than a made-up price.
      throw new NotFoundException(
        'Valid pickup and drop coordinates are required to estimate a fare',
      );
    }

    return quote;
  }

  // ── Ride creation ─────────────────────────────────────────────────────────

  private parseRideType(raw: any): RideType {
    const value = String(raw ?? '').toUpperCase();
    return (Object.values(RideType) as string[]).includes(value)
      ? (value as RideType)
      : RideType.SEDAN;
  }

  private mapDtoToRide(dto: any): Partial<Ride> {
    const rideType = this.parseRideType(
      dto.vehicleType || dto.rideType || dto.ride_type,
    );

    const pickup = toLatLng(dto.pickup);
    const drop = toLatLng(dto.dropoff ?? dto.drop);

    const pickupAddress =
      dto.pickupAddress ||
      (typeof dto.pickup === 'string' ? dto.pickup : null) ||
      (pickup ? `${pickup.lat},${pickup.lng}` : 'Unknown Pickup');

    const dropAddress =
      dto.dropAddress ||
      (typeof dto.dropoff === 'string' ? dto.dropoff : null) ||
      (drop ? `${drop.lat},${drop.lng}` : 'Unknown Dropoff');

    // Prefer a server-side quote so a client cannot dictate its own fare.
    // Fall back to whatever the client sent only when we have no coordinates.
    const quote = quoteFare(pickup, drop, rideType);

    return {
      ride_type: rideType,
      pickup_address: pickupAddress,
      drop_address: dropAddress,
      pickup_location: pickup ? `${pickup.lat},${pickup.lng}` : undefined,
      drop_location: drop ? `${drop.lat},${drop.lng}` : undefined,
      distance_km: quote?.distanceKm ?? dto.distanceKm ?? dto.distance_km ?? null,
      fare_estimate:
        quote?.fareEstimate ?? dto.fareEstimate ?? dto.fare_estimate ?? null,
      surge_multiplier: quote?.surgeMultiplier ?? 1.0,
      scheduled_at:
        dto.scheduledAt || dto.scheduled_at
          ? new Date(dto.scheduledAt || dto.scheduled_at)
          : undefined,
    };
  }

  async requestRide(passengerId: string, requestDto: any) {
    const mapped = this.mapDtoToRide(requestDto);
    const ride = this.rideRepository.create({
      ...mapped,
      status: RideStatus.REQUESTED,
      passenger_id: passengerId,
    });
    const savedRide = await this.rideRepository.save(ride);

    const pickup = toLatLng(requestDto?.pickup);
    if (!pickup) {
      // Matching on a hardcoded fallback would silently look for drivers in the
      // wrong city, so fail loudly instead.
      this.logger.warn(
        `Ride ${savedRide.id} has no pickup coordinates — cannot match`,
      );
      await this.updateRideStatus(savedRide.id, RideStatus.CANCELLED);
      return {
        rideId: savedRide.id,
        status: RideStatus.CANCELLED,
        message: 'We could not read your pickup location. Please try again.',
      };
    }

    // Dispatch runs in the background; the client polls GET /ride/:id/status.
    void this.dispatch(savedRide.id, pickup, savedRide.ride_type).catch((err) =>
      this.logger.error(`Dispatch failed for ride ${savedRide.id}`, err),
    );

    return {
      rideId: savedRide.id,
      status: 'SEARCHING',
      message: 'Looking for nearby drivers...',
    };
  }

  // ── Dispatch ──────────────────────────────────────────────────────────────

  /**
   * Offers the ride to nearby drivers one at a time, widening the search radius
   * as each ring is exhausted.
   *
   * Replaces the previous behaviour, which offered the ride to exactly one
   * driver and then stopped: if that driver declined or simply ignored it, the
   * ride sat in REQUESTED forever with nothing to move it along.
   */
  private async dispatch(rideId: string, pickup: LatLng, rideType: RideType) {
    const tried = new Set<string>();

    for (const radiusKm of SEARCH_RADII_KM) {
      const candidates = await this.redisService.getNearbyDrivers(
        pickup.lat,
        pickup.lng,
        radiusKm,
      );

      for (const driverId of candidates) {
        if (tried.has(driverId)) continue;
        tried.add(driverId);

        // Bail out if the passenger cancelled, or another instance matched it.
        const current = await this.rideRepository.findOne({
          where: { id: rideId },
        });
        if (!current || current.status !== RideStatus.REQUESTED) {
          this.logger.log(
            `Dispatch for ride ${rideId} stopping — status is ${current?.status ?? 'gone'}`,
          );
          return;
        }

        if (!(await this.driverSuits(driverId, rideType))) continue;

        this.logger.log(
          `Offering ride ${rideId} to driver ${driverId} (within ${radiusKm}km)`,
        );

        await this.redisService.publish(
          'ride:new_request_queue',
          JSON.stringify({
            rideId,
            driverId,
            timeout: Math.round(OFFER_TIMEOUT_MS / 1000),
          }),
        );

        if (await this.awaitOfferOutcome(rideId)) {
          this.logger.log(`Ride ${rideId} accepted by driver ${driverId}`);
          return;
        }

        this.logger.log(
          `Driver ${driverId} did not take ride ${rideId} — trying the next one`,
        );
      }
    }

    this.logger.warn(
      `No driver took ride ${rideId} after trying ${tried.size} candidate(s)`,
    );
    await this.updateRideStatus(rideId, RideStatus.CANCELLED);
  }

  /**
   * Resolves true when the outstanding offer is accepted, false on rejection or
   * timeout. The timeout path re-reads the ride so an accept processed by
   * another replica is still honoured.
   */
  private awaitOfferOutcome(rideId: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const settle = (accepted: boolean) => {
        clearTimeout(timer);
        this.pendingOffers.delete(rideId);
        resolve(accepted);
      };

      const timer = setTimeout(() => {
        this.pendingOffers.delete(rideId);
        void this.rideRepository
          .findOne({ where: { id: rideId } })
          .then((ride) => resolve(ride?.status === RideStatus.ACCEPTED))
          .catch(() => resolve(false));
      }, OFFER_TIMEOUT_MS);

      this.pendingOffers.set(rideId, settle);
    });
  }

  /** Vehicle-type gate. Unknown drivers are allowed through rather than blocked. */
  private async driverSuits(
    driverId: string,
    rideType: RideType,
  ): Promise<boolean> {
    // Outstation and hourly are service modes rather than a vehicle class, so
    // any car can serve them.
    if (rideType === RideType.OUTSTATION || rideType === RideType.HOURLY) {
      return true;
    }

    const driver = await this.driverDirectory.lookup(driverId);
    if (!driver?.vehicleType) return true;

    const matches = driver.vehicleType.toUpperCase() === rideType;
    if (!matches) {
      this.logger.log(
        `Skipping driver ${driverId}: drives ${driver.vehicleType}, ride wants ${rideType}`,
      );
    }
    return matches;
  }

  // ── Reads ─────────────────────────────────────────────────────────────────

  async getRideStatus(id: string) {
    const ride = await this.rideRepository.findOne({ where: { id } });
    if (!ride) {
      throw new NotFoundException(`Ride with ID ${id} not found`);
    }

    return {
      rideId: ride.id,
      status: ride.status,
      fareEstimate: ride.fare_estimate,
      fareFinal: ride.fare_final,
      distanceKm: ride.distance_km,
      driverDetails: await this.buildDriverDetails(ride.driver_id),
    };
  }

  private async buildDriverDetails(driverId: string | null) {
    if (!driverId) return null;

    const [profile, location] = await Promise.all([
      this.driverDirectory.lookup(driverId),
      this.redisService.getDriverLocation(driverId),
    ]);

    return {
      id: driverId,
      // Not yet available anywhere: the drivers table has no name/phone/photo
      // columns and user-service is still a stub. Present as null so the shape
      // is stable once those land.
      name: null,
      phone: null,
      photoUrl: null,
      rating: null,
      vehicleType: profile?.vehicleType ?? null,
      vehicleNumber: profile?.vehicleNumber ?? null,
      currentLocation: location,
    };
  }

  // ── Mutations ─────────────────────────────────────────────────────────────

  async cancelRide(id: string) {
    const ride = await this.rideRepository.findOne({ where: { id } });
    if (!ride) {
      throw new NotFoundException(`Ride with ID ${id} not found`);
    }

    ride.status = RideStatus.CANCELLED;
    await this.rideRepository.save(ride);

    // Stop any offer still in flight for this ride.
    this.pendingOffers.get(id)?.(false);

    await this.redisService.publish(
      'ride:status_update',
      JSON.stringify({ rideId: id, status: RideStatus.CANCELLED }),
    );

    return {
      message: 'Ride cancelled successfully',
      cancellationFee: ride.driver_id ? 50 : 0,
    };
  }

  async rateRide(id: string, ratingDto: any) {
    const ride = await this.rideRepository.findOne({ where: { id } });
    if (!ride) {
      throw new NotFoundException(`Ride with ID ${id} not found`);
    }

    // TODO: persist to a `ride_ratings` table once it exists. Until then this
    // is acknowledged but not stored — do not present it as saved in the UI.
    this.logger.log(`Rating ${ratingDto?.rating} recorded for ride ${id}`);

    return {
      message: 'Rating submitted successfully',
      rating: ratingDto?.rating,
      persisted: false,
    };
  }

  async scheduleRide(passengerId: string, scheduleDto: any) {
    const mapped = this.mapDtoToRide(scheduleDto);
    const ride = this.rideRepository.create({
      ...mapped,
      status: RideStatus.REQUESTED,
      passenger_id: passengerId,
    });
    const savedRide = await this.rideRepository.save(ride);

    return {
      rideId: savedRide.id,
      message: 'Ride scheduled successfully',
      scheduledAt: savedRide.scheduled_at,
    };
  }

  // --- WebSocket Gateway called methods ---

  async acceptRide(rideId: string, driverId: string) {
    const ride = await this.rideRepository.findOne({ where: { id: rideId } });

    if (!ride) {
      this.logger.warn(`Accept for unknown ride ${rideId}`);
      return { accepted: false, reason: 'RIDE_NOT_FOUND' };
    }

    if (ride.status !== RideStatus.REQUESTED) {
      // Another driver got there first, or the passenger cancelled.
      this.logger.log(
        `Accept for ride ${rideId} ignored — already ${ride.status}`,
      );
      return { accepted: false, reason: 'ALREADY_TAKEN' };
    }

    ride.driver_id = driverId;
    ride.status = RideStatus.ACCEPTED;
    await this.rideRepository.save(ride);

    // Let the dispatch loop stop offering this ride around.
    this.pendingOffers.get(rideId)?.(true);

    await this.redisService.publish(
      'ride:status_update',
      JSON.stringify({
        rideId,
        status: RideStatus.ACCEPTED,
        driverId,
      }),
    );
    this.logger.log(`Ride ${rideId} accepted by driver ${driverId}`);
    return { accepted: true };
  }

  async rejectRide(rideId: string, driverId: string) {
    this.logger.log(`Ride ${rideId} rejected by driver ${driverId}`);
    // Release the dispatch loop immediately so the next driver is tried
    // without waiting out the offer timeout.
    this.pendingOffers.get(rideId)?.(false);
  }

  async updateRideStatus(rideId: string, status: string) {
    const ride = await this.rideRepository.findOne({ where: { id: rideId } });
    if (!ride) return;

    ride.status = status as RideStatus;
    if (status === RideStatus.IN_PROGRESS) {
      ride.started_at = new Date();
    }
    await this.rideRepository.save(ride);
    await this.redisService.publish(
      'ride:status_update',
      JSON.stringify({ rideId, status }),
    );
  }

  async completeRide(rideId: string, finalLat?: number, finalLng?: number) {
    const ride = await this.rideRepository.findOne({ where: { id: rideId } });
    if (!ride) return;

    ride.status = RideStatus.COMPLETED;
    ride.ended_at = new Date();

    // Re-quote against where the ride actually ended, so a detour or a changed
    // destination is reflected. When the driver app has no GPS fix, fall back
    // to the destination recorded at booking time; if that is missing too, keep
    // the original estimate rather than inventing a number.
    const pickup = toLatLng(ride.pickup_location);
    const actualDrop =
      toLatLng({ lat: finalLat, lng: finalLng }) ??
      toLatLng(ride.drop_location);
    const finalQuote = quoteFare(pickup, actualDrop, ride.ride_type);

    if (finalQuote) {
      ride.distance_km = finalQuote.distanceKm;
      ride.fare_final = finalQuote.fareEstimate;
    } else {
      ride.fare_final = ride.fare_estimate;
    }

    await this.rideRepository.save(ride);
    await this.redisService.publish(
      'ride:status_update',
      JSON.stringify({
        rideId,
        status: RideStatus.COMPLETED,
        fareFinal: ride.fare_final,
      }),
    );
  }

  async setDriverLocation(driverId: string, lat: number, lng: number) {
    await this.redisService.setDriverLocation(driverId, lat, lng);
  }

  async setDriverOffline(driverId: string) {
    await this.redisService.removeDriver(driverId);
  }
}
