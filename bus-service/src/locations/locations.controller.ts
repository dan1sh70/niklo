import { Controller, Get, Query } from '@nestjs/common';

@Controller('api/v1/bus/locations')
export class LocationsController {
  
  @Get('autocomplete')
  async autocomplete(@Query('query') query: string) {
    if (!query) return [];
    
    // Mocking a database ILIKE search
    const mockCities = [
      'Mumbai, Maharashtra',
      'Pune, Maharashtra',
      'Delhi, NCR',
      'Bangalore, Karnataka',
      'Hyderabad, Telangana',
      'Chennai, Tamil Nadu',
      'Kolkata, West Bengal',
      'Ahmedabad, Gujarat'
    ];
    
    return mockCities.filter(c => c.toLowerCase().includes(query.toLowerCase())).map((city, i) => ({
      id: `loc-${i}`,
      name: city,
      type: 'city'
    }));
  }
}
