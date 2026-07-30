import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TravelAdventure } from './entities/adventure.entity';

@Injectable()
export class AdventuresService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(TravelAdventure)
    private readonly adventureRepository: Repository<TravelAdventure>,
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
        'adventure-service seeding failed; starting without demo data.',
        err,
      );
    }
  }

  private async seed() {
    const count = await this.adventureRepository.count();
    if (count === 0) {
      await this.adventureRepository.save([
        {
          id: 'ad111111-1111-1111-1111-111111111111',
          title: 'White Water Rafting',
          description: 'Thrilling white water rafting in Rishikesh along the Ganges.',
          price: 2500.0,
          duration_hours: 3,
          location: 'Rishikesh, Uttarakhand',
          requirements: ['18+ age', 'No heart conditions', 'Swim wear'],
          is_active: true,
        },
        {
          id: 'ad222222-2222-2222-2222-222222222222',
          title: 'Paragliding in Bir Billing',
          description: 'Fly like a bird over the scenic valleys of Bir Billing.',
          price: 3500.0,
          duration_hours: 1,
          location: 'Bir Billing, Himachal Pradesh',
          requirements: ['Weight between 40-95kg', 'Sturdy shoes'],
          is_active: true,
        },
      ]);
      console.log('Seeded adventures mock data successfully.');
    }
  }

  async create(createAdventureDto: any) {
    const adventure = this.adventureRepository.create(
      createAdventureDto as Partial<TravelAdventure>,
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
