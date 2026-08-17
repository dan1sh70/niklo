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
    const lat1 = estimateDto.pickup?.lat ?? estimateDto.pickupLatitude;
    const lng1 = estimateDto.pickup?.lng ?? estimateDto.pickupLongitude;
    const lat2 = estimateDto.drop?.lat   ?? estimateDto.dropoffLatitude;
    const lng2 = estimateDto.drop?.lng   ?? estimateDto.dropoffLongitude;

    let distanceKm = 18.5;
    let estimatedTimeMins = 32;
    let polyline = '';

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (apiKey && lat1 && lng1 && lat2 && lng2) {
      try {
        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${lat1},${lng1}&destination=${lat2},${lng2}&key=${apiKey}`;
        const response = await axios.get(url);
        if (response.data.status === 'OK' && response.data.routes.length > 0) {
          const leg = response.data.routes[0].legs[0];
          distanceKm = leg.distance.value / 1000;
          estimatedTimeMins = Math.ceil(leg.duration.value / 60);
          polyline = response.data.routes[0].overview_polyline.points;
        }
      } catch (err) {
        this.logger.error('Google Maps API failed', err);
      }
    }

    const hour = new Date().getHours();
    const isSurge = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20);
    const surgeMultiplier = isSurge ? 1.4 : 1.0;

    const BASE = 50;
    const RATES: Record<string, { ratePerKm: number; etaMins: number; label: string }> = {
      MINI:       { ratePerKm: 12, etaMins: estimatedTimeMins - 1, label: 'Mini' },
      SEDAN:      { ratePerKm: 15, etaMins: estimatedTimeMins,     label: 'Sedan' },
      SUV:        { ratePerKm: 20, etaMins: estimatedTimeMins + 2, label: 'SUV' },
      PREMIUM:    { ratePerKm: 25, etaMins: estimatedTimeMins + 3, label: 'Premium' },
      OUTSTATION: { ratePerKm: 18, etaMins: estimatedTimeMins,     label: 'Outstation' },
    };

    const options = Object.entries(RATES).map(([type, cfg]) => ({
      vehicleType:        type,
      label:              cfg.label,
      fareEstimate:       Math.round((BASE + distanceKm * cfg.ratePerKm) * surgeMultiplier),
      estimatedTimeMins:  Math.max(1, cfg.etaMins),
      etaText:            `${Math.max(1, cfg.etaMins)} mins`,
      surgeMultiplier,
      distanceKm:         Math.round(distanceKm * 10) / 10,
      polyline,
    }));

    const selected = RATES[estimateDto.rideType?.toUpperCase()] || RATES['SEDAN'];
    return {
      fareEstimate:       Math.round((BASE + distanceKm * selected.ratePerKm) * surgeMultiplier),
      surgeMultiplier,
      distanceKm:         Math.round(distanceKm * 10) / 10,
      estimatedTimeMins,
      polyline,
      options,
    };
  }

  private mapDtoToRide(dto: any): Partial<Ride> {
    const rawType = dto.vehicleType || dto.rideType || dto.ride_type || 'SEDAN';
    const rideType = rawType.toUpperCase();
    const pickupAddress = dto.pickupAddress || 'Unknown Pickup';
    const dropAddress = dto.dropAddress || dto.dropoffAddress || 'Unknown Dropoff';

    const pickupLat = dto.pickup?.lat ?? dto.pickupLatitude ?? dto.pickup_latitude ?? null;
    const pickupLng = dto.pickup?.lng ?? dto.pickupLongitude ?? dto.pickup_longitude ?? null;
    const dropLat = dto.dropoff?.lat ?? dto.dropoffLatitude ?? dto.dropoff_latitude ?? null;
    const dropLng = dto.dropoff?.lng ?? dto.dropoffLongitude ?? dto.dropoff_longitude ?? null;

    if (pickupLat === null || pickupLng === null) {
      throw new Error('Pickup coordinates are required (send pickup.lat and pickup.lng)');
    }

    return {
      ride_type:           rideType as RideType,
      pickup_address:      pickupAddress,
      dropoff_address:     dropAddress,
      pickup_latitude:     pickupLat,
      pickup_longitude:    pickupLng,
      dropoff_latitude:    dropLat ?? pickupLat,
      dropoff_longitude:   dropLng ?? pickupLng,
      distance_km:         dto.distanceKm || dto.distance_km || null,
      fare_amount:         dto.fareEstimate || dto.fare_amount || null,
      estimated_time_mins: dto.estimatedTimeMins || null,
      scheduled_at:        dto.scheduledAt || dto.scheduled_at
                             ? new Date(dto.scheduledAt || dto.scheduled_at)
                             : undefined,
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
    const lat = mapped.pickup_latitude!;
    const lng = mapped.pickup_longitude!;
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
    if (!ride) throw new NotFoundException(`Ride ${id} not found`);

    return {
      rideId:  ride.id,
      status:  ride.status,
      otp:     [RideStatus.ACCEPTED, RideStatus.ARRIVED].includes(ride.status as RideStatus)
                 ? ride.otp
                 : undefined,
      estimatedArrivalMins: ride.estimated_time_mins ?? null,
      fareFinal: ride.status === RideStatus.COMPLETED
                 ? (ride.fare_final ?? ride.fare_amount)
                 : null,
      driverDetails: ride.driver_id ? {
        id:              ride.driver_id,
        name:            ride.driver_name,
        phone:           ride.driver_phone,
        photoUrl:        ride.driver_photo_url,
        vehicleNumber:   ride.vehicle_number,
        vehicleModel:    ride.vehicle_model,
        vehicleColor:    ride.vehicle_color,
        vehicleType:     ride.ride_type,
        vehicleImageUrl: this._vehicleImageUrl(ride.ride_type),
        currentLocation: null,
      } : null,
    };
  }

  private _vehicleImageUrl(rideType: string): string {
    const map: Record<string, string> = {
      MINI:       'https://cdn.nikloapp.com/vehicles/mini.png',
      SEDAN:      'https://cdn.nikloapp.com/vehicles/sedan.png',
      SUV:        'https://cdn.nikloapp.com/vehicles/suv.png',
      PREMIUM:    'https://cdn.nikloapp.com/vehicles/premium.png',
      OUTSTATION: 'https://cdn.nikloapp.com/vehicles/suv.png',
      HOURLY:     'https://cdn.nikloapp.com/vehicles/sedan.png',
    };
    return map[rideType?.toUpperCase()] || map['SEDAN'];
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
    if (!ride || ride.status !== RideStatus.REQUESTED) return;

    let driverProfile: any = {};
    try {
      const res = await axios.get(
        `${process.env.DRIVER_SERVICE_URL || 'http://driver-service:3011'}/api/v1/driver/${driverId}/profile`,
        { timeout: 3000 },
      );
      driverProfile = res.data?.data || res.data || {};
    } catch {
      this.logger.warn(`Driver profile fetch failed for ${driverId}`);
    }

    ride.driver_id        = driverId;
    ride.driver_name      = driverProfile.name || driverProfile.full_name || null;
    ride.driver_phone     = driverProfile.phone || driverProfile.mobile || null;
    ride.driver_photo_url = driverProfile.photo_url || null;
    ride.vehicle_number   = driverProfile.vehicle_number || null;
    ride.vehicle_model    = driverProfile.vehicle_model || null;
    ride.vehicle_color    = driverProfile.vehicle_color || null;
    ride.status           = RideStatus.ACCEPTED;

    await this.rideRepository.save(ride);
    await this.redisService.publish(
      'ride:status_update',
      JSON.stringify({ rideId, status: RideStatus.ACCEPTED, driverId }),
    );
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

  async getMyRides(passengerId: string, limit = 20, offset = 0) {
    const rides = await this.rideRepository.find({
      where: { user_id: passengerId },
      order: { created_at: 'DESC' },
      take: Math.min(limit, 100),
      skip: offset,
    });
  
    return rides.map((r) => ({
      rideId:          r.id,
      status:          r.status,
      ride_type:       r.ride_type,
      pickup_address:  r.pickup_address,
      drop_address:    r.dropoff_address,
      distance_km:     r.distance_km,
      fare_estimate:   r.fare_amount,
      fare_final:      r.status === RideStatus.COMPLETED ? r.fare_amount : null,
      created_at:      r.created_at,
      ended_at:        r.updated_at,
    }));
  }
  
  async getRideMapPreview(id: string) {
    const ride = await this.rideRepository.findOne({ where: { id } });
    if (!ride) throw new NotFoundException(`Ride ${id} not found`);
    const key = process.env.GOOGLE_MAPS_API_KEY;
    const lat = ride.pickup_latitude;
    const lng = ride.pickup_longitude;
    return {
      mapUrl: `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=600x420&scale=2&maptype=roadmap&key=${key}`,
    };
  }
}
