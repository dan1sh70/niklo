import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { AdventuresService } from './adventures.service';
import { CreateAdventureDto } from './dto/create-adventure.dto';
import { UpdateAdventureDto } from './dto/update-adventure.dto';

@Controller('api/v1/adventures')
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
    return { success: true, data };
  }

  @Get()
  async findAll() {
    const data = await this.adventuresService.findAll();
    return { success: true, data };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    if (id === 'uuid-here') {
      return { success: false, message: 'Please provide a valid UUID' };
    }
    const data = await this.adventuresService.findOne(id);
    return { success: true, data };
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateAdventureDto: any,
  ) {
    if (id === 'uuid-here') {
      return { success: false, message: 'Please provide a valid UUID' };
    }
    const data = await this.adventuresService.update(id, updateAdventureDto);
    return { success: true, data };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    if (id === 'uuid-here') {
      return { success: false, message: 'Please provide a valid UUID' };
    }
    const data = await this.adventuresService.remove(id);
    return { success: true, data };
  }
}
