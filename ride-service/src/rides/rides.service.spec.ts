import { Test, TestingModule } from '@nestjs/testing';
import { RidesService } from './rides.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Ride, RideStatus, RideType } from './entities/ride.entity';
import { RedisService } from '../redis/redis.service';
import { DriverDirectoryService } from './driver-directory.service';

// Bengaluru: the booked drop is ~2.7km from the pickup.
const PICKUP = { lat: 12.9716, lng: 77.5946 };
const BOOKED_DROP = { lat: 12.9916, lng: 77.6146 };

describe('RidesService', () => {
  let service: RidesService;
  let rideRepository: { findOne: jest.Mock; save: jest.Mock };
  let redisService: { publish: jest.Mock };
  let driverDirectory: { recordRideEarning: jest.Mock; lookup: jest.Mock };

  const makeRide = (overrides: Partial<Ride> = {}) =>
    ({
      id: 'ride-1',
      status: RideStatus.IN_PROGRESS,
      ride_type: RideType.SEDAN,
      pickup_location: `${PICKUP.lat},${PICKUP.lng}`,
      drop_location: `${BOOKED_DROP.lat},${BOOKED_DROP.lng}`,
      distance_km: 3.65,
      fare_estimate: 250,
      fare_final: null,
      surge_multiplier: 1.3,
      driver_id: 'driver-1',
      passenger_id: 'passenger-1',
      ...overrides,
    }) as unknown as Ride;

  beforeEach(async () => {
    rideRepository = {
      findOne: jest.fn(),
      save: jest.fn().mockImplementation((ride) => Promise.resolve(ride)),
    };
    redisService = { publish: jest.fn().mockResolvedValue(undefined) };
    driverDirectory = {
      recordRideEarning: jest.fn().mockResolvedValue(undefined),
      lookup: jest.fn().mockResolvedValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RidesService,
        { provide: getRepositoryToken(Ride), useValue: rideRepository },
        { provide: RedisService, useValue: redisService },
        { provide: DriverDirectoryService, useValue: driverDirectory },
      ],
    }).compile();

    service = module.get<RidesService>(RidesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('completeRide', () => {
    it('charges the fare the passenger was quoted when the trip ends at the booked drop', async () => {
      const ride = makeRide();
      rideRepository.findOne.mockResolvedValue(ride);

      await service.completeRide('ride-1', BOOKED_DROP.lat, BOOKED_DROP.lng);

      // Re-quoting on every completion is what used to drop this to the
      // vehicle's minimum fare whenever the driver's last fix was stale.
      expect(ride.fare_final).toBe(250);
      expect(ride.distance_km).toBe(3.65);
      expect(ride.status).toBe(RideStatus.COMPLETED);
      expect(ride.ended_at).toBeInstanceOf(Date);
    });

    it('keeps the quoted fare when the driver app sends no final position', async () => {
      const ride = makeRide();
      rideRepository.findOne.mockResolvedValue(ride);

      await service.completeRide('ride-1');

      expect(ride.fare_final).toBe(250);
      expect(ride.distance_km).toBe(3.65);
    });

    it('does not collapse the fare when the last fix is still at the pickup', async () => {
      const ride = makeRide();
      rideRepository.findOne.mockResolvedValue(ride);

      // The exact case that produced the bug: driver never moved on the map.
      await service.completeRide('ride-1', PICKUP.lat, PICKUP.lng);

      expect(ride.fare_final).toBe(250);
    });

    it('re-prices a trip that genuinely ended somewhere else', async () => {
      const ride = makeRide();
      rideRepository.findOne.mockResolvedValue(ride);

      // ~8km past the booked drop.
      await service.completeRide('ride-1', 13.0616, 77.6846);

      expect(Number(ride.distance_km)).toBeGreaterThan(3.65);
      expect(Number(ride.fare_final)).toBeGreaterThan(250);
    });

    it('re-prices at the surge captured when the ride was booked', async () => {
      const atBookingSurge = makeRide({ surge_multiplier: 1.0 } as any);
      const atPeakSurge = makeRide({ surge_multiplier: 1.4 } as any);

      rideRepository.findOne.mockResolvedValue(atBookingSurge);
      await service.completeRide('ride-1', 13.0616, 77.6846);

      rideRepository.findOne.mockResolvedValue(atPeakSurge);
      await service.completeRide('ride-1', 13.0616, 77.6846);

      // Same distance, different booked surge — so the completion-time clock
      // is not what decides the multiplier.
      expect(Number(atPeakSurge.fare_final)).toBeCloseTo(
        Number(atBookingSurge.fare_final) * 1.4,
        1,
      );
    });

    it('credits the driver exactly once even though the app completes twice', async () => {
      const ride = makeRide();
      rideRepository.findOne.mockResolvedValue(ride);

      // The partner app fires `ride:end` over the socket *and* POSTs
      // /:id/complete, so this method runs twice for every trip.
      await service.completeRide('ride-1', BOOKED_DROP.lat, BOOKED_DROP.lng);
      await service.completeRide('ride-1', BOOKED_DROP.lat, BOOKED_DROP.lng);

      expect(driverDirectory.recordRideEarning).toHaveBeenCalledTimes(1);
      expect(driverDirectory.recordRideEarning).toHaveBeenCalledWith(
        'driver-1',
        'ride-1',
        250,
      );
      expect(rideRepository.save).toHaveBeenCalledTimes(1);
    });

    it('does not credit a ride nobody drove', async () => {
      const ride = makeRide({ driver_id: null } as any);
      rideRepository.findOne.mockResolvedValue(ride);

      await service.completeRide('ride-1', BOOKED_DROP.lat, BOOKED_DROP.lng);

      expect(driverDirectory.recordRideEarning).not.toHaveBeenCalled();
    });
  });
});
