import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TravelPackage } from './entities/package.entity';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';

@Injectable()
export class PackagesService {
  constructor(
    @InjectRepository(TravelPackage)
    private readonly packageRepo: Repository<TravelPackage>,
  ) {}

  async create(createPackageDto: CreatePackageDto) {
    const newPackage = this.packageRepo.create(createPackageDto);
    return await this.packageRepo.save(newPackage);
  }

  async findAll() {
    return await this.packageRepo.find();
  }

  async findOne(id: string) {
    const travelPackage = await this.packageRepo.findOne({ where: { id } });
    if (!travelPackage) {
      throw new NotFoundException(`Travel package with ID ${id} not found`);
    }
    return travelPackage;
  }

  async update(id: string, updatePackageDto: UpdatePackageDto) {
    const travelPackage = await this.findOne(id);
    const updated = this.packageRepo.merge(travelPackage, updatePackageDto);
    return await this.packageRepo.save(updated);
  }

  async remove(id: string) {
    const travelPackage = await this.findOne(id);
    return await this.packageRepo.remove(travelPackage);
  }
}
