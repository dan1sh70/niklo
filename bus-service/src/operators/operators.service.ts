import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

  /**
   * One operator profile per account, keyed by the account itself.
   *
   * The partner app treats the signed-in user's id as the operator id in every
   * bus-operator screen it has. It was posting that id in the body, where
   * `whitelist: true` silently dropped it — so each save minted a fresh random
   * id, the app's follow-up `GET /operators/:userId` 404'd, and its upsert
   * created yet another operator. That is where the duplicate rows came from.
   *
   * Taking the id from the JWT instead of the body makes the app's assumption
   * true without letting a caller choose its own primary key.
   */
  async create(dto: CreateOperatorDto, userId?: string): Promise<Operator> {
    if (!userId) {
      throw new BadRequestException('Sign in to create an operator profile');
    }

    const existing = await this.operatorRepo.findOne({
      where: [{ id: userId }, { user_id: userId }],
    });
    if (existing) {
      throw new ConflictException(
        'This account already has an operator profile',
      );
    }

    const operator = this.operatorRepo.create({
      ...dto,
      id: userId,
      user_id: userId,
    });
    return this.operatorRepo.save(operator);
  }

  async findAll(): Promise<Operator[]> {
    return this.operatorRepo.find({ where: { is_active: true } });
  }

  /**
   * The operator profile owned by the signed-in user, if they have one.
   *
   * Matches on the id as well as `user_id`: profiles created before the owner
   * column was populated carry a null `user_id`, and keying on the account id
   * is what now identifies them.
   */
  async findByUser(userId: string): Promise<Operator | null> {
    return this.operatorRepo.findOne({
      where: [{ user_id: userId }, { id: userId }],
    });
  }

  /** True when [userId] may act on behalf of [operatorId]. */
  async ownsOperator(userId: string, operatorId: string): Promise<boolean> {
    const operator = await this.operatorRepo.findOne({
      where: { id: operatorId },
    });
    return !!operator && (operator.user_id === userId || operator.id === userId);
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
