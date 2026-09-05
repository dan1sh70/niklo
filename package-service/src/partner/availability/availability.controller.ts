import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';

@Controller('api/v1/package-partner/availability')
@UseGuards(JwtAuthGuard)
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get('slots')
  async getSlotsForDate(@Req() req: any, @Query() query: any) {
    const data = await this.availabilityService.getSlotsForDate(req.user.id, query.date, query.activityId);
    return { success: true, data };
  }

  @Get('calendar/month-summary')
  async getMonthSummary(@Req() req: any, @Query() query: any) {
    const data = await this.availabilityService.getMonthSummary(req.user.id, Number(query.year), Number(query.month));
    return { success: true, data };
  }

  @Post('slots')
  async createSlot(@Req() req: any, @Body() body: any) {
    const data = await this.availabilityService.createSlot(req.user.id, body);
    return { success: true, message: 'Slot(s) scheduled and published successfully', data };
  }

  @Patch('slots/:id')
  async updateSlot(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const data = await this.availabilityService.updateSlot(req.user.id, id, body);
    return { success: true, message: 'Slot updated successfully', data };
  }

  @Patch('slots/:id/status')
  async toggleSlotStatus(@Req() req: any, @Param('id') id: string, @Body() body: { isClosed: boolean }) {
    const data = await this.availabilityService.toggleSlotStatus(req.user.id, id, body.isClosed);
    return { success: true, message: `Slot status updated to ${data.statusText}`, data };
  }

  @Delete('slots/:id')
  async deleteSlot(@Req() req: any, @Param('id') id: string) {
    await this.availabilityService.deleteSlot(req.user.id, id);
    return { success: true, message: 'Time slot deleted successfully' };
  }
}
