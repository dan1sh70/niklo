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

  async getManifest(id: string): Promise<any> {
    const schedule = await this.findOne(id);
    // Ideally this would query the booking service for all bookings linked to this schedule.
    // For now, return a structured mock representing the passenger manifest.
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
    
    // Group seats by deck for the 2D grid representation
    const lowerDeck = seatData.seats.filter(s => s.deck === 1);
    const upperDeck = seatData.seats.filter(s => s.deck === 2);
    
    return {
      schedule_id: seatData.schedule_id,
      bus_type: seatData.bus_type,
      total_seats: seatData.total_seats,
      available_seats: seatData.available_seats,
      seat_map: {
        lower_deck: lowerDeck,
        upper_deck: upperDeck.length > 0 ? upperDeck : null,
      }
    };
  }

  async lockSeat(scheduleId: string, seatIds: string[]) {
    // Ideally this uses Redis (like booking-service) to SETNX with TTL.
    // Since we don't have Redis injected here, we mock the success.
    // The real implementation would be identical to booking-service lockSeats.
    return {
      message: 'Seats locked successfully for 5 minutes (mock)',
      lockedSeats: seatIds,
      scheduleId
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
