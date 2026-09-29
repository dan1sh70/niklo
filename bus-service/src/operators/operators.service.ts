import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Operator } from './entities/operator.entity';
import { CreateOperatorDto } from './dto/create-operator.dto';
import { UpdateOperatorDto } from './dto/update-operator.dto';

import { Bus } from '../buses/entities/bus.entity';
import { Schedule, ScheduleStatus } from '../schedules/entities/schedule.entity';
import { OperatorReview } from './entities/operator-review.entity';

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
    const today = new Date().toISOString().split('T')[0];
    
    const totalBuses = await this.busRepo.count({ where: { operator_id: id } });
    
    const schedulesToday = await this.scheduleRepo.find({
      where: { operator_id: id, departure_date: today },
      relations: { bus: true },
    });

    const activeSchedulesToday = schedulesToday.filter(s => s.status === ScheduleStatus.SCHEDULED || s.status === ScheduleStatus.IN_TRANSIT).length;
    
    let totalTicketsSoldToday = 0;
    let totalEarningsToday = 0;
    let totalCapacity = 0;

    for (const schedule of schedulesToday) {
      const sold = schedule.bus.total_seats - schedule.available_seats;
      totalTicketsSoldToday += sold;
      totalEarningsToday += sold * Number(schedule.base_fare);
      totalCapacity += schedule.bus.total_seats;
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
