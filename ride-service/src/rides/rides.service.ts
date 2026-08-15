import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ride, RideStatus, RideType } from './entities/ride.entity';
import { RideRating } from './entities/ride-rating.entity';
import { RedisService } from '../redis/redis.service';
import axios from 'axios';

@Injectable()
export class RidesService {
  private readonly logger = new Logger(RidesService.name);

  constructor(
    @InjectRepository(Ride)
    private readonly rideRepository: Repository<Ride>,
    @InjectRepository(RideRating)
    private readonly ratingRepository: Repository<RideRating>,
    private readonly redisService: RedisService,
  ) {}

  async estimateRide(estimateDto: any) {
    const lat1 = estimateDto.pickupLatitude;
    const lng1 = estimateDto.pickupLongitude;
    const lat2 = estimateDto.dropoffLatitude;
    const lng2 = estimateDto.dropoffLongitude;

    let distanceKm = 18.5;
    let estimatedTimeMins = 32;
    let polyline = "a1b2c3d4e5f6g7h8i9j0";

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (apiKey && lat1 && lng1 && lat2 && lng2) {
      try {
        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${lat1},${lng1}&destination=${lat2},${lng2}&key=${apiKey}`;
        const response = await axios.get(url);
        
        if (response.data.status === 'OK' && response.data.routes.length > 0) {
          const route = response.data.routes[0];
          const leg = route.legs[0];
          
          distanceKm = leg.distance.value / 1000;
          estimatedTimeMins = Math.ceil(leg.duration.value / 60);
          polyline = route.overview_polyline.points;
        }
      } catch (err) {
        this.logger.error('Failed to fetch from Google Maps API', err);
      }
    }

    // Dynamic fare calculation (base 50 + 15 per km)
    let fareEstimate = 50 + (distanceKm * 15);
    let surgeMultiplier = 1.0;
    
    // Simulate surge pricing during certain hours
    const hour = new Date().getHours();
    if ((hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20)) {
      surgeMultiplier = 1.4;
    }
    
    fareEstimate = fareEstimate * surgeMultiplier;

    return {
      fareEstimate: Math.round(fareEstimate * 100) / 100,
      surgeMultiplier,
      distanceKm: Math.round(distanceKm * 10) / 10,
      estimatedTimeMins,
      polyline,
    };
  }

  private mapDtoToRide(dto: any): Partial<Ride> {
    const rawType = dto.vehicleType || dto.rideType || dto.ride_type || 'SEDAN';
    const rideType = rawType.toUpperCase();
    const pickupAddress = dto.pickupAddress || 'Unknown Pickup';
    const dropAddress = dto.dropAddress || dto.dropoffAddress || 'Unknown Dropoff';

    return {
      ride_type: rideType as RideType,
      pickup_address: pickupAddress,
      dropoff_address: dropAddress,
      pickup_latitude: dto.pickupLatitude ?? 15.4989,
      pickup_longitude: dto.pickupLongitude ?? 73.8278,
      dropoff_latitude: dto.dropoffLatitude ?? 15.2531,
      dropoff_longitude: dto.dropoffLongitude ?? 73.9214,
      distance_km: dto.distanceKm || dto.distance_km || 18.5,
      fare_amount: dto.fareEstimate || dto.fare_amount || 450.00,
      estimated_time_mins: dto.estimatedTimeMins || 32,
      scheduled_at: dto.scheduledAt || dto.scheduled_at ? new Date(dto.scheduledAt || dto.scheduled_at) : undefined,
    };
  }

  async requestRide(passengerId: string, requestDto: any) {
    const mapped = this.mapDtoToRide(requestDto);
    const rideData = {
      ...mapped,
      status: RideStatus.REQUESTED,
      user_id: passengerId,
      otp: Math.floor(100000 + Math.random() * 900000).toString().substring(0, 6),
    };
    const ride = this.rideRepository.create(rideData);
    const savedRide = await this.rideRepository.save(ride);

    // Trigger Matching Algorithm asynchronously
    const lat = mapped.pickup_latitude ?? 15.4989;
    const lng = mapped.pickup_longitude ?? 73.8278;
    this.matchDriver(savedRide.id, lat, lng).catch((err) => {
      this.logger.error(`Matching failed for ride ${savedRide.id}`, err);
    });

    return {
      rideId: savedRide.id,
      status: 'SEARCHING',
      message: 'Searching for nearby drivers',
    };
  }

  private async matchDriver(rideId: string, lat: number, lng: number) {
    let radius = 3; // Start with 3km as per blueprint
    let matched = false;

    for (let attempts = 0; attempts < 3 && !matched; attempts++) {
      const drivers = await this.redisService.getNearbyDrivers(lat, lng, radius);

      if (drivers && drivers.length > 0) {
        const driverId = drivers[0];

        const ride = await this.rideRepository.findOne({ where: { id: rideId } });

        await this.redisService.publish(
          'ride:new_request_queue',
          JSON.stringify({
            rideId,
            driverId,
            timeout: 30,
            pickupAddress: ride?.pickup_address,
            dropAddress: ride?.dropoff_address,
            fareEstimate: ride?.fare_amount,
            distanceKm: ride?.distance_km,
            otp: ride?.otp,
            passengerName: 'Passenger Name',
            passengerPhone: '+919999999999',
          }),
        );

        this.logger.log(`Matched driver ${driverId} for ride ${rideId} at radius ${radius}km`);
        matched = true;
      } else {
        radius += 5; // Expand radius
        // Wait before retry
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

    if (!ride.driver_id) {
      throw new Error('Cannot rate a ride without a driver');
    }

    const rating = this.ratingRepository.create({
      ride_id: id,
      passenger_id: ride.user_id,
      driver_id: ride.driver_id,
      rating: ratingDto.rating,
      feedback: ratingDto.feedback,
    });
    
    await this.ratingRepository.save(rating);

    return {
      message: 'Rating submitted successfully',
      rating: ratingDto.rating,
    };
  }

  async scheduleRide(passengerId: string, scheduleDto: any) {
    const mapped = this.mapDtoToRide(scheduleDto);
    const rideData = {
      ...mapped,
      status: RideStatus.REQUESTED,
      user_id: passengerId,
    };
    const ride = this.rideRepository.create(rideData);
    const savedRide = await this.rideRepository.save(ride);

    return {
      rideId: savedRide.id,
      message: 'Ride scheduled successfully',
      scheduledAt: savedRide.scheduled_at,
    };
  }

  async acceptRide(rideId: string, driverId: string) {
    const ride = await this.rideRepository.findOne({ where: { id: rideId } });
    if (ride && ride.status === RideStatus.REQUESTED) {
      ride.driver_id = driverId;
      ride.status = RideStatus.ACCEPTED;
      await this.rideRepository.save(ride);

      await this.redisService.publish(
        'ride:status_update',
        JSON.stringify({ rideId, status: RideStatus.ACCEPTED }),
      );
      this.logger.log(`Ride ${rideId} accepted by driver ${driverId}`);
    }
  }

  async rejectRide(rideId: string, driverId: string) {
    this.logger.log(`Ride ${rideId} rejected by driver ${driverId}`);
  }

  async verifyRideOtp(rideId: string, otp: string) {
    const ride = await this.rideRepository.findOne({ where: { id: rideId } });
    if (!ride) {
      throw new NotFoundException(`Ride with ID ${rideId} not found`);
    }
    if (ride.otp !== otp) {
      throw new Error('Invalid OTP');
    }
    await this.updateRideStatus(rideId, RideStatus.IN_PROGRESS);
  }

  async updateRideStatus(rideId: string, status: string) {
    const ride = await this.rideRepository.findOne({ where: { id: rideId } });
    if (ride) {
      ride.status = status as RideStatus;
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
      await this.rideRepository.save(ride);
      await this.redisService.publish(
        'ride:status_update',
        JSON.stringify({ rideId, status: RideStatus.COMPLETED }),
      );
    }
  }

  async setDriverLocation(driverId: string, lat: number, lng: number) {
    await this.redisService.setDriverLocation(driverId, lat, lng);
    await this.redisService.publish('driver:online_status', JSON.stringify({ driverId, status: 'online' }));
  }

  async setDriverOffline(driverId: string) {
    this.logger.log(`Setting driver ${driverId} offline`);
    await this.redisService.publish('driver:online_status', JSON.stringify({ driverId, status: 'offline' }));
  }
}
