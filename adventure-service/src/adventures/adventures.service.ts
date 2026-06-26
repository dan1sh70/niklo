import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TravelAdventure } from './entities/adventure.entity';
import { CreateAdventureDto } from './dto/create-adventure.dto';
import { UpdateAdventureDto } from './dto/update-adventure.dto';

@Injectable()
export class AdventuresService {
  constructor(
    @InjectRepository(TravelAdventure)
    private readonly adventureRepo: Repository<TravelAdventure>,
  ) {}

  async create(createAdventureDto: CreateAdventureDto) {
    const newAdventure = this.adventureRepo.create(createAdventureDto);
    return await this.adventureRepo.save(newAdventure);
  }

  async findAll() {
    return await this.adventureRepo.find();
  }

  async findOne(id: string) {
    const travelAdventure = await this.adventureRepo.findOne({ where: { id } });
    if (!travelAdventure) {
      throw new NotFoundException(`Travel adventure with ID ${id} not found`);
    }
    return travelAdventure;
  }

  async update(id: string, updateAdventureDto: UpdateAdventureDto) {
    const travelAdventure = await this.findOne(id);
    const updated = this.adventureRepo.merge(travelAdventure, updateAdventureDto);
    return await this.adventureRepo.save(updated);
  }

  async remove(id: string) {
    const travelAdventure = await this.findOne(id);
    return await this.adventureRepo.remove(travelAdventure);
  }
}
