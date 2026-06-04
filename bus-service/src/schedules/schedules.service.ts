import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
      .where('schedule.status != :cancelled', { cancelled: ScheduleStatus.CANCELLED });

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
      order: { deck: 'ASC', row: 'ASC', column: 'ASC' },
    });
    return {
      schedule_id: schedule.id,
      bus_id: schedule.bus_id,
      bus_type: schedule.bus.bus_type,
      total_seats: schedule.bus.total_seats,
      available_seats: schedule.available_seats,
      seats,
    };
  }

  async searchByRoute(source: string, destination: string, date: string): Promise<Schedule[]> {
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
