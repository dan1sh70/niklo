import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Operator } from './entities/operator.entity';
import { CreateOperatorDto } from './dto/create-operator.dto';
import { UpdateOperatorDto } from './dto/update-operator.dto';

@Injectable()
export class OperatorsService {
  constructor(
    @InjectRepository(Operator)
    private readonly operatorRepo: Repository<Operator>,
  ) {}

  async create(dto: CreateOperatorDto, userId?: string): Promise<Operator> {
    const operator = this.operatorRepo.create({
      ...dto,
      user_id: userId ?? null,
    });
    return this.operatorRepo.save(operator);
  }

  async findAll(): Promise<Operator[]> {
    return this.operatorRepo.find({ where: { is_active: true } });
  }

  /** The operator profile owned by the signed-in user, if they have one. */
  async findByUser(userId: string): Promise<Operator | null> {
    return this.operatorRepo.findOne({ where: { user_id: userId } });
  }

  /** True when [userId] may act on behalf of [operatorId]. */
  async ownsOperator(userId: string, operatorId: string): Promise<boolean> {
    const operator = await this.operatorRepo.findOne({
      where: { id: operatorId },
    });
    return !!operator && operator.user_id === userId;
  }

  async findOne(id: string): Promise<Operator> {
    const operator = await this.operatorRepo.findOne({
      where: { id },
      relations: { buses: true },
    });
    if (!operator) throw new NotFoundException('Operator not found');
    return operator;
  }

  async update(
    id: string,
    dto: UpdateOperatorDto,
    userId?: string,
  ): Promise<Operator> {
    const operator = await this.findOne(id);

    // MIGRATION PATH: operators created before `user_id` existed have no owner,
    // so they can never pass the manifest ownership check. The first
    // authenticated edit binds the profile to that account. Replace this with a
    // proper backfill once existing operators are mapped to their auth users —
    // until then an unowned operator is claimable by whoever edits it first.
    if (!operator.user_id && userId) {
      operator.user_id = userId;
    }

    Object.assign(operator, dto);
    return this.operatorRepo.save(operator);
  }

  async remove(id: string): Promise<{ success: boolean }> {
    const operator = await this.findOne(id);
    operator.is_active = false;
    await this.operatorRepo.save(operator);
    return { success: true };
  }
}
