import {
  Injectable,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TravelPackage } from './entities/package.entity';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';

const DEFAULT_TRENDING_LIMIT = 10;
const MAX_TRENDING_LIMIT = 50;

/** Keeps a client-supplied `?limit=` from asking for the whole table. */
function clampLimit(limit?: number): number {
  if (limit == null || !Number.isFinite(limit) || limit < 1) {
    return DEFAULT_TRENDING_LIMIT;
  }
  return Math.min(Math.floor(limit), MAX_TRENDING_LIMIT);
}

@Injectable()
export class PackagesService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(TravelPackage)
    private readonly packageRepo: Repository<TravelPackage>,
  ) {}

  /**
   * A seed that throws must not take the service down with it: Nest propagates
   * a rejected bootstrap hook out of `app.listen()`, the process exits, and the
   * container restart-loops. Starting without demo data is the lesser failure.
   */
  async onApplicationBootstrap() {
    try {
      await this.seed();
    } catch (err) {
      console.error(
        'package-service seeding failed; starting without demo data.',
        err,
      );
    }
  }

  private async seed() {
    const count = await this.packageRepo.count();
    if (count === 0) {
      await this.packageRepo.save([
        {
          id: '11111111-1111-1111-1111-111111111111',
          title: 'Goa Sunshine Tour',
          description:
            '5 days and 4 nights of pure bliss in Goa. Includes beaches, watersports, and heritage tours.',
          price: 12999.0,
          duration_days: 5,
          duration_nights: 4,
          destinations: [
            'North Goa Beaches',
            'South Goa Churches',
            'Dudhsagar Falls',
          ],
          inclusions: [
            'Hotel Stay',
            'Breakfast',
            'Airport Transfer',
            'Sightseeing Tour',
          ],
          is_active: true,
        },
        {
          id: '22222222-2222-2222-2222-222222222222',
          title: 'Himachal Snow Adventure',
          description:
            'Explore the snowy peaks of Manali, Solang Valley, and Rohtang Pass.',
          price: 18500.0,
          duration_days: 6,
          duration_nights: 5,
          destinations: [
            'Manali Mall Road',
            'Solang Valley',
            'Rohtang Pass',
            'Kasol',
          ],
          inclusions: [
            '3-Star Accommodation',
            'Daily Breakfast & Dinner',
            'Adventure Guide',
          ],
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

  /**
   * The browse screen's "trending" rail.
   *
   * Newest active packages, because nothing in this service records how often a
   * package is viewed or booked yet. When a real popularity signal exists this
   * is the one place that has to change.
   */
  async findTrending(limit?: number) {
    return await this.packageRepo.find({
      where: { is_active: true },
      order: { created_at: 'DESC' },
      take: clampLimit(limit),
    });
  }

  /** The distinct categories currently in use, for the browse screen's filter. */
  async findCategories(): Promise<string[]> {
    const rows = await this.packageRepo
      .createQueryBuilder('p')
      .select('DISTINCT p.category', 'category')
      .where('p.category IS NOT NULL')
      .andWhere('p.is_active = :active', { active: true })
      .orderBy('category', 'ASC')
      .getRawMany<{ category: string }>();

    return rows.map((row) => row.category);
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
