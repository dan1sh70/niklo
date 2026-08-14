import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
} from '@nestjs/common';
import { AppService } from './app.service';

@Controller('api/v1/ai-planner')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('plan-journey')
  planJourney(@Body() requestData: any) {
    return this.appService.planJourney(requestData);
  }

  @Post('book-multimodal')
  bookMultimodal(@Body() bookingData: any) {
    return this.appService.bookMultimodal(bookingData);
  }

  @Get('saved-journeys')
  getSavedJourneys(@Req() req: any) {
    // Assuming user id is passed via some middleware or headers in real app
    const userId = req.headers['x-user-id'] || 'user-1';
    return this.appService.getSavedJourneys(userId);
  }

  @Post('save-journey')
  saveJourney(@Body() journeyData: any) {
    return this.appService.saveJourney(journeyData);
  }

  @Delete('saved-journeys/:id')
  deleteSavedJourney(@Param('id') id: string) {
    return this.appService.deleteSavedJourney(id);
  }

  @Get('alerts')
  getAlerts(@Req() req: any) {
    const userId = req.headers['x-user-id'] || 'user-1';
    return this.appService.getAlerts(userId);
  }

  @Put('alerts')
  updateAlerts(@Body() alertData: any) {
    return this.appService.updateAlerts(alertData);
  }

  @Post('smart-schedule-optimizer')
  optimizeSchedule(@Body() scheduleData: any) {
    return this.appService.optimizeSchedule(scheduleData);
  }
}
