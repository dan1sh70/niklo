import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BusesService } from './buses.service';
import { CreateBusDto } from './dto/create-bus.dto';
import { UpdateBusDto } from './dto/update-bus.dto';
import { BulkCreateSeatsDto } from './dto/create-seat.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('api/v1/bus/buses')
export class BusesController {
  constructor(private readonly busesService: BusesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() dto: CreateBusDto) {
    return this.busesService.create(dto);
  }

  @Get()
  async findAll(@Query('operator_id') operatorId?: string) {
    return this.busesService.findAll(operatorId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.busesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateBusDto) {
    return this.busesService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/seats')
  async bulkCreateSeats(
    @Param('id') id: string,
    @Body() dto: BulkCreateSeatsDto,
  ) {
    return this.busesService.bulkCreateSeats(id, dto);
  }

  @Get(':id/seats')
  async getSeats(@Param('id') id: string) {
    return this.busesService.getSeats(id);
  }
}
