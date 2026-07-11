import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ride, RideStatus } from './entities/ride.entity';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class RidesService {
  private readonly logger = new Logger(RidesService.name);

  constructor(
    @InjectRepository(Ride)
    private readonly rideRepository: Repository<Ride>,
    private readonly redisService: RedisService,
  ) {}

  async estimateRide(estimateDto: any) {
    const { pickup, drop, rideType } = estimateDto;
    // Mock surge and fare calculation
    return {
      fareEstimate: 250.0,
      surgeMultiplier: 1.2,
      distanceKm: 12.5,
      estimatedTimeMins: 45,
    };
  }

  private mapDtoToRide(dto: any): Partial<Ride> {
    const rawType = dto.vehicleType || dto.rideType || dto.ride_type || 'SEDAN';
    const rideType = rawType.toUpperCase();
    const pickupAddress = dto.pickupAddress || (dto.pickup ? (typeof dto.pickup === 'string' ? dto.pickup : JSON.stringify(dto.pickup)) : 'Unknown Pickup');
    const dropAddress = dto.dropAddress || (dto.dropoff ? (typeof dto.dropoff === 'string' ? dto.dropoff : JSON.stringify(dto.dropoff)) : 'Unknown Dropoff');
    const pickupLocation = dto.pickup ? (typeof dto.pickup === 'string' ? dto.pickup : `${dto.pickup.lat},${dto.pickup.lng}`) : null;
    const dropLocation = dto.dropoff ? (typeof dto.dropoff === 'string' ? dto.dropoff : `${dto.dropoff.lat},${dto.dropoff.lng}`) : null;

    return {
      ride_type: rideType as any,
      pickup_address: pickupAddress,
      drop_address: dropAddress,
      pickup_location: pickupLocation,
      drop_location: dropLocation,
      distance_km: dto.distanceKm || dto.distance_km || 10.0,
      fare_estimate: dto.fareEstimate || dto.fare_estimate || 250.00,
      scheduled_at: dto.scheduledAt || dto.scheduled_at ? new Date(dto.scheduledAt || dto.scheduled_at) : null,
    };
  }

  async requestRide(requestDto: any) {
    const mapped = this.mapDtoToRide(requestDto);
    const rideData = {
      ...mapped,
      status: RideStatus.REQUESTED,
      passenger_id: '123e4567-e89b-12d3-a456-426614174000', // Mock UUID
    };
    const ride = this.rideRepository.create(rideData);
    const savedRide = await this.rideRepository.save(ride);

    // Trigger Matching Algorithm asynchronously
    const lat = requestDto.pickup?.lat || 12.9716;
    const lng = requestDto.pickup?.lng || 77.5946;
    this.matchDriver(
      savedRide.id,
      lat,
      lng,
    ).catch((err) => {
      this.logger.error(`Matching failed for ride ${savedRide.id}`, err);
    });

    return {
      rideId: savedRide.id,
      status: 'SEARCHING',
      message: 'Looking for nearby drivers...',
    };
  }

  private async matchDriver(rideId: string, lat: number, lng: number) {
    let radius = 5; // Start with 5km
    let matched = false;

    for (let attempts = 0; attempts < 3 && !matched; attempts++) {
      const drivers = await this.redisService.getNearbyDrivers(
        lat,
        lng,
        radius,
      );

      if (drivers && drivers.length > 0) {
        // Here we would filter by vehicle type and acceptance rate
        // We take the first available driver for simplicity in this implementation
        const driverId = drivers[0];

        // Emit new request to driver via Redis PubSub (which DriverGateway could listen to)
        // Or directly if we had a Bull queue
        await this.redisService.publish(
          'ride:new_request_queue',
          JSON.stringify({ rideId, driverId, timeout: 30 }),
        );

        this.logger.log(
          `Matched driver ${driverId} for ride ${rideId} at radius ${radius}km`,
        );
        matched = true;
      } else {
        radius = 10; // Expand radius to 10km after failure
        // Wait before retry (mocked here, should use delay)
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    if (!matched) {
      this.logger.warn(`No drivers found for ride ${rideId}`);
      await this.updateRideStatus(rideId, RideStatus.CANCELLED);
    }
  }

  async getRideStatus(id: string) {
    const ride = await this.rideRepository.findOne({ where: { id } });
    if (!ride) {
      throw new NotFoundException(`Ride with ID ${id} not found`);
    }

    return {
      rideId: ride.id,
      status: ride.status,
      driverDetails: ride.driver_id
        ? { id: ride.driver_id, name: 'Driver Info' }
        : null,
    };
  }

  async cancelRide(id: string) {
    const ride = await this.rideRepository.findOne({ where: { id } });
    if (!ride) {
      throw new NotFoundException(`Ride with ID ${id} not found`);
    }

    ride.status = RideStatus.CANCELLED;
    await this.rideRepository.save(ride);

    // Notify passenger via socket
    await this.redisService.publish(
      'ride:status_update',
      JSON.stringify({ rideId: id, status: RideStatus.CANCELLED }),
    );

    return {
      message: 'Ride cancelled successfully',
      cancellationFee: ride.driver_id ? 50 : 0, // Apply fee if driver already assigned
    };
  }

  async rateRide(id: string, ratingDto: any) {
    return {
      message: 'Rating submitted successfully',
      rating: ratingDto.rating,
    };
  }

  async scheduleRide(scheduleDto: any) {
    const mapped = this.mapDtoToRide(scheduleDto);
    const rideData = {
      ...mapped,
      status: RideStatus.REQUESTED,
      passenger_id: '123e4567-e89b-12d3-a456-426614174000',
    };
    const ride = this.rideRepository.create(rideData);
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
    if (ride && ride.status === RideStatus.REQUESTED) {
      ride.driver_id = driverId;
      ride.status = RideStatus.ACCEPTED;
      await this.rideRepository.save(ride);

      // Notify passenger
      await this.redisService.publish(
        'ride:status_update',
        JSON.stringify({ rideId, status: RideStatus.ACCEPTED }),
      );
      this.logger.log(`Ride ${rideId} accepted by driver ${driverId}`);
    }
  }

  async rejectRide(rideId: string, driverId: string) {
    this.logger.log(`Ride ${rideId} rejected by driver ${driverId}`);
    // Ideally queue next driver here
  }

  async updateRideStatus(rideId: string, status: string) {
    const ride = await this.rideRepository.findOne({ where: { id: rideId } });
    if (ride) {
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
  }

  async completeRide(rideId: string, finalLat: number, finalLng: number) {
    const ride = await this.rideRepository.findOne({ where: { id: rideId } });
    if (ride) {
      ride.status = RideStatus.COMPLETED;
      ride.ended_at = new Date();
      ride.fare_final = ride.fare_estimate; // Or recalculate based on time/distance
      await this.rideRepository.save(ride);
      await this.redisService.publish(
        'ride:status_update',
        JSON.stringify({ rideId, status: RideStatus.COMPLETED }),
      );
    }
  }
}
