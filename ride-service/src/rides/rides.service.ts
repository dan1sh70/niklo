import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ride, RideStatus, RideType } from './entities/ride.entity';
import { RideRating } from './entities/ride-rating.entity';
import { RedisService } from '../redis/redis.service';
import { PassengerGateway } from '../gateways/passenger.gateway';
import { forwardRef, Inject } from '@nestjs/common';
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
    @Inject(forwardRef(() => PassengerGateway))
    private readonly passengerGateway: PassengerGateway,
  ) {}

  async estimateRide(estimateDto: any) {
    const lat1 = estimateDto.pickup?.lat ?? estimateDto.pickupLatitude;
    const lng1 = estimateDto.pickup?.lng ?? estimateDto.pickupLongitude;
    const lat2 = estimateDto.drop?.lat   ?? estimateDto.dropoffLatitude;
    const lng2 = estimateDto.drop?.lng   ?? estimateDto.dropoffLongitude;

    let distanceKm = 0;
    let estimatedTimeMins = 0;
    let polyline = '';
    let resolvedViaGoogle = false;

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
          resolvedViaGoogle = true;
        }
      } catch (err) {
        this.logger.error('Google Maps API failed', err);
      }
    }

    if (!resolvedViaGoogle) {
      if (lat1 && lng1 && lat2 && lng2) {
        const directDist = this.calculateHaversineDistance(
          Number(lat1),
          Number(lng1),
          Number(lat2),
          Number(lng2),
        );
        distanceKm = Math.round(directDist * 1.3 * 10) / 10;
        estimatedTimeMins = Math.max(5, Math.round((distanceKm / 25) * 60)); // ~25 km/h city average
      } else {
        distanceKm = 10.0;
        estimatedTimeMins = 20;
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

    const pickupLat = dto.pickup?.lat ?? dto.pickupLatitude ?? dto.pickup_latitude ?? dto.pickupLat ?? null;
    const pickupLng = dto.pickup?.lng ?? dto.pickupLongitude ?? dto.pickup_longitude ?? dto.pickupLng ?? null;
    const dropLat = dto.drop?.lat ?? dto.dropoff?.lat ?? dto.dropoffLatitude ?? dto.dropoff_latitude ?? dto.dropLat ?? null;
    const dropLng = dto.drop?.lng ?? dto.dropoff?.lng ?? dto.dropoffLongitude ?? dto.dropoff_longitude ?? dto.dropLng ?? null;

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
      otp: Math.floor(1000 + Math.random() * 9000).toString().substring(0, 4),
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
    let radius = 3; // Progressive: 3km -> 7km -> 11km -> 15km -> 19km
    let matched = false;

    for (let attempts = 0; attempts < 5 && !matched; attempts++) {
      const redisClient = this.redisService.getClient();
      const tried = await redisClient.smembers(`ride:tried:${rideId}`);
      const drivers = await this.redisService.getNearbyDrivers(lat, lng, radius);
      const candidates = drivers.filter(d => !tried.includes(d));

      if (candidates && candidates.length > 0) {
        const driverId = candidates[0];

        const ride = await this.rideRepository.findOne({ where: { id: rideId } });

        // Query actual user profile
        let passengerName = 'Passenger Name';
        let passengerPhone = '+919999999999';
        try {
          const userRes = await axios.get(
            `${process.env.USER_SERVICE_URL || 'http://user-service:3002'}/api/v1/user/${ride?.user_id}/profile`,
            { timeout: 3000 }
          );
          if (userRes.data?.data) {
            passengerName = userRes.data.data.name || passengerName;
            passengerPhone = userRes.data.data.phone || passengerPhone;
          }
        } catch {
          this.logger.warn(`Could not fetch passenger profile for ${ride?.user_id}`);
        }

        await this.redisService.publish(
          'ride:new_request_queue',
          JSON.stringify({
            rideId,
            driverId,
            timeout: 30,
            pickupAddress: ride?.pickup_address,
            dropAddress: ride?.dropoff_address,
            pickupLat: ride?.pickup_latitude,
            pickupLng: ride?.pickup_longitude,
            dropLat: ride?.dropoff_latitude,
            dropLng: ride?.dropoff_longitude,
            fareEstimate: ride?.fare_amount,
            distanceKm: ride?.distance_km,
            otp: ride?.otp,
            passengerName,
            passengerPhone,
          }),
        );

        this.logger.log(`Matched driver ${driverId} for ride ${rideId} at radius ${radius}km`);
        
        // Wait for up to 30s to see if driver accepts
        for (let t = 0; t < 15; t++) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          const currentRide = await this.rideRepository.findOne({ where: { id: rideId } });
          if (currentRide?.status !== RideStatus.REQUESTED) {
            matched = true;
            break;
          }
        }

        if (!matched) {
          // 30s passed and ride is still requested (driver ignored)
          this.logger.log(`Driver ${driverId} timed out for ride ${rideId}, rejecting...`);
          await this.rejectRide(rideId, driverId);
          // rejectRide will call matchDriverExcluding which will handle the rest of the flow
          matched = true; // exit this loop since matchDriverExcluding takes over
        }
      } else {
        radius += 4; // Expand radius: 3km -> 7km -> 11km -> 15km -> 19km
        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, 3000));
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

    // Self-heal missing driver details if cached record was incomplete
    if (ride.driver_id && (!ride.driver_name || !ride.vehicle_number)) {
      try {
        const driverRes = await axios.get(
          `${process.env.DRIVER_SERVICE_URL || 'http://driver-service:3011'}/api/v1/driver/${ride.driver_id}/profile`,
          { timeout: 2500 },
        );
        const driverProfile = driverRes.data?.data || driverRes.data || {};
        const targetUserId = driverProfile.user_id || ride.driver_id;

        const userRes = await axios.get(
          `${process.env.USER_SERVICE_URL || 'http://user-service:3002'}/api/v1/user/${targetUserId}/profile`,
          { timeout: 2500 },
        );
        const userProfile = userRes.data?.data || userRes.data || {};

        let hasUpdates = false;
        if (!ride.driver_name && (userProfile.name || driverProfile.name)) {
          ride.driver_name = userProfile.name || driverProfile.name;
          hasUpdates = true;
        }
        if (!ride.driver_photo_url && (userProfile.avatar_url || userProfile.photo_url)) {
          ride.driver_photo_url = userProfile.avatar_url || userProfile.photo_url;
          hasUpdates = true;
        }
        if (!ride.vehicle_number && driverProfile.vehicle_number) {
          ride.vehicle_number = driverProfile.vehicle_number;
          hasUpdates = true;
        }
        if (hasUpdates) {
          await this.rideRepository.save(ride);
        }
      } catch (err: any) {
        this.logger.warn(`Driver self-healing failed for ride ${id}: ${err.message}`);
      }
    }

    // Fetch Passenger Contact Details
    let passengerName = 'Passenger';
    let passengerPhone = '';
    if (ride.user_id) {
      try {
        const pRes = await axios.get(
          `${process.env.USER_SERVICE_URL || 'http://user-service:3002'}/api/v1/user/${ride.user_id}/profile`,
          { timeout: 2000 },
        );
        const pData = pRes.data?.data || pRes.data || {};
        passengerName = pData.name || passengerName;
        passengerPhone = pData.phone || passengerPhone;
      } catch (_) {}
    }

    let currentLocation: { lat: number; lng: number } | null = null;
    if (ride.driver_id) {
      try {
        const locStr = await this.redisService.getClient().get(`driver:loc:${ride.driver_id}`);
        if (locStr) {
          const locObj = JSON.parse(locStr);
          currentLocation = { lat: locObj.lat, lng: locObj.lng };
        }
      } catch (err) {
        this.logger.warn(`Failed to fetch live location for driver ${ride.driver_id}`, err);
      }
    }

    return {
      rideId: ride.id,
      status: ride.status,
      otp: [RideStatus.ACCEPTED, RideStatus.ARRIVED].includes(ride.status as RideStatus)
        ? ride.otp
        : undefined,
      pickupAddress: ride.pickup_address,
      dropAddress: ride.dropoff_address,
      pickupLat: ride.pickup_latitude,
      pickupLng: ride.pickup_longitude,
      dropLat: ride.dropoff_latitude,
      dropLng: ride.dropoff_longitude,
      distanceKm: ride.distance_km,
      fareEstimate: ride.fare_amount,
      estimatedArrivalMins: ride.estimated_time_mins ?? null,
      fareFinal: ride.status === RideStatus.COMPLETED
        ? (ride.fare_final ?? ride.fare_amount)
        : null,
      passengerName,
      passengerPhone,
      driverDetails: ride.driver_id ? {
        id: ride.driver_id,
        name: ride.driver_name,
        phone: ride.driver_phone,
        photoUrl: ride.driver_photo_url,
        vehicleNumber: ride.vehicle_number,
        vehicleModel: ride.vehicle_model,
        vehicleColor: ride.vehicle_color,
        vehicleType: ride.ride_type,
        vehicleImageUrl: this._vehicleImageUrl(ride.ride_type),
        rating: 4.85,
        currentLocation,
      } : null,
      driverLocation: currentLocation,
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

  async rateRide(rideId: string, ratingDto: { rating: number; comment?: string; feedback?: string }) {
    const ride = await this.rideRepository.findOne({ where: { id: rideId } });
    if (!ride) {
      throw new NotFoundException(`Ride ${rideId} not found`);
    }
    if (ride.status !== RideStatus.COMPLETED) {
      throw new BadRequestException('Only completed rides can be rated');
    }

    const ratingValue = Math.max(1, Math.min(5, Math.round(Number(ratingDto.rating) || 5)));
    const feedbackText = ratingDto.comment || ratingDto.feedback || '';

    ride.rating = ratingValue;
    ride.feedback = feedbackText || null as any;
    await this.rideRepository.save(ride);

    if (ride.driver_id) {
      try {
        const rating = this.ratingRepository.create({
          ride_id: rideId,
          passenger_id: ride.user_id,
          driver_id: ride.driver_id,
          rating: ratingValue,
          feedback: feedbackText,
        });
        await this.ratingRepository.save(rating);
      } catch (err: any) {
        this.logger.warn(`Could not save RideRating record: ${err.message}`);
      }

      // Sync aggregate rating to driver-service
      try {
        await axios.post(
          `${process.env.DRIVER_SERVICE_URL || 'http://driver-service:3011'}/api/v1/driver/${ride.driver_id}/rating`,
          { rating: ratingValue },
          { timeout: 3000 },
        );
      } catch (err: any) {
        this.logger.warn(`Could not sync rating to driver-service: ${err.message}`);
      }
    }

    return {
      rideId: ride.id,
      rating: ride.rating,
      feedback: ride.feedback,
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
    // Check if driver is already on an active trip (GAP-09)
    const existingActiveTrip = await this.rideRepository.findOne({
      where: [
        { driver_id: driverId, status: RideStatus.ACCEPTED },
        { driver_id: driverId, status: RideStatus.ARRIVED },
        { driver_id: driverId, status: RideStatus.IN_PROGRESS },
      ],
    });

    if (existingActiveTrip && existingActiveTrip.id !== rideId) {
      throw new ConflictException(
        `Driver ${driverId} is already on active trip ${existingActiveTrip.id}. Complete it before accepting a new ride.`,
      );
    }

    // Atomic update
    const result = await this.rideRepository.createQueryBuilder()
      .update(Ride)
      .set({ status: RideStatus.ACCEPTED, driver_id: driverId })
      .where('id = :rideId AND status = :status', { rideId, status: RideStatus.REQUESTED })
      .execute();

    if (result.affected === 0) {
      throw new Error('Ride already accepted by another driver or cancelled');
    }

    const ride = await this.rideRepository.findOne({ where: { id: rideId } });
    if (!ride) return;

    let driverProfile: any = {};
    try {
      const res = await axios.get(
        `${process.env.DRIVER_SERVICE_URL || 'http://driver-service:3011'}/api/v1/driver/${driverId}/profile`,
        { timeout: 3000 },
      );
      driverProfile = res.data?.data || res.data || {};
    } catch (err: any) {
      this.logger.warn(`Driver profile fetch failed for ${driverId}: ${err?.message}`);
    }

    const targetUserId = driverProfile.user_id || driverId;
    let userProfile: any = {};
    try {
      const userRes = await axios.get(
        `${process.env.USER_SERVICE_URL || 'http://user-service:3002'}/api/v1/user/${targetUserId}/profile`,
        { timeout: 3000 },
      );
      userProfile = userRes.data?.data || userRes.data || {};
    } catch (err: any) {
      this.logger.warn(`User profile fetch failed for driver user ${targetUserId}: ${err?.message}`);
    }

    ride.driver_id        = driverId;
    ride.driver_name      = userProfile.name || userProfile.full_name || driverProfile.name || null;
    ride.driver_phone     = userProfile.phone || userProfile.mobile || driverProfile.phone || null;
    ride.driver_photo_url = userProfile.avatar_url || userProfile.photo_url || userProfile.avatar || driverProfile.photo_url || null;
    ride.vehicle_number   = driverProfile.vehicle_number || null;
    ride.vehicle_model    = driverProfile.vehicle_model || driverProfile.vehicle_type || null;
    ride.vehicle_color    = driverProfile.vehicle_color || 'White';
    ride.status           = RideStatus.ACCEPTED;

    await this.rideRepository.save(ride);
    
    // Broadcast real-time driver assigned message
    this.passengerGateway.broadcastDriverAssigned(rideId, {
      driverId,
      driverName:    ride.driver_name,
      driverPhone:   ride.driver_phone,
      driverPhoto:   ride.driver_photo_url,
      vehicleNumber: ride.vehicle_number,
      vehicleModel:  ride.vehicle_model,
      vehicleColor:  ride.vehicle_color,
      vehicleType:   ride.ride_type,
    });

    await this.redisService.publish(
      'ride:status_update',
      JSON.stringify({ rideId, status: RideStatus.ACCEPTED, driverId }),
    );
  }

  async rejectRide(rideId: string, driverId: string) {
    this.logger.log(`Ride ${rideId} rejected by driver ${driverId}`);
    
    // Mark driver as tried
    const redisClient = this.redisService.getClient();
    await redisClient.sadd(`ride:tried:${rideId}`, driverId);
    await redisClient.expire(`ride:tried:${rideId}`, 600); // 10 min TTL

    const ride = await this.rideRepository.findOne({ where: { id: rideId } });
    if (!ride || ride.status !== RideStatus.REQUESTED) return;

    await this.matchDriverExcluding(rideId, ride.pickup_latitude, ride.pickup_longitude);
  }

  private async matchDriverExcluding(rideId: string, lat: number, lng: number) {
    const redisClient = this.redisService.getClient();
    const tried = await redisClient.smembers(`ride:tried:${rideId}`);
    const drivers = await this.redisService.getNearbyDrivers(lat, lng, 10);
    const candidates = drivers.filter(d => !tried.includes(d));

    if (candidates.length === 0) {
      await this.updateRideStatus(rideId, RideStatus.CANCELLED);
      return;
    }

    const nextDriverId = candidates[0];
    const ride = await this.rideRepository.findOne({ where: { id: rideId } });
    
    let passengerName = 'Passenger Name';
    let passengerPhone = '+919999999999';
    try {
      const userRes = await axios.get(
        `${process.env.USER_SERVICE_URL || 'http://user-service:3002'}/api/v1/user/${ride?.user_id}/profile`,
        { timeout: 3000 }
      );
      if (userRes.data?.data) {
        passengerName = userRes.data.data.name || passengerName;
        passengerPhone = userRes.data.data.phone || passengerPhone;
      }
    } catch {
      this.logger.warn(`Could not fetch passenger profile for ${ride?.user_id}`);
    }

    await this.redisService.publish(
      'ride:new_request_queue',
      JSON.stringify({
        rideId,
        driverId: nextDriverId,
        timeout: 30,
        pickupAddress: ride?.pickup_address,
        dropAddress: ride?.dropoff_address,
        pickupLat: ride?.pickup_latitude,
        pickupLng: ride?.pickup_longitude,
        dropLat: ride?.dropoff_latitude,
        dropLng: ride?.dropoff_longitude,
        fareEstimate: ride?.fare_amount,
        distanceKm: ride?.distance_km,
        otp: ride?.otp,
        passengerName,
        passengerPhone,
      }),
    );
    
    // Wait for up to 30s to see if driver accepts
    let matched = false;
    for (let t = 0; t < 15; t++) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const currentRide = await this.rideRepository.findOne({ where: { id: rideId } });
      if (currentRide?.status !== RideStatus.REQUESTED) {
        matched = true;
        break;
      }
    }

    if (!matched) {
      this.logger.log(`Driver ${nextDriverId} timed out for ride ${rideId}, rejecting...`);
      await this.rejectRide(rideId, nextDriverId); // This recurse-calls matchDriverExcluding
    }
  }

  async verifyRideOtp(rideId: string, otp: string) {
    const ride = await this.rideRepository.findOne({ where: { id: rideId } });
    if (!ride) {
      throw new NotFoundException(`Ride with ID ${rideId} not found`);
    }

    const redis = this.redisService.getClient();
    const attemptsKey = `ride:otp_attempts:${rideId}`;
    const attempts = await redis.incr(attemptsKey);

    // Set 5-minute lockout TTL on first attempt
    if (attempts === 1) {
      await redis.expire(attemptsKey, 300);
    }

    const MAX_ATTEMPTS = 3;
    if (attempts > MAX_ATTEMPTS) {
      throw new BadRequestException('Too many invalid OTP attempts. Verification is locked for 5 minutes.');
    }

    if (ride.otp !== otp) {
      const remaining = MAX_ATTEMPTS - attempts;
      throw new BadRequestException(
        remaining > 0
          ? `Incorrect OTP. ${remaining} attempt(s) remaining.`
          : 'Incorrect OTP. Verification is now locked for 5 minutes.',
      );
    }

    // Success: Clear attempts counter and update status
    await redis.del(attemptsKey);
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

  private calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  async completeRide(rideId: string, finalLat: number, finalLng: number) {
    const ride = await this.rideRepository.findOne({ where: { id: rideId } });
    if (ride) {
      ride.status = RideStatus.COMPLETED;

      const actualDistanceKm = this.calculateHaversineDistance(
        ride.pickup_latitude,
        ride.pickup_longitude,
        finalLat,
        finalLng
      );

      const BASE = 50;
      const RATES: Record<string, number> = {
        MINI: 12,
        SEDAN: 15,
        SUV: 20,
        PREMIUM: 25,
        OUTSTATION: 18,
      };
      
      const ratePerKm = RATES[ride.ride_type?.toUpperCase()] || 15;
      const newFare = Math.round(BASE + actualDistanceKm * ratePerKm);

      ride.fare_final = Math.max(newFare, BASE);
      ride.ended_at = new Date();
      await this.rideRepository.save(ride);

      // Sync driver earnings to driver-service (GAP-01)
      if (ride.driver_id && ride.fare_final) {
        const platformFeePercent = Number(process.env.PLATFORM_FEE_PERCENT ?? 15);
        const driverEarningsAmount = Math.round(Number(ride.fare_final) * (1 - platformFeePercent / 100) * 100) / 100;

        try {
          const driverServiceUrl = process.env.DRIVER_SERVICE_URL || 'http://driver-service:3011';
          await axios.post(
            `${driverServiceUrl}/api/v1/driver/earnings/record`,
            {
              driverId: ride.driver_id,
              rideId: ride.id,
              amount: driverEarningsAmount,
              type: 'ride_fare',
              platformFee: Math.round(Number(ride.fare_final) * (platformFeePercent / 100) * 100) / 100,
            },
            { timeout: 5000 },
          );
          this.logger.log(`Earnings ₹${driverEarningsAmount} (fee ${platformFeePercent}%) credited to driver ${ride.driver_id}`);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          this.logger.error(`CRITICAL: Earnings credit failed for driver ${ride.driver_id} on ride ${ride.id}: ${message}`);
        }
      }

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
    await this.redisService.removeDriverFromPool(driverId);
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
      fare_final:      r.status === RideStatus.COMPLETED ? (r.fare_final ?? r.fare_amount) : null,
      created_at:      r.created_at,
      ended_at:        r.ended_at || r.updated_at,
    }));
  }

  async getDriverTrips(driverId: string, limit = 20, offset = 0) {
    let altDriverId = driverId;
    try {
      const driverRes = await axios.get(
        `${process.env.DRIVER_SERVICE_URL || 'http://driver-service:3011'}/api/v1/driver/${driverId}/profile`,
        { timeout: 2000 },
      );
      const p = driverRes.data?.data || driverRes.data || {};
      if (p.id) altDriverId = p.id;
    } catch (_) {}

    const rides = await this.rideRepository.find({
      where: [
        { driver_id: driverId },
        { driver_id: altDriverId },
      ],
      order: { created_at: 'DESC' },
      take: Math.min(limit, 100),
      skip: offset,
    });
  
    return rides.map((r) => ({
      rideId:             r.id,
      status:             r.status,
      ride_type:          r.ride_type,
      pickup_address:     r.pickup_address,
      drop_address:       r.dropoff_address,
      pickup_latitude:    r.pickup_latitude,
      pickup_longitude:   r.pickup_longitude,
      dropoff_latitude:   r.dropoff_latitude,
      dropoff_longitude:  r.dropoff_longitude,
      distance_km:        r.distance_km,
      fare_estimate:      r.fare_amount,
      fare_final:         r.fare_final,
      base_fare:          r.fare_amount ? Math.min(Number(r.fare_amount), 50) : 50,
      surge_multiplier:   r.surge_multiplier,
      payment_method:     'ONLINE / CASH',
      rider_name:         'Passenger',
      created_at:         r.created_at,
      ended_at:           r.ended_at,
    }));
  }

  async driverCancelRide(rideId: string, driverIdentifier: string, reason: string) {
    const ride = await this.rideRepository.findOne({ where: { id: rideId } });
    if (!ride) throw new NotFoundException('Ride not found');
    if (ride.status === RideStatus.COMPLETED || ride.status === RideStatus.CANCELLED) {
      throw new BadRequestException('Cannot cancel ride in its current state');
    }

    this.logger.warn(`Driver ${driverIdentifier} cancelled ride ${rideId}. Reason: ${reason}`);

    // Notify passenger via WebSocket
    await this.redisService.publish(
      'ride:status_update',
      JSON.stringify({ rideId, status: 'DRIVER_CANCELLED', reason }),
    );

    // If ride was accepted or arrived, release driver and re-dispatch
    if (ride.status === RideStatus.ACCEPTED || ride.status === RideStatus.ARRIVED) {
      const cancelledDriverId = ride.driver_id;
      ride.driver_id = null as any;
      ride.status = RideStatus.REQUESTED;
      await this.rideRepository.save(ride);

      // Re-dispatch excluding cancelling driver
      if (cancelledDriverId) {
        const redisClient = this.redisService.getClient();
        await redisClient.sadd(`ride:tried:${rideId}`, cancelledDriverId);
        await redisClient.expire(`ride:tried:${rideId}`, 600);
      }
      this.matchDriverExcluding(ride.id, ride.pickup_latitude, ride.pickup_longitude).catch((e) =>
        this.logger.error(`Re-dispatch failed after driver cancel: ${e.message}`),
      );

      return { message: 'Ride cancelled and re-dispatched to nearby drivers', redispatched: true };
    }

    ride.status = RideStatus.CANCELLED;
    await this.rideRepository.save(ride);
    return { message: 'Ride cancelled by driver', redispatched: false };
  }

  async triggerSosAlert(rideId: string, userId: string, lat: number, lng: number) {
    const ride = await this.rideRepository.findOne({ where: { id: rideId } });
    if (!ride) throw new NotFoundException('Ride not found');

    this.logger.error(`[EMERGENCY SOS] Triggered on ride ${rideId} by user ${userId} at [${lat}, ${lng}]`);

    // 1. Broadcast high-priority security event over Redis
    await this.redisService.publish(
      'security:sos_alert',
      JSON.stringify({
        rideId,
        userId,
        driverId: ride.driver_id,
        coordinates: { lat, lng },
        timestamp: new Date().toISOString(),
      }),
    );

    // 2. Forward to Notification Service to trigger emergency SMS to trusted contacts
    try {
      await axios.post(
        `${process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3009'}/api/v1/notify/sos`,
        {
          rideId,
          userId,
          driverId: ride.driver_id,
          trackingUrl: `https://niklotravel.com/track/${rideId}`,
          coordinates: { lat, lng },
        },
        { timeout: 3000 },
      );
    } catch (err: any) {
      this.logger.error(`Failed to forward SOS to notification-service: ${err.message}`);
    }

    return { success: true, message: 'SOS alert dispatched to security operations and emergency contacts' };
  }

  async getActiveRideForUser(userId: string) {
    const activeRide = await this.rideRepository.findOne({
      where: [
        { user_id: userId, status: RideStatus.REQUESTED },
        { user_id: userId, status: RideStatus.ACCEPTED },
        { user_id: userId, status: RideStatus.ARRIVED },
        { user_id: userId, status: RideStatus.IN_PROGRESS },
      ],
      order: { created_at: 'DESC' },
    });
    return activeRide ? { hasActiveRide: true, rideId: activeRide.id, status: activeRide.status } : { hasActiveRide: false };
  }

  async getActiveRideForDriver(driverId: string) {
    const activeRide = await this.rideRepository.findOne({
      where: [
        { driver_id: driverId, status: RideStatus.ACCEPTED },
        { driver_id: driverId, status: RideStatus.ARRIVED },
        { driver_id: driverId, status: RideStatus.IN_PROGRESS },
      ],
      order: { created_at: 'DESC' },
    });
    return activeRide ? { hasActiveRide: true, rideId: activeRide.id, status: activeRide.status } : { hasActiveRide: false };
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
