import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto, UpdateScheduleDto } from './dto/schedule.dto';
import { BookSeatsDto, ReleaseSeatsDto } from './dto/seat-booking.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { InternalOrJwtAuthGuard } from '../common/guards/internal-or-jwt-auth.guard';

@Controller('api/v1/bus/schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get('search')
  async search(
    @Query('source') source: string,
    @Query('destination') destination: string,
    @Query('date') date: string,
  ) {
    return this.schedulesService.searchByRoute(source, destination, date);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() dto: CreateScheduleDto) {
    return this.schedulesService.create(dto);
  }

  @Get()
  async findAll(
    @Query('route_id') routeId?: string,
    @Query('date') date?: string,
    @Query('operator_id') operatorId?: string,
  ) {
    return this.schedulesService.findAll(routeId, date, operatorId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.schedulesService.findOne(id);
  }

  @Get(':id/seats')
  async getSeats(@Param('id') id: string) {
    return this.schedulesService.getSeats(id);
  }

  /**
   * Claims seats for a booking. Called by booking-service during checkout —
   * never by a client directly, since the caller decides which booking owns
   * the seats.
   */
  @UseGuards(InternalOrJwtAuthGuard)
  @Post(':id/seats/book')
  @HttpCode(HttpStatus.OK)
  async bookSeats(@Param('id') id: string, @Body() dto: BookSeatsDto) {
    return this.schedulesService.bookSeats(id, dto);
  }

  // Also reached by booking-service's unpaid-booking sweep, which runs with no
  // user context — hence the internal-key path.
  @UseGuards(InternalOrJwtAuthGuard)
  @Post(':id/seats/release')
  @HttpCode(HttpStatus.OK)
  async releaseSeats(@Param('id') id: string, @Body() dto: ReleaseSeatsDto) {
    return this.schedulesService.releaseSeats(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateScheduleDto) {
    return this.schedulesService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async cancel(@Param('id') id: string) {
    return this.schedulesService.cancel(id);
  }
}
