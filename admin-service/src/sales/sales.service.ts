import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Referral } from './entities/referral.entity';
import { CreateReferralDto, UpdateReferralDto } from './dto/referral.dto';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Referral)
    private readonly referralRepo: Repository<Referral>,
  ) {}

  async findAll(): Promise<Referral[]> {
    return this.referralRepo.find({ order: { created_at: 'DESC' } });
  }

  async findOne(id: string): Promise<Referral> {
    const referral = await this.referralRepo.findOneBy({ id });
    if (!referral) throw new NotFoundException(`Referral ${id} not found`);
    return referral;
  }

  async create(dto: CreateReferralDto): Promise<Referral> {
    const referral = this.referralRepo.create(dto);
    return this.referralRepo.save(referral);
  }

  async update(id: string, dto: UpdateReferralDto): Promise<Referral> {
    const referral = await this.findOne(id);
    Object.assign(referral, dto);
    return this.referralRepo.save(referral);
  }

  async remove(id: string): Promise<void> {
    const referral = await this.findOne(id);
    await this.referralRepo.remove(referral);
  }
}
