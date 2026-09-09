import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Operator } from './entities/operator.entity';
import { CreateOperatorDto } from './dto/create-operator.dto';
import { UpdateOperatorDto } from './dto/update-operator.dto';

import { Bus } from '../buses/entities/bus.entity';
import { Schedule, ScheduleStatus } from '../schedules/entities/schedule.entity';

@Injectable()
export class OperatorsService {
  constructor(
    @InjectRepository(Operator)
    private readonly operatorRepo: Repository<Operator>,
    @InjectRepository(Bus)
    private readonly busRepo: Repository<Bus>,
    @InjectRepository(Schedule)
    private readonly scheduleRepo: Repository<Schedule>,
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
}
