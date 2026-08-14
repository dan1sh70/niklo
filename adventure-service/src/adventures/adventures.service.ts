import { Injectable, OnApplicationBootstrap, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TravelAdventure } from './entities/adventure.entity';

@Injectable()
export class AdventuresService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(TravelAdventure)
    private readonly adventureRepository: Repository<TravelAdventure>,
  ) {}

  async onApplicationBootstrap() {
    const count = await this.adventureRepository.count();
    if (count === 0) {
      await this.adventureRepository.save([
        {
          id: 'exp_scuba_goa_01',
          title: 'Grand Island Scuba Diving & Water Sports',
          category: 'Water Sports',
          location: 'Grand Island, Goa',
          city: 'Goa',
          price: 3500.0,
          original_price: 4500.0,
          discount_percent: 22,
          rating: 4.9,
          reviews_count: 284,
          duration_hours: 6,
          difficulty: 'Easy',
          group_size: 'Up to 15 People',
          image_url: 'https://cdn.niklo.com/experiences/scuba_goa.jpg',
          gallery_images: [
            'https://cdn.niklo.com/experiences/scuba_1.jpg',
            'https://cdn.niklo.com/experiences/scuba_2.jpg'
          ],
          description: 'Experience deep sea diving in pristine waters with certified PADI divers.',
          highlights: ['Underwater Photos Included', 'PADI Instructor', 'Boat Ride'],
          whats_included: ['Equipment', 'Snacks', 'Photos'],
          what_to_bring: ['Swimwear', 'Valid ID Proof'],
          meeting_point: 'Malim Jetty, Panaji, Goa',
          latitude: 15.5011,
          longitude: 73.8244,
          is_active: true,
        },
      ]);
      console.log('Seeded adventures mock data successfully.');
    }
  }

  private mapAdventureToDto(a: TravelAdventure) {
    return {
      id: a.id,
      title: a.title,
      category: a.category,
      location: a.location,
      city: a.city,
      price: Number(a.price),
      original_price: Number(a.original_price),
      discount_percent: a.discount_percent,
      rating: Number(a.rating),
      reviews_count: a.reviews_count,
      duration_hours: a.duration_hours,
      duration: `${a.duration_hours} Hours`,
      difficulty: a.difficulty,
      group_size: a.group_size,
      image_url: a.image_url,
      gallery_images: a.gallery_images,
      description: a.description,
      highlights: a.highlights,
      whats_included: a.whats_included,
      what_to_bring: a.what_to_bring,
      meeting_point: a.meeting_point,
      latitude: Number(a.latitude),
      longitude: Number(a.longitude),
    };
  }

  async create(createAdventureDto: any) {
    const adventure = this.adventureRepository.create(
      createAdventureDto as Partial<TravelAdventure>,
    );
    return await this.adventureRepository.save(adventure);
  }

  async findAll(query: any) {
    const { category, location, min_price, max_price, page = 1, limit = 20 } = query;
    const qb = this.adventureRepository.createQueryBuilder('adv');

    if (category) {
      qb.andWhere('adv.category = :category', { category });
    }
    if (location) {
      qb.andWhere('adv.location ILIKE :loc', { loc: `%${location}%` });
    }
    if (min_price) {
      qb.andWhere('adv.price >= :minPrice', { minPrice: min_price });
    }
    if (max_price) {
      qb.andWhere('adv.price <= :maxPrice', { maxPrice: max_price });
    }

    const adventures = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return adventures.map(a => this.mapAdventureToDto(a));
  }

  async getCategories() {
    return [
      { id: 'cat_water', title: 'Water Sports', icon: 'water', count: 12 },
      { id: 'cat_air', title: 'Air Sports', icon: 'flight', count: 8 },
      { id: 'cat_trek', title: 'Trekking', icon: 'hiking', count: 15 },
      { id: 'cat_safari', title: 'Wildlife', icon: 'nature', count: 6 },
    ];
  }

  async checkAvailability(id: string, checkParams: any) {
    const adventure = await this.adventureRepository.findOne({ where: { id } });
    if (!adventure) {
      throw new NotFoundException(`Adventure with ID ${id} was not found.`);
    }
    
    // Mock capacity/availability logic
    const requestedDate = new Date(checkParams.date);
    const isValidDate = requestedDate > new Date();
    const participants = checkParams.participants || 1;

    return {
      adventure_id: id,
      date: checkParams.date,
      available: isValidDate,
      remaining_slots: isValidDate ? 8 : 0,
      price_per_person: Number(adventure.price),
      total_price: Number(adventure.price) * participants,
      time_slots: ["07:30 AM", "10:30 AM", "01:30 PM"]
    };
  }

  async findOne(id: string) {
    const adventure = await this.adventureRepository.findOne({ where: { id } });
    if (!adventure) {
      throw new NotFoundException(`Adventure with ID ${id} was not found.`);
    }
    return this.mapAdventureToDto(adventure);
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
