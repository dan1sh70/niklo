import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { CreateSubscriptionPlanDto, UpdateSubscriptionPlanDto } from './dto/subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(SubscriptionPlan)
    private readonly planRepo: Repository<SubscriptionPlan>,
  ) {}

  async findAll(): Promise<SubscriptionPlan[]> {
    return this.planRepo.find({ order: { created_at: 'DESC' } });
  }

  async findOne(id: string): Promise<SubscriptionPlan> {
    const plan = await this.planRepo.findOneBy({ id });
    if (!plan) throw new NotFoundException(`Plan ${id} not found`);
    return plan;
  }

  async create(dto: CreateSubscriptionPlanDto): Promise<SubscriptionPlan> {
    const plan = this.planRepo.create(dto);
    return this.planRepo.save(plan);
  }

  async update(id: string, dto: UpdateSubscriptionPlanDto): Promise<SubscriptionPlan> {
    const plan = await this.findOne(id);
    Object.assign(plan, dto);
    return this.planRepo.save(plan);
  }

  async remove(id: string): Promise<void> {
    const plan = await this.findOne(id);
    await this.planRepo.remove(plan);
  }
}
