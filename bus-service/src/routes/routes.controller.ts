import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { RoutesService } from './routes.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('api/v1/bus/routes')
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Get('search')
  async search(
    @Query('source') source: string,
    @Query('destination') destination: string,
  ) {
    return this.routesService.search(source, destination);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() dto: CreateRouteDto) {
    return this.routesService.create(dto);
  }

  @Get()
  async findAll() {
    return this.routesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.routesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateRouteDto) {
    return this.routesService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    return this.routesService.remove(id);
  }
}
