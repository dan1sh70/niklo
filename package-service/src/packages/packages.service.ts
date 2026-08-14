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
          id: 'pkg_goa_01',
          title: 'Goa Beach & Heritage Experience',
          destination: 'Goa',
          start_city: 'Kolkata',
          rating: 4.9,
          reviews_count: 85,
          location_text: 'North & South Goa',
          snippet: '4 Days 3 Nights Luxury Beach Escape',
          description: 'Explore pristine beaches, colonial heritage, and vibrant nightlife in Goa.',
          duration: '4 Days 3 Nights',
          group_size: '2-6 People',
          price: 14999.0,
          original_price: 18000.0,
          discount_percent: 16,
          image_url: 'https://cdn.niklo.com/packages/goa_hero.jpg',
          gallery_images: [
            'https://cdn.niklo.com/packages/goa_1.jpg',
            'https://cdn.niklo.com/packages/goa_2.jpg'
          ],
          category: 'Beach Escapes',
          itinerary: [
            'Day 1: Arrival & Calangute Beach Sunset',
            'Day 2: North Goa Fort & Beach Tour',
            'Day 3: South Goa Heritage & Cruise',
            'Day 4: Departure'
          ],
          inclusions: ['3-Star Hotel Stay', 'Daily Breakfast', 'Airport Transfers'],
          exclusions: ['Airfare', 'Personal Expenses'],
          is_trending: true,
          is_active: true,
        },
      ]);
      console.log('Seeded packages mock data successfully.');
    }
  }

  private mapPackageToDto(p: TravelPackage) {
    return {
      id: p.id,
      title: p.title,
      destination: p.destination,
      startCity: p.start_city,
      rating: Number(p.rating),
      reviews_count: p.reviews_count,
      locationText: p.location_text,
      snippet: p.snippet,
      description: p.description,
      duration: p.duration,
      groupSize: p.group_size,
      price: Number(p.price),
      original_price: Number(p.original_price),
      discount_percent: p.discount_percent,
      imagePath: p.image_url,
      galleryImages: p.gallery_images,
      category: p.category,
      itinerary: p.itinerary,
      inclusions: p.inclusions,
      exclusions: p.exclusions,
      is_trending: p.is_trending,
    };
  }

  async create(createPackageDto: CreatePackageDto) {
    const newPackage = this.packageRepo.create(createPackageDto as Partial<TravelPackage>);
    return await this.packageRepo.save(newPackage);
  }

  async findAll(query: any) {
    const { destination, category, limit = 20, page = 1 } = query;
    const qb = this.packageRepo.createQueryBuilder('pkg');

    if (destination) {
      qb.andWhere('pkg.destination ILIKE :dest', { dest: `%${destination}%` });
    }
    if (category) {
      qb.andWhere('pkg.category = :category', { category });
    }

    const packages = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return packages.map(p => this.mapPackageToDto(p));
  }

  async getPopularDestinations() {
    return [
      { name: 'Goa', package_count: 14, image_url: 'https://cdn.niklo.com/dest/goa.jpg' },
      { name: 'Manali', package_count: 10, image_url: 'https://cdn.niklo.com/dest/manali.jpg' },
      { name: 'Kashmir', package_count: 8, image_url: 'https://cdn.niklo.com/dest/kashmir.jpg' }
    ];
  }

  async checkAvailability(id: string, checkParams: any) {
    const travelPackage = await this.packageRepo.findOne({ where: { id } });
    if (!travelPackage) {
      throw new NotFoundException(`Travel package with ID ${id} not found`);
    }
    
    // Mock capacity/availability logic
    const requestedDate = new Date(checkParams.date);
    const isValidDate = requestedDate > new Date();
    const travelers = checkParams.travelers || 1;

    return {
      package_id: id,
      date: checkParams.date,
      available: isValidDate,
      remaining_slots: isValidDate ? 12 : 0,
      price_per_person: Number(travelPackage.price),
      total_price: Number(travelPackage.price) * travelers,
    };
  }

  async findOne(id: string) {
    const travelPackage = await this.packageRepo.findOne({ where: { id } });
    if (!travelPackage) {
      throw new NotFoundException(`Travel package with ID ${id} not found`);
    }
    return this.mapPackageToDto(travelPackage);
  }

  async update(id: string, updatePackageDto: UpdatePackageDto) {
    const travelPackage = await this.packageRepo.findOne({ where: { id } });
    if (!travelPackage) {
      throw new NotFoundException(`Travel package with ID ${id} not found`);
    }
    const updated = this.packageRepo.merge(travelPackage, updatePackageDto as Partial<TravelPackage>);
    await this.packageRepo.save(updated);
    return this.findOne(id);
  }

  async remove(id: string) {
    const travelPackage = await this.packageRepo.findOne({ where: { id } });
    if (!travelPackage) {
      throw new NotFoundException(`Travel package with ID ${id} not found`);
    }
    await this.packageRepo.remove(travelPackage);
    return { message: 'Package deleted successfully' };
  }
}
