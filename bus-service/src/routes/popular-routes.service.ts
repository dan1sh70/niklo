import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PopularBusRoute } from './entities/popular-bus-route.entity';
import { CreatePopularRouteDto } from './dto/create-popular-route.dto';

@Injectable()
export class PopularRoutesService {
  private readonly logger = new Logger(PopularRoutesService.name);

  constructor(
    @InjectRepository(PopularBusRoute)
    private readonly routeRepo: Repository<PopularBusRoute>,
  ) {}

  async getActivePopularRoutes(): Promise<PopularBusRoute[]> {
    return this.routeRepo.find({
      where: { is_active: true },
      order: { priority: 'DESC', created_at: 'ASC' },
      take: 10,
    });
  }

  async createPopularRoute(dto: CreatePopularRouteDto): Promise<PopularBusRoute> {
    const existing = await this.routeRepo.findOne({
      where: { source: dto.source, destination: dto.destination },
    });

    if (existing) {
      throw new ConflictException(
        `Route ${dto.source} -> ${dto.destination} already exists`,
      );
    }

    const route = this.routeRepo.create(dto);
    return this.routeRepo.save(route);
  }
}
