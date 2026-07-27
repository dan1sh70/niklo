import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConflictException, BadRequestException } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { Schedule, ScheduleStatus } from './entities/schedule.entity';
import {
  ScheduleSeat,
  ScheduleSeatStatus,
} from './entities/schedule-seat.entity';
import { SeatLayout, Deck, SeatType } from '../buses/entities/seat-layout.entity';

const SCHEDULE_ID = '11111111-1111-1111-1111-111111111113';
const BUS_ID = '11111111-1111-1111-1111-111111111112';

function layoutSeat(seat_number: string, is_available = true): SeatLayout {
  return {
    id: `layout-${seat_number}`,
    bus_id: BUS_ID,
    seat_number,
    deck: Deck.LOWER,
    row: 1,
    column: 1,
    seat_type: SeatType.SEATER,
    is_available,
  } as SeatLayout;
}

function bookedSeat(seat_number: string, booking_id: string): ScheduleSeat {
  return {
    id: `ss-${seat_number}`,
    schedule_id: SCHEDULE_ID,
    seat_number,
    status: ScheduleSeatStatus.BOOKED,
    booking_id,
    user_id: 'user-1',
    booked_gender: null,
  } as ScheduleSeat;
}

/**
 * Fake EntityManager backed by in-memory arrays. Enough to exercise the
 * booking rules without a database — the parts that matter here are which
 * seats are rejected and how `available_seats` moves.
 */
function buildManager(opts: {
  schedule?: Partial<Schedule> | null;
  layout: SeatLayout[];
  scheduleSeats: ScheduleSeat[];
}) {
  const schedule =
    opts.schedule === null
      ? null
      : ({
          id: SCHEDULE_ID,
          bus_id: BUS_ID,
          available_seats: 36,
          status: ScheduleStatus.SCHEDULED,
          ...opts.schedule,
        } as Schedule);

  const saved: { scheduleSeats: ScheduleSeat[] } = { scheduleSeats: [] };

  const manager = {
    findOne: jest.fn(async (entity: any) => {
      if (entity === Schedule) return schedule;
      return null;
    }),
    find: jest.fn(async (entity: any, options: any) => {
      const wanted: string[] = options?.where?.seat_number?._value ?? [];
      if (entity === SeatLayout) {
        return opts.layout.filter((s) => wanted.includes(s.seat_number));
      }
      if (entity === ScheduleSeat) {
        const rows = opts.scheduleSeats.filter((s) =>
          wanted.includes(s.seat_number),
        );
        const status = options?.where?.status;
        return status ? rows.filter((r) => r.status === status) : rows;
      }
      return [];
    }),
    create: jest.fn((_entity: any, data: any) => ({ ...data })),
    save: jest.fn(async (entity: any, data: any) => {
      if (entity === ScheduleSeat) saved.scheduleSeats = data;
      return data;
    }),
  };

  return { manager, schedule, saved };
}

