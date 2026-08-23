import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { PopularRoutesService } from './popular-routes.service';
import { CreatePopularRouteDto } from './dto/create-popular-route.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('api/v1/bus/popular-routes')
export class PopularRoutesController {
  constructor(private readonly routesService: PopularRoutesService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getPopularRoutes() {
    const data = await this.routesService.getActivePopularRoutes();
    return {
      success: true,
      statusCode: 200,
      data,
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async createPopularRoute(@Body() dto: CreatePopularRouteDto) {
    const data = await this.routesService.createPopularRoute(dto);
    return {
      success: true,
      statusCode: 201,
      message: 'Popular route created successfully',
      data,
    };
  }
}
