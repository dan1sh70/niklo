import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Adventure } from './entities/adventure.entity';

@Injectable()
export class AdventuresService {
  constructor(
    @InjectRepository(Adventure)
    private readonly adventureRepository: Repository<Adventure>,
  ) {}

  async create(createAdventureDto: any) {
    const adventure = this.adventureRepository.create(
      createAdventureDto as Partial<Adventure>,
    );
    return await this.adventureRepository.save(adventure);
  }

  async findAll() {
    return await this.adventureRepository.find();
  }

  async findOne(id: string) {
    return await this.adventureRepository.findOne({ where: { id } });
  }

  async update(id: string, updateAdventureDto: any) {
    await this.adventureRepository.update(id, updateAdventureDto);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.adventureRepository.delete(id);
    return { message: 'Adventure deleted successfully' };
  }
}
