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
  Request,
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
    const data = await this.schedulesService.searchByRoute(source, destination, date);
    return { success: true, statusCode: 200, data };
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() dto: CreateScheduleDto) {
    const data = await this.schedulesService.create(dto);
    return { success: true, statusCode: 200, data };
  }

  @Get()
  async findAll(
    @Query('route_id') routeId?: string,
    @Query('date') date?: string,
  ) {
    const data = await this.schedulesService.findAll(routeId, date);
    return { success: true, statusCode: 200, data };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.schedulesService.findOne(id);
    return { success: true, statusCode: 200, data };
  }

  @Get(':id/seat-map')
  async getSeatMap(@Param('id') id: string) {
    const data = await this.schedulesService.getSeatMap(id);
    return { success: true, statusCode: 200, data };
  }

  @Post(':id/lock-seat')
  @HttpCode(HttpStatus.OK)
  async lockSeat(@Param('id') id: string, @Body() dto: { seat_numbers: string[], user_id: string }) {
    const data = await this.schedulesService.lockSeat(id, dto.seat_numbers, dto.user_id);
    return { success: true, statusCode: 200, data };
  }

  @Get(':id/boarding-points')
  async getBoardingPoints(@Param('id') id: string) {
    const data = await this.schedulesService.getBoardingPoints(id);
    return { success: true, statusCode: 200, data };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateScheduleDto) {
    const data = await this.schedulesService.update(id, dto);
    return { success: true, statusCode: 200, data };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async cancel(@Param('id') id: string) {
    const data = await this.schedulesService.cancel(id);
    return { success: true, statusCode: 200, data };
  }
}
