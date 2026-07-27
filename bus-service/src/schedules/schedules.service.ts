import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Schedule, ScheduleStatus } from './entities/schedule.entity';
import {
  ScheduleSeat,
  ScheduleSeatStatus,
} from './entities/schedule-seat.entity';
import { CreateScheduleDto, UpdateScheduleDto } from './dto/schedule.dto';
import { BookSeatsDto, ReleaseSeatsDto } from './dto/seat-booking.dto';
import { SeatLayout } from '../buses/entities/seat-layout.entity';

@Injectable()
export class SchedulesService {
  constructor(
    @InjectRepository(Schedule)
    private readonly scheduleRepo: Repository<Schedule>,
    @InjectRepository(SeatLayout)
    private readonly seatRepo: Repository<SeatLayout>,
    @InjectRepository(ScheduleSeat)
    private readonly scheduleSeatRepo: Repository<ScheduleSeat>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateScheduleDto): Promise<Schedule> {
    const schedule = this.scheduleRepo.create(dto);
    return this.scheduleRepo.save(schedule);
  }

  async findAll(
    routeId?: string,
    date?: string,
    operatorId?: string,
  ): Promise<Schedule[]> {
    const qb = this.scheduleRepo
      .createQueryBuilder('schedule')
      .leftJoinAndSelect('schedule.route', 'route')
      .leftJoinAndSelect('schedule.bus', 'bus')
      .leftJoinAndSelect('schedule.operator', 'operator')
      .where('schedule.status != :cancelled', {
        cancelled: ScheduleStatus.CANCELLED,
      });

    if (routeId) {
      qb.andWhere('schedule.route_id = :routeId', { routeId });
    }
    if (date) {
      qb.andWhere('schedule.departure_date = :date', { date });
    }
    if (operatorId) {
      qb.andWhere('schedule.operator_id = :operatorId', { operatorId });
    }

    return qb.orderBy('schedule.departure_time', 'ASC').getMany();
  }

  async findOne(id: string): Promise<Schedule> {
    const schedule = await this.scheduleRepo.findOne({
      where: { id },
      relations: {
        route: { boarding_points: true, dropping_points: true },
        bus: true,
        operator: true,
      },
    });
    if (!schedule) throw new NotFoundException('Schedule not found');
    return schedule;
  }

  /**
   * Seat map for one trip: the bus's physical layout overlaid with what has
   * actually been sold on *this* schedule, plus the fare each seat costs.
   *
   * `is_available` is the answer the client should trust — it folds in both the
   * permanently-blocked seats (layout) and the seats sold for this departure.
   */
  async getSeats(scheduleId: string) {
    const schedule = await this.findOne(scheduleId);
    const seats = await this.seatRepo.find({
      where: { bus_id: schedule.bus_id },
      order: { deck: 'ASC', row: 'ASC', column: 'ASC' },
    });

    const sold = await this.scheduleSeatRepo.find({
      where: { schedule_id: scheduleId, status: ScheduleSeatStatus.BOOKED },
    });
    const soldBySeat = new Map(sold.map((s) => [s.seat_number, s]));

    const baseFare = Number(schedule.base_fare);

    const merged = seats.map((seat) => {
      const booking = soldBySeat.get(seat.seat_number);
      return {
        ...seat,
        is_available: seat.is_available && !booking,
        booked_gender: booking?.booked_gender ?? null,
        price: baseFare,
      };
    });

    return {
      schedule_id: schedule.id,
      bus_id: schedule.bus_id,
      bus_type: schedule.bus.bus_type,
      total_seats: schedule.bus.total_seats,
      base_fare: baseFare,
      available_seats: merged.filter((s) => s.is_available).length,
      seats: merged,
    };
  }

