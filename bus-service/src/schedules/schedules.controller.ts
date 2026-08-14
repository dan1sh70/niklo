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
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

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
  ) {
    return this.schedulesService.findAll(routeId, date);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.schedulesService.findOne(id);
  }

  @Get(':id/seats')
  async getSeats(@Param('id') id: string) {
    return this.schedulesService.getSeats(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/manifest')
  async getManifest(@Param('id') id: string) {
    return this.schedulesService.getManifest(id);
  }

  @Get(':id/seat-map')
  async getSeatMap(@Param('id') id: string) {
    return this.schedulesService.getSeatMap(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/lock-seat')
  async lockSeat(@Param('id') id: string, @Body() dto: { seatIds: string[] }) {
    // In actual implementation, this calls Redis like booking-service does
    return this.schedulesService.lockSeat(id, dto.seatIds);
  }

  @Get(':id/boarding-points')
  async getBoardingPoints(@Param('id') id: string) {
    return this.schedulesService.getBoardingPoints(id);
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
