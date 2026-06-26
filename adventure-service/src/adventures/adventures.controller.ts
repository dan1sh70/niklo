import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { AdventuresService } from './adventures.service';
import { CreateAdventureDto } from './dto/create-adventure.dto';
import { UpdateAdventureDto } from './dto/update-adventure.dto';

@Controller()
export class AdventuresController {
  constructor(private readonly adventuresService: AdventuresService) {}

  @Post()
  async create(@Body() createAdventureDto: CreateAdventureDto) {
    const data = await this.adventuresService.create(createAdventureDto);
    return { success: true, data };
  }

  @Get()
  async findAll() {
    const data = await this.adventuresService.findAll();
    return { success: true, data };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.adventuresService.findOne(id);
    return { success: true, data };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateAdventureDto: UpdateAdventureDto) {
    const data = await this.adventuresService.update(id, updateAdventureDto);
    return { success: true, data };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const data = await this.adventuresService.remove(id);
    return { success: true, data };
  }
}
