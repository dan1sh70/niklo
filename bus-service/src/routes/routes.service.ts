import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Route } from './entities/route.entity';
import { BoardingPoint } from './entities/boarding-point.entity';
import { DroppingPoint } from './entities/dropping-point.entity';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';

@Injectable()
export class RoutesService {
  constructor(
    @InjectRepository(Route)
    private readonly routeRepo: Repository<Route>,
    @InjectRepository(BoardingPoint)
    private readonly boardingRepo: Repository<BoardingPoint>,
    @InjectRepository(DroppingPoint)
    private readonly droppingRepo: Repository<DroppingPoint>,
  ) {}

  async create(dto: CreateRouteDto): Promise<Route> {
    const { boarding_points, dropping_points, ...routeData } = dto;

    const route = this.routeRepo.create(routeData);
    const savedRoute = await this.routeRepo.save(route);

    if (boarding_points?.length) {
      const bps = boarding_points.map((bp) =>
        this.boardingRepo.create({ ...bp, route_id: savedRoute.id }),
      );
      await this.boardingRepo.save(bps);
    }

    if (dropping_points?.length) {
      const dps = dropping_points.map((dp) =>
        this.droppingRepo.create({ ...dp, route_id: savedRoute.id }),
      );
      await this.droppingRepo.save(dps);
    }

    return this.findOne(savedRoute.id);
  }

  async findAll(): Promise<Route[]> {
    return this.routeRepo.find({ where: { is_active: true } });
  }

  async findOne(id: string): Promise<Route> {
    const route = await this.routeRepo.findOne({
      where: { id },
      relations: { boarding_points: true, dropping_points: true },
    });
    if (!route) throw new NotFoundException('Route not found');
    return route;
  }

  async search(source: string, destination: string): Promise<Route[]> {
    const qb = this.routeRepo
      .createQueryBuilder('route')
      .leftJoinAndSelect('route.boarding_points', 'bp')
      .leftJoinAndSelect('route.dropping_points', 'dp')
      .where('route.is_active = :active', { active: true });

    if (source) {
      qb.andWhere('LOWER(route.source_city) LIKE LOWER(:source)', {
        source: `%${source}%`,
      });
    }
    if (destination) {
      qb.andWhere('LOWER(route.destination_city) LIKE LOWER(:dest)', {
        dest: `%${destination}%`,
      });
    }

    return qb.getMany();
  }

  async update(id: string, dto: UpdateRouteDto): Promise<Route> {
    const route = await this.findOne(id);
    const { boarding_points, dropping_points, ...routeData } = dto;
    Object.assign(route, routeData);
    return this.routeRepo.save(route);
  }

  async remove(id: string): Promise<{ success: boolean }> {
    const route = await this.findOne(id);
    route.is_active = false;
    await this.routeRepo.save(route);
    return { success: true };
  }
}
