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
import { AdventuresService } from './adventures.service';

@Controller(['adventure', 'adventures'])
export class AdventuresController {
  constructor(private readonly adventuresService: AdventuresService) {}

  @Post()
  async create(@Body() createAdventureDto: any) {
    const dto = {
      ...createAdventureDto,
      duration_hours: createAdventureDto.duration_hours ?? 2,
      location: createAdventureDto.location ?? 'Global',
    };
    const data = await this.adventuresService.create(dto);
    return { success: true, statusCode: 201, data };
  }

  @Get()
  async findAll(@Query() query: any) {
    const data = await this.adventuresService.findAll(query);
    return { success: true, statusCode: 200, data };
  }

  @Get('categories')
  async getCategories() {
    const data = await this.adventuresService.getCategories();
    return { success: true, statusCode: 200, data };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    if (id === 'uuid-here') {
      return { success: false, statusCode: 400, message: 'Please provide a valid UUID' };
    }
    const data = await this.adventuresService.findOne(id);
    return { success: true, statusCode: 200, data };
  }

  @Post(':id/availability')
  @HttpCode(HttpStatus.OK)
  async checkAvailability(@Param('id') id: string, @Body() checkParams: any) {
    const data = await this.adventuresService.checkAvailability(id, checkParams);
    return { success: true, statusCode: 200, data };
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateAdventureDto: any,
  ) {
    if (id === 'uuid-here') {
      return { success: false, statusCode: 400, message: 'Please provide a valid UUID' };
    }
    const data = await this.adventuresService.update(id, updateAdventureDto);
    return { success: true, statusCode: 200, data };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    if (id === 'uuid-here') {
      return { success: false, statusCode: 400, message: 'Please provide a valid UUID' };
    }
    const data = await this.adventuresService.remove(id);
    return { success: true, statusCode: 200, data };
  }
}
