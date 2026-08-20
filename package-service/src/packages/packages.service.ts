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
    // Dynamic query based on active packages
    const result = await this.packageRepo
      .createQueryBuilder('pkg')
      .select('pkg.destination', 'name')
      .addSelect('COUNT(pkg.id)', 'packageCount')
      .addSelect('MAX(pkg.image_url)', 'imageUrl')
      .where('pkg.is_active = :isActive', { isActive: true })
      .groupBy('pkg.destination')
      .orderBy('"packageCount"', 'DESC')
      .limit(6)
      .getRawMany();

    return result.map(item => ({
      name: item.name,
      packageCount: parseInt(item.packageCount, 10),
      imageUrl: item.imageUrl,
    }));
  }

  async getCategories() {
    const result = await this.packageRepo
      .createQueryBuilder('pkg')
      .select('pkg.category', 'name')
      .addSelect('COUNT(pkg.id)', 'packageCount')
      .addSelect('MAX(pkg.image_url)', 'imageUrl')
      .where('pkg.is_active = :isActive', { isActive: true })
      .groupBy('pkg.category')
      .orderBy('"packageCount"', 'DESC')
      .getRawMany();

    return result.map(item => ({
      name: item.name,
      packageCount: parseInt(item.packageCount, 10),
      imageUrl: item.imageUrl,
    }));
  }

  async getTrendingPackages(limit = 6) {
    const packages = await this.packageRepo.find({
      where: { is_active: true, is_trending: true },
      order: { rating: 'DESC' },
      take: limit,
    });
    return packages.map(p => this.mapPackageToDto(p));
  }

  async getOffers() {
    const packages = await this.packageRepo.find({
      where: { is_active: true },
      order: { discount_percent: 'DESC' },
      take: 5,
    });
    
    return packages
      .filter(p => p.discount_percent > 0)
      .map(p => ({
        id: p.id,
        title: p.title,
        destination: p.destination,
        originalPrice: Number(p.original_price || p.price),
        discountedPrice: Number(p.price),
        discountPercent: p.discount_percent,
        offerLabel: `Save ${p.discount_percent}%`,
        imageUrl: p.image_url,
      }));
  }

  async getCities() {
    const startCities = await this.packageRepo
      .createQueryBuilder('pkg')
      .select('DISTINCT pkg.start_city', 'city')
      .where('pkg.is_active = :isActive', { isActive: true })
      .getRawMany();

    const destCities = await this.packageRepo
      .createQueryBuilder('pkg')
      .select('DISTINCT pkg.destination', 'city')
      .where('pkg.is_active = :isActive', { isActive: true })
      .getRawMany();

    return {
      startingCities: startCities.map(c => c.city).filter(Boolean),
      destinationCities: destCities.map(c => c.city).filter(Boolean),
    };
  }

  async searchPackages(query: any) {
    const { 
      to, date, guests, rooms, category, 
      min_price, max_price, duration_min, duration_max, sort_by 
    } = query;

    const qb = this.packageRepo.createQueryBuilder('pkg')
      .where('pkg.is_active = :isActive', { isActive: true });

    if (to) {
      qb.andWhere(
        '(pkg.destination ILIKE :to OR pkg.location_text ILIKE :to OR pkg.title ILIKE :to)',
        { to: `%${to}%` }
      );
    }
    
    if (category && category !== 'All') {
      qb.andWhere('pkg.category = :category', { category });
    }

    if (min_price) {
      qb.andWhere('pkg.price >= :minPrice', { minPrice: min_price });
    }

    if (max_price) {
      qb.andWhere('pkg.price <= :maxPrice', { maxPrice: max_price });
    }

    if (duration_min) {
      qb.andWhere('pkg.duration_days >= :minDuration', { minDuration: duration_min });
    }

    if (duration_max) {
      qb.andWhere('pkg.duration_days <= :maxDuration', { maxDuration: duration_max });
    }

    switch (sort_by) {
      case 'price_asc':
        qb.orderBy('pkg.price', 'ASC');
        break;
      case 'price_desc':
        qb.orderBy('pkg.price', 'DESC');
        break;
      case 'newest':
        qb.orderBy('pkg.created_at', 'DESC');
        break;
      case 'rating_desc':
      default:
        qb.orderBy('pkg.rating', 'DESC');
        break;
    }

    const packages = await qb.getMany();
    return packages.map(p => this.mapPackageToDto(p));
  }

  async getPackagesByDestination(name: string) {
    const packages = await this.packageRepo.find({
      where: { destination: name, is_active: true },
      order: { rating: 'DESC' },
    });
    return packages.map(p => this.mapPackageToDto(p));
  }

  async getPackagesByCategory(category: string) {
    const packages = await this.packageRepo.find({
      where: { category, is_active: true },
      order: { rating: 'DESC' },
    });
    return packages.map(p => this.mapPackageToDto(p));
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
