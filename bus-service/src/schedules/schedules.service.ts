import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { Schedule, ScheduleStatus } from './entities/schedule.entity';
import { CreateScheduleDto, UpdateScheduleDto } from './dto/schedule.dto';
import { SeatLayout } from '../buses/entities/seat-layout.entity';

@Injectable()
export class SchedulesService {
  constructor(
    @InjectRepository(Schedule)
    private readonly scheduleRepo: Repository<Schedule>,
    @InjectRepository(SeatLayout)
    private readonly seatRepo: Repository<SeatLayout>,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async create(dto: CreateScheduleDto): Promise<Schedule> {
    const schedule = this.scheduleRepo.create(dto);
    return this.scheduleRepo.save(schedule);
  }

  async findAll(routeId?: string, date?: string): Promise<Schedule[]> {
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

  async getSeats(scheduleId: string) {
    const schedule = await this.findOne(scheduleId);
    const seats = await this.seatRepo.find({
      where: { bus_id: schedule.bus_id },
      order: { is_upper_deck: 'ASC', row_num: 'ASC', col_num: 'ASC' },
    });
    return {
      schedule_id: schedule.id,
      bus_id: schedule.bus_id,
      bus_type: schedule.bus.bus_type,
      total_seats: schedule.bus.total_seats,
      available_seats: schedule.available_seats,
      base_fare: schedule.base_fare,
      seats,
    };
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
      .leftJoinAndSelect('bus.seats', 'seats')
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
      qb.andWhere(
        '(schedule.departure_date = :date OR schedule.departure_date <= :date)',
        { date }
      );
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

  async getManifest(id: string): Promise<any> {
    const schedule = await this.findOne(id);
    return {
      schedule_id: schedule.id,
      route: `${schedule.route?.source_city} to ${schedule.route?.destination_city}`,
      departure_time: schedule.departure_time,
      bus_number: schedule.bus?.registration_number,
      manifest: [
        { seat: '1A', passengerName: 'John Doe', age: 30, gender: 'M', pnr: 'B123456' },
        { seat: '1B', passengerName: 'Jane Doe', age: 28, gender: 'F', pnr: 'B123456' },
      ],
      generated_at: new Date(),
    };
  }

  async getSeatMap(id: string) {
    const seatData = await this.getSeats(id);
    
    // Group seats by deck for the 2D grid representation and format to blueprint schema
    const formatSeat = (s: SeatLayout) => ({
      seat_number: s.seat_number,
      row: s.row_num,
      column: s.col_num,
      is_upper_deck: s.is_upper_deck,
      seat_type: s.seat_type,
      price: Number(seatData.base_fare) + Number(s.price_offset),
      is_available: s.is_available,
      is_ladies_seat: false,
    });

    const lowerDeck = seatData.seats.filter(s => !s.is_upper_deck).map(formatSeat);
    const upperDeck = seatData.seats.filter(s => s.is_upper_deck).map(formatSeat);
    
    return {
      schedule_id: seatData.schedule_id,
      total_seats: seatData.total_seats,
      available_seats: seatData.available_seats,
      lower_deck: lowerDeck,
      upper_deck: upperDeck.length > 0 ? upperDeck : null,
    };
  }

  async lockSeat(scheduleId: string, seatIds: string[], userId: string) {
    const lockedSeats: string[] = [];
    const TTL_SECONDS = 300;

    for (const seatNo of seatIds) {
      const lockKey = `lock:bus:${scheduleId}:${seatNo}`;
      const acquired = await this.redis.set(lockKey, userId, 'EX', TTL_SECONDS, 'NX');
      
      if (acquired) {
        lockedSeats.push(seatNo);
      } else {
        // Rollback already acquired locks to avoid partial locks
        if (lockedSeats.length > 0) {
          const pipeline = this.redis.pipeline();
          lockedSeats.forEach(s => pipeline.del(`lock:bus:${scheduleId}:${s}`));
          await pipeline.exec();
        }
        throw new ConflictException(`Seat ${seatNo} is already locked by another user`);
      }
    }

    return {
      schedule_id: scheduleId,
      locked_seats: lockedSeats,
      expires_in_seconds: TTL_SECONDS,
      lock_id: `lck_bus_${Date.now()}`
    };
  }

  async getBoardingPoints(id: string) {
    const schedule = await this.findOne(id);
    return {
      schedule_id: schedule.id,
      boarding_points: schedule.route?.boarding_points || [],
      dropping_points: schedule.route?.dropping_points || []
    };
  }
}
