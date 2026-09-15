import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKey } from './entities/api-key.entity';
import { CreateApiKeyDto, UpdateApiKeyDto } from './dto/api-key.dto';

@Injectable()
export class ApiKeysService {
  constructor(
    @InjectRepository(ApiKey)
    private readonly apiKeyRepo: Repository<ApiKey>,
  ) {}

  async findAll(): Promise<ApiKey[]> {
    return this.apiKeyRepo.find({ order: { created_at: 'DESC' } });
  }

  async findOne(id: string): Promise<ApiKey> {
    const key = await this.apiKeyRepo.findOneBy({ id });
    if (!key) throw new NotFoundException(`API Key ${id} not found`);
    return key;
  }

  async create(dto: CreateApiKeyDto): Promise<ApiKey> {
    const key = this.apiKeyRepo.create(dto);
    return this.apiKeyRepo.save(key);
  }

  async update(id: string, dto: UpdateApiKeyDto): Promise<ApiKey> {
    const key = await this.findOne(id);
    Object.assign(key, dto);
    return this.apiKeyRepo.save(key);
  }

  async remove(id: string): Promise<void> {
    const key = await this.findOne(id);
    await this.apiKeyRepo.remove(key);
  }
}
