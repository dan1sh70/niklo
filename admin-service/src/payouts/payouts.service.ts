import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payout } from './entities/payout.entity';
import { CreatePayoutDto, ProcessPayoutDto } from './dto/payout.dto';

@Injectable()
export class PayoutsService {
  constructor(
    @InjectRepository(Payout)
    private readonly payoutRepo: Repository<Payout>,
  ) {}

  async findAll(): Promise<Payout[]> {
    return this.payoutRepo.find({ order: { created_at: 'DESC' } });
  }

  async findOne(id: string): Promise<Payout> {
    const payout = await this.payoutRepo.findOneBy({ id });
    if (!payout) throw new NotFoundException(`Payout ${id} not found`);
    return payout;
  }

  async create(dto: CreatePayoutDto): Promise<Payout> {
    const payout = this.payoutRepo.create(dto);
    return this.payoutRepo.save(payout);
  }

  async process(id: string, dto: ProcessPayoutDto): Promise<Payout> {
    const payout = await this.findOne(id);
    payout.status = dto.status;
    if (dto.transaction_ref) payout.transaction_ref = dto.transaction_ref;
    if (dto.rejection_reason) payout.rejection_reason = dto.rejection_reason;
    return this.payoutRepo.save(payout);
  }

  async remove(id: string): Promise<void> {
    const payout = await this.findOne(id);
    await this.payoutRepo.remove(payout);
  }
}