describe('SchedulesService seat inventory', () => {
  let service: SchedulesService;
  let transactionImpl: (cb: (manager: any) => Promise<any>) => Promise<any>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulesService,
        { provide: getRepositoryToken(Schedule), useValue: {} },
        { provide: getRepositoryToken(SeatLayout), useValue: {} },
        { provide: getRepositoryToken(ScheduleSeat), useValue: {} },
        {
          provide: DataSource,
          useValue: {
            transaction: (cb: any) => transactionImpl(cb),
          },
        },
      ],
    }).compile();

    service = module.get(SchedulesService);
  });

  describe('bookSeats', () => {
    it('claims free seats and decrements availability', async () => {
      const { manager, schedule, saved } = buildManager({
        layout: [layoutSeat('L1A'), layoutSeat('L1B')],
        scheduleSeats: [],
      });
      transactionImpl = (cb) => cb(manager);

      const result = await service.bookSeats(SCHEDULE_ID, {
        seats: [
          { seat_number: 'L1A', gender: 'F' },
          { seat_number: 'L1B' },
        ],
        booking_id: 'booking-1',
        user_id: 'user-1',
      });

      expect(result.booked_seats).toEqual(['L1A', 'L1B']);
      expect(result.available_seats).toBe(34);
      expect(schedule!.available_seats).toBe(34);
      expect(saved.scheduleSeats).toHaveLength(2);
      expect(saved.scheduleSeats[0]).toMatchObject({
        seat_number: 'L1A',
        status: ScheduleSeatStatus.BOOKED,
        booking_id: 'booking-1',
        booked_gender: 'F',
      });
    });

    it('refuses a seat already booked on this schedule', async () => {
      const { manager, schedule } = buildManager({
        layout: [layoutSeat('L1A'), layoutSeat('L1B')],
        scheduleSeats: [bookedSeat('L1B', 'someone-elses-booking')],
      });
      transactionImpl = (cb) => cb(manager);

      await expect(
        service.bookSeats(SCHEDULE_ID, {
          seats: [{ seat_number: 'L1A' }, { seat_number: 'L1B' }],
          booking_id: 'booking-2',
        }),
      ).rejects.toBeInstanceOf(ConflictException);

      // Nothing is taken when any seat in the request is unavailable.
      expect(schedule!.available_seats).toBe(36);
    });

    it('resells a seat that was released by a cancellation', async () => {
      const released = {
        ...bookedSeat('L1A', 'old-booking'),
        status: ScheduleSeatStatus.RELEASED,
        booking_id: null,
      } as ScheduleSeat;

      const { manager, saved } = buildManager({
        layout: [layoutSeat('L1A')],
        scheduleSeats: [released],
      });
      transactionImpl = (cb) => cb(manager);

      const result = await service.bookSeats(SCHEDULE_ID, {
        seats: [{ seat_number: 'L1A' }],
        booking_id: 'booking-3',
      });

      expect(result.booked_seats).toEqual(['L1A']);
      // The existing row is flipped rather than a duplicate inserted, which is
      // what keeps the (schedule_id, seat_number) unique index intact.
      expect(saved.scheduleSeats).toHaveLength(1);
      expect(saved.scheduleSeats[0].id).toBe('ss-L1A');
      expect(saved.scheduleSeats[0].booking_id).toBe('booking-3');
    });

    it('rejects seats that do not exist on the bus', async () => {
      const { manager } = buildManager({
        layout: [layoutSeat('L1A')],
        scheduleSeats: [],
      });
      transactionImpl = (cb) => cb(manager);

      await expect(
        service.bookSeats(SCHEDULE_ID, {
          seats: [{ seat_number: 'NOPE' }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects seats blocked at the layout level', async () => {
      const { manager } = buildManager({
        layout: [layoutSeat('L1A', false)],
        scheduleSeats: [],
      });
      transactionImpl = (cb) => cb(manager);

      await expect(
        service.bookSeats(SCHEDULE_ID, { seats: [{ seat_number: 'L1A' }] }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects a request that lists the same seat twice', async () => {
      transactionImpl = () => {
        throw new Error('transaction should not be opened');
      };

      await expect(
        service.bookSeats(SCHEDULE_ID, {
          seats: [{ seat_number: 'L1A' }, { seat_number: 'L1A' }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('refuses to sell seats on a cancelled trip', async () => {
      const { manager } = buildManager({
        schedule: { status: ScheduleStatus.CANCELLED },
        layout: [layoutSeat('L1A')],
        scheduleSeats: [],
      });
      transactionImpl = (cb) => cb(manager);

      await expect(
        service.bookSeats(SCHEDULE_ID, { seats: [{ seat_number: 'L1A' }] }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('releaseSeats', () => {
    it('puts the booking\'s seats back and restores availability', async () => {
      const { manager, schedule, saved } = buildManager({
        schedule: { available_seats: 34 },
        layout: [],
        scheduleSeats: [
          bookedSeat('L1A', 'booking-1'),
          bookedSeat('L1B', 'booking-1'),
        ],
      });
      transactionImpl = (cb) => cb(manager);

      const result = await service.releaseSeats(SCHEDULE_ID, {
        seat_numbers: ['L1A', 'L1B'],
        booking_id: 'booking-1',
      });

      expect(result.released_seats).toEqual(['L1A', 'L1B']);
      expect(schedule!.available_seats).toBe(36);
      expect(saved.scheduleSeats.every((s) => s.booking_id === null)).toBe(true);
      expect(
        saved.scheduleSeats.every(
          (s) => s.status === ScheduleSeatStatus.RELEASED,
        ),
      ).toBe(true);
    });

    it('will not release a seat owned by a different booking', async () => {
      const { manager, schedule } = buildManager({
        schedule: { available_seats: 34 },
        layout: [],
        scheduleSeats: [bookedSeat('L1A', 'booking-1')],
      });
      transactionImpl = (cb) => cb(manager);

      const result = await service.releaseSeats(SCHEDULE_ID, {
        seat_numbers: ['L1A'],
        booking_id: 'a-different-booking',
      });

      expect(result.released_seats).toEqual([]);
      expect(schedule!.available_seats).toBe(34);
    });
  });
});
