import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepo: Repository<AuditLog>,
  ) {}

  async log(data: Partial<AuditLog>): Promise<void> {
    const logEntry = this.auditLogRepo.create(data);
    await this.auditLogRepo.save(logEntry);
  }

  async getLogs(skip: number = 0, take: number = 20): Promise<AuditLog[]> {
    return this.auditLogRepo.find({
      skip,
      take,
      order: { created_at: 'DESC' },
      relations: { admin: true },
    });
  }
}
