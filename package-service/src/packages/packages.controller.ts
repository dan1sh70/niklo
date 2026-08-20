import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PackagesService } from './packages.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';

@Controller('api/v1/packages')
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Post()
  async create(@Body() createPackageDto: CreatePackageDto) {
    const data = await this.packagesService.create(createPackageDto);
    return { success: true, statusCode: 201, data };
  }

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

  @Get('destinations/popular')
  async getPopularDestinations() {
    const data = await this.packagesService.getPopularDestinations();
    return { success: true, statusCode: 200, data };
  }

  @Get('destination/:name')
  async getPackagesByDestination(@Param('name') name: string) {
    const data = await this.packagesService.getPackagesByDestination(name);
    return { success: true, statusCode: 200, data };
  }

  @Get('category/:category')
  async getPackagesByCategory(@Param('category') category: string) {
    const data = await this.packagesService.getPackagesByCategory(category);
    return { success: true, statusCode: 200, data };
  }

  @Get('categories')
  async getCategories() {
    const data = await this.packagesService.getCategories();
    return { success: true, statusCode: 200, data };
  }

  @Get('trending')
  async getTrendingPackages(@Query('limit') limit: number) {
    const data = await this.packagesService.getTrendingPackages(limit ? Number(limit) : 6);
    return { success: true, statusCode: 200, data };
  }

  @Get('offers')
  async getOffers() {
    const data = await this.packagesService.getOffers();
    return { success: true, statusCode: 200, data };
  }

  @Get('meta/cities')
  async getCities() {
    const data = await this.packagesService.getCities();
    return { success: true, statusCode: 200, data };
  }

  @Post(':id/availability')
  @HttpCode(HttpStatus.OK)
  async checkAvailability(@Param('id') id: string, @Body() checkParams: any) {
    const data = await this.packagesService.checkAvailability(id, checkParams);
    return { success: true, statusCode: 200, data };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.packagesService.findOne(id);
    return { success: true, statusCode: 200, data };
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePackageDto: UpdatePackageDto,
  ) {
    const data = await this.packagesService.update(id, updatePackageDto);
    return { success: true, statusCode: 200, data };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const data = await this.packagesService.remove(id);
    return { success: true, statusCode: 200, data };
  }
}
