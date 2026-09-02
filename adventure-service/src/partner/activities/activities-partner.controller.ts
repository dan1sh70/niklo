import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, Req,
  UseGuards, UseInterceptors, UploadedFile, HttpCode, HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ActivitiesPartnerService } from './activities-partner.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';

@Controller('api/v1/adventure/activities')
@UseGuards(JwtAuthGuard)
export class ActivitiesPartnerController {
  constructor(private readonly activitiesService: ActivitiesPartnerService) {}

  @Get()
  async listActivities(@Req() req: any, @Query() query: any) {
    const data = await this.activitiesService.listActivities(req.user.id, query);
    return { success: true, data };
  }

  @Post('media/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadMedia(@UploadedFile() file: Express.Multer.File, @Body() body: { isCover?: string }) {
    const data = await this.activitiesService.uploadMedia(file, body.isCover === 'true');
    return { success: true, message: 'Media uploaded successfully', data };
  }

  @Get(':id')
  async getActivity(@Req() req: any, @Param('id') id: string) {
    const data = await this.activitiesService.getActivity(req.user.id, id);
    return { success: true, data };
  }

  @Post()
  async createActivity(@Req() req: any, @Body() body: any) {
    const data = await this.activitiesService.createActivity(req.user.id, body);
    return { success: true, message: 'Activity created and published successfully', data };
  }

  @Patch(':id')
  async updateActivity(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const data = await this.activitiesService.updateActivity(req.user.id, id, body);
    return { success: true, message: 'Activity updated successfully', data };
  }

  @Patch(':id/status')
  async toggleStatus(@Req() req: any, @Param('id') id: string, @Body() body: { status: string }) {
    const data = await this.activitiesService.toggleStatus(req.user.id, id, body.status);
    return { success: true, message: `Activity status changed to ${data.status}`, data };
  }

  @Delete(':id')
  async archiveActivity(@Req() req: any, @Param('id') id: string) {
    await this.activitiesService.archiveActivity(req.user.id, id);
    return { success: true, message: 'Activity archived successfully' };
  }
}
