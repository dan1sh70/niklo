import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BusServiceClient } from './bus-service.client';
import { Booking, BookingStatus, BookingType } from './entities/booking.entity';

const USER_ID = '00000000-0000-0000-0000-0000000000aa';
const SCHEDULE_ID = '11111111-1111-1111-1111-111111111113';

describe('BookingsService', () => {
  let service: BookingsService;
  let bookingRepo: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    find: jest.Mock;
    delete: jest.Mock;
  };
  let redis: { set: jest.Mock; get: jest.Mock; del: jest.Mock; expire: jest.Mock };
  let busService: {
    bookSeats: jest.Mock;
    releaseSeats: jest.Mock;
    getSchedule: jest.Mock;
    ownsOperator: jest.Mock;
  };

  /** Pretends every lock key is held by [holder]. */
  const heldBy = (holder: string | null) =>
    redis.get.mockImplementation(async () => holder);

  const baseDto = {
    booking_type: BookingType.BUS,
    schedule_id: SCHEDULE_ID,
    seat_numbers: ['L1A', 'L1B'],
    passenger_details: [
      { seat_number: 'L1A', name: 'Asha', gender: 'Female' },
      { seat_number: 'L1B', name: 'Ravi', gender: 'Male' },
    ],
    fare_breakdown: { total: 1598 },
    total_amount: 1598,
  } as any;

  beforeEach(async () => {
    bookingRepo = {
      create: jest.fn((data) => ({ ...data })),
      save: jest.fn(async (b) => ({ id: 'booking-1', ...b })),
      findOne: jest.fn(async () => ({ id: 'booking-1', ...baseDto })),
      find: jest.fn(async () => []),
      delete: jest.fn(async () => ({ affected: 1 })),
    };
    redis = {
      set: jest.fn(async () => 'OK'),
      get: jest.fn(async () => USER_ID),
      del: jest.fn(async () => 1),
      expire: jest.fn(async () => 1),
    };
    busService = {
      bookSeats: jest.fn(async () => ({ booked_seats: ['L1A', 'L1B'] })),
      releaseSeats: jest.fn(async () => ({ released_seats: [] })),
      getSchedule: jest.fn(async () => ({ operator_id: 'op-1' })),
      ownsOperator: jest.fn(async () => true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: getRepositoryToken(Booking), useValue: bookingRepo },
        { provide: 'REDIS_CLIENT', useValue: redis },
        { provide: BusServiceClient, useValue: busService },
      ],
    }).compile();

    service = module.get(BookingsService);
  });

  describe('createBooking', () => {
    it('claims the seats and normalises passenger genders', async () => {
      await service.createBooking(USER_ID, baseDto, 'Bearer token');

      expect(busService.bookSeats).toHaveBeenCalledWith(
        SCHEDULE_ID,
        {
          seats: [
            { seat_number: 'L1A', gender: 'F' },
            { seat_number: 'L1B', gender: 'M' },
          ],
          booking_id: 'booking-1',
          user_id: USER_ID,
        },
        'Bearer token',
      );
    });

    it('starts the booking as PENDING, not confirmed', async () => {
      await service.createBooking(USER_ID, baseDto, 'Bearer token');

      expect(bookingRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: BookingStatus.PENDING }),
      );
    });

    it('deletes the booking when the seats turn out to be gone', async () => {
      busService.bookSeats.mockRejectedValueOnce(
        new ConflictException({ unavailableSeats: ['L1B'] }),
      );

      await expect(
        service.createBooking(USER_ID, baseDto, 'Bearer token'),
      ).rejects.toBeInstanceOf(ConflictException);

      // No ghost booking is left behind for the user to trip over.
      expect(bookingRepo.delete).toHaveBeenCalledWith('booking-1');
    });

    it('refuses to book seats the user does not hold', async () => {
      heldBy('somebody-else');

      await expect(
        service.createBooking(USER_ID, baseDto, 'Bearer token'),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(busService.bookSeats).not.toHaveBeenCalled();
      expect(bookingRepo.save).not.toHaveBeenCalled();
    });

    it('refuses when the hold has expired', async () => {
      heldBy(null);

      await expect(
        service.createBooking(USER_ID, baseDto, 'Bearer token'),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('does not touch seat inventory for a non-seated booking', async () => {
      await service.createBooking(
        USER_ID,
        { ...baseDto, booking_type: BookingType.PACKAGE, seat_numbers: [] },
        'Bearer token',
      );

      expect(busService.bookSeats).not.toHaveBeenCalled();
    });
  });

  describe('lockSeats', () => {
    it('treats re-locking your own seats as success', async () => {
      redis.set.mockResolvedValue(null); // key already exists
      heldBy(USER_ID); // ...and it is ours

      const result = await service.lockSeats(USER_ID, {
        scheduleId: SCHEDULE_ID,
        seatIds: ['L1A'],
      });

      expect(result.lockedSeats).toEqual(['L1A']);
      expect(redis.expire).toHaveBeenCalled();
    });

    it('rolls back partial holds when any seat is taken', async () => {
      redis.set
        .mockResolvedValueOnce('OK') // L1A acquired
        .mockResolvedValueOnce(null); // L1B taken
      heldBy('somebody-else');

      await expect(
        service.lockSeats(USER_ID, {
          scheduleId: SCHEDULE_ID,
          seatIds: ['L1A', 'L1B'],
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('confirmPayment', () => {
    it('moves a paid booking to CONFIRMED', async () => {
      bookingRepo.findOne.mockResolvedValue({
        id: 'booking-1',
        status: BookingStatus.PENDING,
      });

      await service.confirmPayment('booking-1', USER_ID, {
        payment_id: '22222222-2222-2222-2222-222222222222',
      });

      expect(bookingRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: BookingStatus.CONFIRMED,
          payment_id: '22222222-2222-2222-2222-222222222222',
        }),
      );
    });

    it('is idempotent — confirming twice is not an error', async () => {
      bookingRepo.findOne.mockResolvedValue({
        id: 'booking-1',
        status: BookingStatus.CONFIRMED,
      });

      await service.confirmPayment('booking-1', USER_ID, {});

      expect(bookingRepo.save).not.toHaveBeenCalled();
    });

    it('will not confirm a cancelled booking', async () => {
      bookingRepo.findOne.mockResolvedValue({
        id: 'booking-1',
        status: BookingStatus.CANCELLED,
      });

      await expect(
        service.confirmPayment('booking-1', USER_ID, {}),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('cancelBooking', () => {
    it('puts the seats back on sale', async () => {
      bookingRepo.findOne.mockResolvedValue({
        id: 'booking-1',
        schedule_id: SCHEDULE_ID,
        seat_numbers: ['L1A'],
        status: BookingStatus.CONFIRMED,
      });

      await service.cancelBooking('booking-1', USER_ID, 'Bearer token');

      expect(busService.releaseSeats).toHaveBeenCalledWith(
        SCHEDULE_ID,
        { seat_numbers: ['L1A'], booking_id: 'booking-1' },
        'Bearer token',
      );
      expect(bookingRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: BookingStatus.CANCELLED }),
      );
    });

    it('still cancels when bus-service cannot be reached', async () => {
      bookingRepo.findOne.mockResolvedValue({
        id: 'booking-1',
        schedule_id: SCHEDULE_ID,
        seat_numbers: ['L1A'],
        status: BookingStatus.CONFIRMED,
      });
      busService.releaseSeats.mockRejectedValue(new Error('unreachable'));

      await service.cancelBooking('booking-1', USER_ID, 'Bearer token');

      expect(bookingRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: BookingStatus.CANCELLED }),
      );
    });
  });

  describe('getScheduleManifest', () => {
    it('refuses a manifest for a trip the caller does not operate', async () => {
      busService.ownsOperator.mockResolvedValue(false);

      await expect(
        service.getScheduleManifest(SCHEDULE_ID, 'Bearer token'),
      ).rejects.toThrow(/do not operate/i);

      expect(bookingRepo.find).not.toHaveBeenCalled();
    });

    it('excludes cancelled bookings from the headline totals', async () => {
      bookingRepo.find.mockResolvedValue([
        {
          status: BookingStatus.CONFIRMED,
          seat_numbers: ['L1A', 'L1B'],
          total_amount: '1598.00',
        },
        {
          status: BookingStatus.CANCELLED,
          seat_numbers: ['L2A'],
          total_amount: '799.00',
        },
      ]);

      const manifest = await service.getScheduleManifest(
        SCHEDULE_ID,
        'Bearer token',
      );

      expect(manifest.total_bookings).toBe(1);
      expect(manifest.seats_sold).toBe(2);
      expect(manifest.gross_amount).toBe(1598);
      // The cancelled row is still listed so the operator sees the churn.
      expect(manifest.bookings).toHaveLength(2);
    });
  });
});
