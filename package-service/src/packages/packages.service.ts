import { Injectable, NotFoundException, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TravelPackage } from './entities/package.entity';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';

@Injectable()
export class PackagesService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(TravelPackage)
    private readonly packageRepo: Repository<TravelPackage>,
  ) {}

  async onApplicationBootstrap() {
    const count = await this.packageRepo.count();
    if (count === 0) {
      await this.packageRepo.save([
        {
          id: '11111111-1111-1111-1111-111111111111',
          title: 'Goa Sunshine Tour',
          description: '5 days and 4 nights of pure bliss in Goa. Includes beaches, watersports, and heritage tours.',
          price: 12999.0,
          duration_days: 5,
          duration_nights: 4,
          destinations: ['North Goa Beaches', 'South Goa Churches', 'Dudhsagar Falls'],
          inclusions: ['Hotel Stay', 'Breakfast', 'Airport Transfer', 'Sightseeing Tour'],
          is_active: true,
        },
        {
          id: '22222222-2222-2222-2222-222222222222',
          title: 'Himachal Snow Adventure',
          description: 'Explore the snowy peaks of Manali, Solang Valley, and Rohtang Pass.',
          price: 18500.0,
          duration_days: 6,
          duration_nights: 5,
          destinations: ['Manali Mall Road', 'Solang Valley', 'Rohtang Pass', 'Kasol'],
          inclusions: ['3-Star Accommodation', 'Daily Breakfast & Dinner', 'Adventure Guide'],
          is_active: true,
        },
      ]);
      console.log('Seeded packages mock data successfully.');
    }
  }

  async create(createPackageDto: CreatePackageDto) {
    const newPackage = this.packageRepo.create(createPackageDto);
    return await this.packageRepo.save(newPackage);
  }

  async findAll() {
    return await this.packageRepo.find();
  }

  async getPopularDestinations() {
    // In a real app, this would aggregate by destinations column
    // or query a separate destinations table based on booking counts
    return {
      destinations: [
        { name: 'Goa', image: 'https://cdn.niklo.com/dest/goa.jpg', packageCount: 42 },
        { name: 'Manali', image: 'https://cdn.niklo.com/dest/manali.jpg', packageCount: 38 },
        { name: 'Kerala', image: 'https://cdn.niklo.com/dest/kerala.jpg', packageCount: 25 },
        { name: 'Rajasthan', image: 'https://cdn.niklo.com/dest/rajasthan.jpg', packageCount: 19 }
      ]
    };
  }

  async checkAvailability(id: string, checkParams: any) {
    const travelPackage = await this.findOne(id);
    
    // Mock capacity/availability logic
    const requestedDate = new Date(checkParams.date);
    const isValidDate = requestedDate > new Date();

    return {
      package_id: id,
      title: travelPackage.title,
      requested_date: checkParams.date,
      available_slots: isValidDate ? 12 : 0, // Mock 12 slots for future dates
      price_per_person: travelPackage.price,
      total_price: travelPackage.price * (checkParams.travelers || 1),
      is_available: isValidDate
    };
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
