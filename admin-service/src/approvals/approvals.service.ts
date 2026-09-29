import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Approval, ApprovalStatus } from './entities/approval.entity';

@Injectable()
export class ApprovalsService {
  constructor(
    @InjectRepository(Approval)
    private readonly approvalRepo: Repository<Approval>,
  ) {}

  async getApprovals(page: number = 1, limit: number = 10, status?: ApprovalStatus) {
    const query = this.approvalRepo.createQueryBuilder('approval')
      .leftJoinAndSelect('approval.requester', 'requester')
      .leftJoinAndSelect('approval.reviewer', 'reviewer')
      .orderBy('approval.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) {
      query.where('approval.status = :status', { status });
    }

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        pageCount: Math.ceil(total / limit),
      }
    };
  }

  async updateApproval(id: string, status: ApprovalStatus, reviewerId: string, comments?: string) {
    await this.approvalRepo.update(id, {
      status,
      reviewed_by: reviewerId,
      comments,
    });
    return this.approvalRepo.findOne({ where: { id } });
  }
}
