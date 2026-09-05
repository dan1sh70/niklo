import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HolidayPackage } from './entities/holiday-package.entity';

@Injectable()
export class PackagesService {
  constructor(
    @InjectRepository(HolidayPackage)
    private readonly packageRepo: Repository<HolidayPackage>,
  ) {}

  async findAll(query: any) {
    const { destination, category, limit = 20, page = 1 } = query;
    const qb = this.packageRepo.createQueryBuilder('pkg')
      .where('pkg.status = :status', { status: 'ACTIVE' });

    if (destination) {
      qb.andWhere('pkg.destination_city ILIKE :dest OR pkg.destination_state ILIKE :dest', { dest: `%${destination}%` });
    }
    if (category && category !== 'All') {
      qb.andWhere('pkg.category = :category', { category });
    }

    const packages = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return packages;
  }

  async findOne(id: string) {
    const travelPackage = await this.packageRepo.findOne({ 
      where: { id, status: 'ACTIVE' },
      relations: { gallery_media: true, itinerary_days: true }
    });
    if (!travelPackage) {
      throw new NotFoundException(`Travel package with ID ${id} not found`);
    }
    return travelPackage;
  }

  async getPopularDestinations() {
    return [];
  }

  async getCategories() {
    return [];
  }

  async getTrendingPackages(limit = 6) {
    return this.packageRepo.find({
      where: { status: 'ACTIVE' },
      order: { average_rating: 'DESC' },
      take: limit,
    });
  }

  async getOffers() {
    return this.packageRepo.find({
      where: { status: 'ACTIVE', has_discount: true },
      order: { discount_value: 'DESC' },
      take: 5,
    });
  }

  async getCities() {
    return { startingCities: [], destinationCities: [] };
  }

  async searchPackages(query: any) {
    return this.findAll(query);
  }

  async getPackagesByDestination(name: string) {
    return this.packageRepo.find({
      where: { destination_city: name, status: 'ACTIVE' },
      order: { average_rating: 'DESC' },
    });
  }

  async getPackagesByCategory(category: string) {
    return this.packageRepo.find({
      where: { category, status: 'ACTIVE' },
      order: { average_rating: 'DESC' },
    });
  }

  async checkAvailability(id: string, checkParams: any) {
    return { available: true };
  }
}
