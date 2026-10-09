import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminRole } from './entities/admin-role.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(AdminRole)
    private readonly roleRepo: Repository<AdminRole>,
  ) {}

  async createRole(data: Partial<AdminRole>): Promise<AdminRole> {
    const role = this.roleRepo.create(data);
    return this.roleRepo.save(role);
  }

  async findByName(name: string): Promise<AdminRole | null> {
    return this.roleRepo.findOne({ where: { name } });
  }
}
