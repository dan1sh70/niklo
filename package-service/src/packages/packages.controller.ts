import {
  Controller,
  Get,
  Query,
  Param,
} from '@nestjs/common';
import { PackagesService } from './packages.service';

@Controller('api/v1/packages')
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Get()
  async findAll(@Query() query: any) {
    const data = await this.packagesService.findAll(query);
    return { success: true, statusCode: 200, data };
  }

  @Get('search')
  async searchPackages(@Query() query: any) {
    const data = await this.packagesService.searchPackages(query);
    return { success: true, statusCode: 200, data };
  }

  @Get('popular')
  async getPopularDestinations() {
    const data = await this.packagesService.getPopularDestinations();
    return { success: true, statusCode: 200, data };
  }

  @Get('categories')
  async getCategories() {
    const data = await this.packagesService.getCategories();
    return { success: true, statusCode: 200, data };
  }

  @Get('trending')
  async getTrendingPackages() {
    const data = await this.packagesService.getTrendingPackages();
    return { success: true, statusCode: 200, data };
  }

  @Get('offers')
  async getOffers() {
    const data = await this.packagesService.getOffers();
    return { success: true, statusCode: 200, data };
  }

  @Get('cities')
  async getCities() {
    const data = await this.packagesService.getCities();
    return { success: true, statusCode: 200, data };
  }

  @Get('destination/:name')
  async getPackagesByDestination(@Param('name') name: string) {
    const data = await this.packagesService.getPackagesByDestination(name);
    return { success: true, statusCode: 200, data };
  }

  @Get('category/:name')
  async getPackagesByCategory(@Param('name') name: string) {
    const data = await this.packagesService.getPackagesByCategory(name);
    return { success: true, statusCode: 200, data };
  }

  @Get(':id/availability')
  async checkAvailability(
    @Param('id') id: string,
    @Query() checkParams: any,
  ) {
    const data = await this.packagesService.checkAvailability(id, checkParams);
    return { success: true, statusCode: 200, data };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.packagesService.findOne(id);
    return { success: true, statusCode: 200, data };
  }
}