  /**
   * Claims seats for a booking, atomically.
   *
   * The schedule row is locked pessimistically so two concurrent checkouts
   * cannot both read `available_seats` and both decrement it. The unique index
   * on (schedule_id, seat_number) is the real backstop: if a racing transaction
   * committed the same seat first, the insert blows up and this one rolls back
   * whole rather than overselling.
   */
  async bookSeats(scheduleId: string, dto: BookSeatsDto) {
    const seatNumbers = dto.seats.map((s) => s.seat_number);
    const duplicates = seatNumbers.filter(
      (n, i) => seatNumbers.indexOf(n) !== i,
    );
    if (duplicates.length) {
      throw new BadRequestException(
        `Duplicate seats in request: ${[...new Set(duplicates)].join(', ')}`,
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const schedule = await manager.findOne(Schedule, {
        where: { id: scheduleId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!schedule) throw new NotFoundException('Schedule not found');
      if (schedule.status === ScheduleStatus.CANCELLED) {
        throw new ConflictException('This trip has been cancelled');
      }

      // Every requested seat must exist on the bus and not be blocked at the
      // layout level (broken seat, crew seat, ...).
      const layout = await manager.find(SeatLayout, {
        where: { bus_id: schedule.bus_id, seat_number: In(seatNumbers) },
      });
      const layoutBySeat = new Map(layout.map((s) => [s.seat_number, s]));
      const unknown = seatNumbers.filter((n) => !layoutBySeat.has(n));
      if (unknown.length) {
        throw new BadRequestException(
          `Unknown seats for this bus: ${unknown.join(', ')}`,
        );
      }
      const blocked = seatNumbers.filter(
        (n) => !layoutBySeat.get(n)!.is_available,
      );
      if (blocked.length) {
        throw new ConflictException({
          message: 'Seats are not sellable',
          unavailableSeats: blocked,
        });
      }

      const existing = await manager.find(ScheduleSeat, {
        where: { schedule_id: scheduleId, seat_number: In(seatNumbers) },
      });
      const taken = existing.filter(
        (s) => s.status === ScheduleSeatStatus.BOOKED,
      );
      if (taken.length) {
        throw new ConflictException({
          message: 'Seats already booked',
          unavailableSeats: taken.map((s) => s.seat_number),
        });
      }

      const existingBySeat = new Map(existing.map((s) => [s.seat_number, s]));
      const rows = dto.seats.map((assignment) => {
        // A previously RELEASED seat is resold by flipping its row back, which
        // keeps the unique constraint intact.
        const row =
          existingBySeat.get(assignment.seat_number) ??
          manager.create(ScheduleSeat, {
            schedule_id: scheduleId,
            seat_number: assignment.seat_number,
          });
        row.status = ScheduleSeatStatus.BOOKED;
        row.booking_id = dto.booking_id ?? null;
        row.user_id = dto.user_id ?? null;
        row.booked_gender = assignment.gender ?? null;
        return row;
      });
      await manager.save(ScheduleSeat, rows);

      schedule.available_seats = Math.max(
        0,
        schedule.available_seats - seatNumbers.length,
      );
      await manager.save(Schedule, schedule);

      return {
        schedule_id: scheduleId,
        booked_seats: seatNumbers,
        available_seats: schedule.available_seats,
      };
    });
  }

  /** Puts seats back on sale (cancellation, or a checkout that fell over). */
  async releaseSeats(scheduleId: string, dto: ReleaseSeatsDto) {
    return this.dataSource.transaction(async (manager) => {
      const schedule = await manager.findOne(Schedule, {
        where: { id: scheduleId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!schedule) throw new NotFoundException('Schedule not found');

      const rows = await manager.find(ScheduleSeat, {
        where: {
          schedule_id: scheduleId,
          seat_number: In(dto.seat_numbers),
          status: ScheduleSeatStatus.BOOKED,
        },
      });

      // Only release what this booking actually owns, so a stale retry can't
      // free somebody else's seat.
      const owned = dto.booking_id
        ? rows.filter((r) => r.booking_id === dto.booking_id)
        : rows;
      if (!owned.length) {
        return {
          schedule_id: scheduleId,
          released_seats: [],
          available_seats: schedule.available_seats,
        };
      }

      for (const row of owned) {
        row.status = ScheduleSeatStatus.RELEASED;
        row.booking_id = null;
        row.user_id = null;
        row.booked_gender = null;
      }
      await manager.save(ScheduleSeat, owned);

      const capacity = schedule.available_seats + owned.length;
      schedule.available_seats = capacity;
      await manager.save(Schedule, schedule);

      return {
        schedule_id: scheduleId,
        released_seats: owned.map((r) => r.seat_number),
        available_seats: schedule.available_seats,
      };
    });
  }

  async searchByRoute(
    source: string,
    destination: string,
    date: string,
  ): Promise<Schedule[]> {
    const qb = this.scheduleRepo
      .createQueryBuilder('schedule')
      .leftJoinAndSelect('schedule.route', 'route')
      .leftJoinAndSelect('schedule.bus', 'bus')
      .leftJoinAndSelect('schedule.operator', 'operator')
      .leftJoinAndSelect('route.boarding_points', 'boarding_points')
      .leftJoinAndSelect('route.dropping_points', 'dropping_points')
      .where('schedule.status = :status', { status: ScheduleStatus.SCHEDULED })
      .andWhere('route.is_active = :active', { active: true });

    if (source) {
      qb.andWhere('LOWER(route.source_city) LIKE LOWER(:source)', {
        source: `%${source}%`,
      });
    }
    if (destination) {
      qb.andWhere('LOWER(route.destination_city) LIKE LOWER(:dest)', {
        dest: `%${destination}%`,
      });
    }
    if (date) {
      qb.andWhere('schedule.departure_date = :date', { date });
    }

    return qb.orderBy('schedule.departure_time', 'ASC').getMany();
  }

  async update(id: string, dto: UpdateScheduleDto): Promise<Schedule> {
    const schedule = await this.findOne(id);
    Object.assign(schedule, dto);
    return this.scheduleRepo.save(schedule);
  }

  async cancel(id: string): Promise<{ success: boolean }> {
    const schedule = await this.findOne(id);
    schedule.status = ScheduleStatus.CANCELLED;
    await this.scheduleRepo.save(schedule);
    return { success: true };
  }
}
