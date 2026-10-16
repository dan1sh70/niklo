import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Operator } from './entities/operator.entity';
import { CreateOperatorDto } from './dto/create-operator.dto';
import { UpdateOperatorDto } from './dto/update-operator.dto';

import { Bus } from '../buses/entities/bus.entity';
import { Schedule, ScheduleStatus } from '../schedules/entities/schedule.entity';
import { OperatorReview } from './entities/operator-review.entity';

import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class OperatorsService {
  constructor(
    @InjectRepository(Operator)
    private readonly operatorRepo: Repository<Operator>,
    @InjectRepository(Bus)
    private readonly busRepo: Repository<Bus>,
    @InjectRepository(Schedule)
    private readonly scheduleRepo: Repository<Schedule>,
    @InjectRepository(OperatorReview)
    private readonly reviewRepo: Repository<OperatorReview>,
    private readonly httpService: HttpService,
  ) {}

  async create(dto: CreateOperatorDto): Promise<Operator> {
    const operator = this.operatorRepo.create(dto);
    return this.operatorRepo.save(operator);
  }

  async findAll(): Promise<Operator[]> {
    return this.operatorRepo.find({ where: { is_active: true } });
  }

  async findOne(id: string): Promise<Operator> {
    const operator = await this.operatorRepo.findOne({
      where: { id },
      relations: { buses: true },
    });
    if (!operator) throw new NotFoundException('Operator not found');
    return operator;
  }

  async update(id: string, dto: UpdateOperatorDto): Promise<Operator> {
    const operator = await this.findOne(id);
    Object.assign(operator, dto);
    return this.operatorRepo.save(operator);
  }

  async remove(id: string): Promise<{ success: boolean }> {
    const operator = await this.findOne(id);
    operator.is_active = false;
    await this.operatorRepo.save(operator);
    return { success: true };
  }

  async getSummary(id: string): Promise<any> {
    const now = new Date();
    const todayDateStr = now.toISOString().split('T')[0];
    const weekDays = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const todayWeekday = weekDays[now.getDay()];

    const totalBuses = await this.busRepo.count({ where: { operator_id: id, is_active: true } });

    // Query one-off schedules dated today OR recurring schedules operating on today's weekday
    const allActiveSchedules = await this.scheduleRepo.find({
      where: { operator_id: id },
      relations: { bus: true },
    });

    const schedulesToday = allActiveSchedules.filter((s) => {
      if (s.status !== ScheduleStatus.SCHEDULED && s.status !== ScheduleStatus.IN_TRANSIT) {
        return false;
      }
      // Check one-off date match
      if (s.departure_date === todayDateStr) return true;

      // Check recurring operating days
      if (s.operating_days && Array.isArray(s.operating_days)) {
        return s.operating_days.includes(todayWeekday);
      }
      return false;
    });

    const activeSchedulesToday = schedulesToday.length;
    let totalTicketsSoldToday = 0;
    let totalEarningsToday = 0;
    let totalCapacity = 0;

    for (const schedule of schedulesToday) {
      const totalBusSeats = schedule.bus?.total_seats || schedule.available_seats;
      const sold = Math.max(0, totalBusSeats - schedule.available_seats);
      totalTicketsSoldToday += sold;
      totalEarningsToday += sold * Number(schedule.base_fare);
      totalCapacity += totalBusSeats;
    }

    const occupancyRatePercent = totalCapacity > 0 ? (totalTicketsSoldToday / totalCapacity) * 100 : 0;

    return {
      total_buses: totalBuses,
      active_schedules_today: activeSchedulesToday,
      total_tickets_sold_today: totalTicketsSoldToday,
      total_earnings_today: totalEarningsToday,
      occupancy_rate_percent: Number(occupancyRatePercent.toFixed(2)),
    };
  }

  async getOperatorBookings(operatorId: string, page = 1, limit = 20, status?: string) {
    const schedules = await this.scheduleRepo.find({
      where: { operator_id: operatorId },
      select: {
        id: true,
        departure_date: true,
        departure_time: true,
        route_id: true,
      },
      relations: { route: true },
    });

    if (schedules.length === 0) {
      return { bookings: [], total: 0 };
    }

    const scheduleMap = new Map(schedules.map((s) => [s.id, s]));
    const scheduleIds = schedules.map((s) => s.id);

    try {
      const bookingServiceUrl = process.env.BOOKING_SERVICE_URL || 'http://booking-service:3014';
      const response = await lastValueFrom(
        this.httpService.post(
          `${bookingServiceUrl}/api/v1/bookings/internal/operator-bookings`,
          { schedule_ids: scheduleIds, page, limit, status },
          { headers: { 'x-internal-secret': process.env.INTERNAL_API_SECRET || 'super-secret-internal-key' } },
        ),
      );

      const rawBookings = response.data?.data?.bookings || response.data?.bookings || [];
      const total = response.data?.data?.total ?? response.data?.total ?? rawBookings.length;

      const enrichedBookings = rawBookings.map((b: any) => {
        const sched = scheduleMap.get(b.reference_id);
        return {
          id: b.id,
          schedule_id: b.reference_id,
          booking_reference: b.booking_reference,
          passenger_name: b.passenger_details?.[0]?.name || b.title,
          contact_phone: b.contact_phone,
          seat_numbers: b.seat_numbers || [],
          total_amount: Number(b.total_amount),
          status: b.status,
          travel_date: b.travel_date || sched?.departure_date,
          departure_time: sched?.departure_time,
          route: sched?.route ? `${sched.route.source_city} → ${sched.route.destination_city}` : 'Direct Route',
          passenger_details: b.passenger_details || [],
        };
      });

      return { bookings: enrichedBookings, total };
    } catch (e: any) {
      return { bookings: [], total: 0, error: e.message };
    }
  }

  async getReviews(operatorId: string, page: number = 1, limit: number = 10) {
    const [reviews, total] = await this.reviewRepo.findAndCount({
      where: { operator_id: operatorId },
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      reviews,
      total,
      page,
      limit,
    };
  }

  async createReview(operatorId: string, dto: any, userName: string) {
    const operator = await this.findOne(operatorId);
    
    const review = this.reviewRepo.create({
      operator_id: operatorId,
      booking_id: dto.booking_id,
      user_name: userName,
      rating: Number(dto.rating),
      comment: dto.comment,
      tags: dto.tags,
      is_verified: true, // Assuming authenticated user implies verified for now
    });
    await this.reviewRepo.save(review);

    // Recalculate average rating
    const allReviews = await this.reviewRepo.find({ where: { operator_id: operatorId } });
    const avg = allReviews.reduce((sum, r) => sum + Number(r.rating), 0) / allReviews.length;
    
    operator.rating = Number(avg.toFixed(2));
    operator.ratings_count = allReviews.length;
    await this.operatorRepo.save(operator);

    return review;
  }
}
