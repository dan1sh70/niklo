import { Controller, Get, Post, Put, Delete, Patch, Body, Param, Req, UseGuards, Query, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { PackagesPartnerService } from './packages-partner.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('api/v1/package-partner/packages')
@UseGuards(JwtAuthGuard)
export class PackagesPartnerController {
  constructor(private readonly packageService: PackagesPartnerService) {}

  @Get()
  async getPackages(@Req() req: any, @Query() query: any) {
    const data = await this.packageService.getPackages(req.user.partnerProfileId, query);
    return { success: true, ...data };
  }

  @Get(':id')
  async getPackage(@Req() req: any, @Param('id') id: string) {
    const data = await this.packageService.getPackage(req.user.partnerProfileId, id);
    return { success: true, data };
  }

  @Post('draft')
  async createDraft(@Req() req: any) {
    const data = await this.packageService.initializeDraft(req.user.partnerProfileId);
    return { success: true, message: 'Draft created', data };
  }

  @Put(':id/basic-info')
  async saveBasicInfo(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const data = await this.packageService.saveBasicInfo(req.user.partnerProfileId, id, body);
    return { success: true, message: 'Basic info saved', data };
  }

  @Post(':id/photos')
  @UseInterceptors(FilesInterceptor('files', 11)) // up to 10 gallery + 1 cover
  async uploadPhoto(
    @Req() req: any,
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: any
  ) {
    const data = await this.packageService.uploadMediaBatch(req.user.partnerProfileId, id, files, body);
    return { success: true, message: 'Media uploaded', data };
  }

  @Put(':id/itinerary')
  async saveItinerary(@Req() req: any, @Param('id') id: string, @Body() body: { itinerary: any[] }) {
    const data = await this.packageService.saveItinerary(req.user.partnerProfileId, id, body.itinerary);
    return { success: true, message: 'Itinerary saved', data };
  }

  @Put(':id/inclusions')
  async saveInclusions(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const data = await this.packageService.saveInclusions(req.user.partnerProfileId, id, body);
    return { success: true, message: 'Inclusions saved', data };
  }

  @Put(':id/pricing')
  async savePricing(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const data = await this.packageService.savePricing(req.user.partnerProfileId, id, body);
    return { success: true, message: 'Pricing saved', data };
  }

  @Put(':id/availability')
  async saveAvailability(@Req() req: any, @Param('id') id: string, @Body() body: { seatsPerDeparture: number; departureDates: any[] }) {
    const data = await this.packageService.saveAvailability(req.user.partnerProfileId, id, body);
    return { success: true, message: 'Availability saved', data };
  }

  @Get(':id/availability-calendar')
  async getAvailabilityCalendar(@Req() req: any, @Param('id') id: string, @Query('month') month: string, @Query('year') year: string) {
    const data = await this.packageService.getAvailabilityCalendar(req.user.partnerProfileId, id, month, year);
    return { success: true, data };
  }

  @Put(':id/availability/slots')
  async updateAvailabilitySlots(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const data = await this.packageService.updateAvailabilitySlots(req.user.partnerProfileId, id, body);
    return { success: true, message: 'Availability slots updated', data };
  }

  @Post(':id/publish')
  async publishPackage(@Req() req: any, @Param('id') id: string) {
    const data = await this.packageService.publishPackage(req.user.partnerProfileId, id);
    return { success: true, message: 'Package published successfully', data };
  }

  @Delete(':id')
  async deletePackage(@Req() req: any, @Param('id') id: string) {
    await this.packageService.deletePackage(req.user.partnerProfileId, id);
    return { success: true, message: 'Package deleted' };
  }

  @Patch(':id/status')
  async toggleStatus(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const data = await this.packageService.toggleStatus(req.user.partnerProfileId, id, body);
    return { success: true, message: 'Package status updated', data };
  }
}
