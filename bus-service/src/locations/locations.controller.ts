import { Controller, Get, Query } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Route } from '../routes/entities/route.entity';

@Controller('api/v1/bus/locations')
export class LocationsController {
  
  constructor(private readonly dataSource: DataSource) {}

  @Get('autocomplete')
  async autocomplete(@Query('query') query: string) {
    if (!query) return [];
    
    // Fuzzy ILIKE query on source_city and destination_city
    const routes = await this.dataSource.getRepository(Route)
      .createQueryBuilder('route')
      .where('LOWER(route.source_city) LIKE LOWER(:query)', { query: `%${query}%` })
      .orWhere('LOWER(route.destination_city) LIKE LOWER(:query)', { query: `%${query}%` })
      .getMany();
      
    // Extract distinct cities
    const citiesSet = new Set<string>();
    routes.forEach(r => {
      if (r.source_city.toLowerCase().includes(query.toLowerCase())) {
        citiesSet.add(r.source_city);
      }
      if (r.destination_city.toLowerCase().includes(query.toLowerCase())) {
        citiesSet.add(r.destination_city);
      }
    });

    return Array.from(citiesSet).map((city, i) => ({
      id: `loc-${i}`,
      name: city,
      type: 'city'
    }));
  }
}
