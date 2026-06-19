import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ride, RideStatus } from './entities/ride.entity';

@Injectable()
export class RidesService {
  constructor(
    @InjectRepository(Ride)
    private readonly rideRepository: Repository<Ride>,
  ) {}

  async estimateRide(estimateDto: any) {
    const { pickup, drop, rideType } = estimateDto;
    // Mock surge and fare calculation
    return {
      fareEstimate: 250.00,
      surgeMultiplier: 1.2,
      distanceKm: 12.5,
      estimatedTimeMins: 45,
    };
  }

  async requestRide(requestDto: any) {
    const rideData = {
      ...requestDto,
      status: RideStatus.REQUESTED,
      passenger_id: '123e4567-e89b-12d3-a456-426614174000', // Mock UUID
    };
    const ride = this.rideRepository.create(rideData as Partial<Ride>);

    const savedRide = await this.rideRepository.save(ride);

    return {
      rideId: savedRide.id,
      status: 'SEARCHING',
      message: 'Looking for nearby drivers...',
    };
  }

  async getRideStatus(id: string) {
    const ride = await this.rideRepository.findOne({ where: { id } });
    if (!ride) {
      throw new NotFoundException(`Ride with ID ${id} not found`);
    }

    return {
      rideId: ride.id,
      status: ride.status,
      driverDetails: ride.driver_id ? { id: ride.driver_id, name: 'Driver Info' } : null,
    };
  }

  async cancelRide(id: string) {
    const ride = await this.rideRepository.findOne({ where: { id } });
    if (!ride) {
      throw new NotFoundException(`Ride with ID ${id} not found`);
    }

    ride.status = RideStatus.CANCELLED;
    await this.rideRepository.save(ride);

    return {
      message: 'Ride cancelled successfully',
      cancellationFee: 0,
    };
  }

  async rateRide(id: string, ratingDto: any) {
    return {
      message: 'Rating submitted successfully',
      rating: ratingDto.rating,
    };
  }

  async scheduleRide(scheduleDto: any) {
    const rideData = {
      ...scheduleDto,
      status: RideStatus.REQUESTED,
      passenger_id: '123e4567-e89b-12d3-a456-426614174000',
    };
    const ride = this.rideRepository.create(rideData as Partial<Ride>);

    const savedRide = await this.rideRepository.save(ride);

    return {
      rideId: savedRide.id,
      message: 'Ride scheduled successfully',
      scheduledAt: savedRide.scheduled_at,
    };
  }
}
