import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { DriversService } from './drivers.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('api/v1/bus/drivers')
@UseGuards(JwtAuthGuard)
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Post()
  async create(@Body() dto: any) {
    const data = await this.driversService.create(dto);
    return { success: true, statusCode: 201, data };
  }

  @Get()
  async findAll(@Query('operator_id') operatorId?: string) {
    const data = await this.driversService.findAll(operatorId);
    return { success: true, statusCode: 200, data };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.driversService.findOne(id);
    return { success: true, statusCode: 200, data };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: any) {
    const data = await this.driversService.update(id, dto);
    return { success: true, statusCode: 200, data };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.driversService.remove(id);
    return { success: true, statusCode: 200, message: 'Driver deleted successfully' };
  }
}
