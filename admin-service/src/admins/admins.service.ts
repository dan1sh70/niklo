import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminUser } from './entities/admin.entity';

@Injectable()
export class AdminsService {
  constructor(
    @InjectRepository(AdminUser)
    private readonly adminRepo: Repository<AdminUser>,
  ) {}

  async findByEmail(email: string): Promise<AdminUser | null> {
    return this.adminRepo.findOne({
      where: { email },
      relations: { role: true },
    });
  }

  async findById(id: string): Promise<AdminUser | null> {
    return this.adminRepo.findOne({
      where: { id },
      relations: { role: true },
    });
  }

  async updateTotpSecret(id: string, secret: string): Promise<void> {
    await this.adminRepo.update(id, { totp_secret: secret, totp_enabled: true });
  }

  async updatePassword(id: string, password_hash: string): Promise<void> {
    await this.adminRepo.update(id, { password_hash });
  }

  async createAdmin(data: Partial<AdminUser>): Promise<AdminUser> {
    const admin = this.adminRepo.create(data);
    return this.adminRepo.save(admin);
  }
}
