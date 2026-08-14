import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import {
  PlanJourneyDto,
  BookMultiModalDto,
  SaveJourneyDto,
  UpdateAlertsDto,
  OptimizeScheduleDto,
} from './dto/ai-planner.dto';

@Controller()
export class HealthController {
  @Get()
  health() {
    return { status: 'ok' };
  }
}

@Controller('api/v1/ai-planner')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('plan-journey')
  @HttpCode(HttpStatus.OK)
  async planJourney(@Body() dto: PlanJourneyDto) {
    const data = await this.appService.planJourney(dto);
    return { success: true, statusCode: 200, data };
  }

  @UseGuards(JwtAuthGuard)
  @Post('book-multimodal')
  @HttpCode(HttpStatus.OK)
  async bookMultiModal(@Request() req: any, @Body() dto: BookMultiModalDto) {
    const data = await this.appService.bookMultiModal(req.user.id, dto);
    return { success: true, statusCode: 200, data };
  }

  @UseGuards(JwtAuthGuard)
  @Get('saved-journeys')
  async getSavedJourneys(@Request() req: any) {
    const data = await this.appService.getSavedJourneys(req.user.id);
    return { success: true, statusCode: 200, data };
  }

  @UseGuards(JwtAuthGuard)
  @Post('save-journey')
  @HttpCode(HttpStatus.OK)
  async saveJourney(@Request() req: any, @Body() dto: SaveJourneyDto) {
    const data = await this.appService.saveJourney(req.user.id, dto);
    return { success: true, statusCode: 200, message: 'Journey successfully saved to profile', data };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('saved-journeys/:id')
  async deleteSavedJourney(@Request() req: any, @Param('id') id: string) {
    await this.appService.deleteSavedJourney(req.user.id, id);
    return { success: true, statusCode: 200, message: 'Saved journey deleted successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('alerts')
  async getAlerts(@Request() req: any) {
    const data = await this.appService.getAlerts(req.user.id);
    return { success: true, statusCode: 200, data };
  }

  @UseGuards(JwtAuthGuard)
  @Put('alerts')
  async updateAlerts(@Request() req: any, @Body() dto: UpdateAlertsDto) {
    const data = await this.appService.updateAlerts(req.user.id, dto);
    return { success: true, statusCode: 200, data };
  }

  @Post('smart-schedule-optimizer')
  @HttpCode(HttpStatus.OK)
  async optimizeSchedule(@Body() dto: OptimizeScheduleDto) {
    const data = await this.appService.optimizeSchedule(dto);
    return { success: true, statusCode: 200, data };
  }
}
