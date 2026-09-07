import { Controller, Get, Post, Put, Delete, Patch, Body, Param, Req, UseGuards, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { PackagesPartnerService } from './packages-partner.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';

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
  @UseInterceptors(FileInterceptor('file'))
  async uploadPhoto(
    @Req() req: any,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { isCover?: string }
  ) {
    const data = await this.packageService.uploadMedia(req.user.partnerProfileId, id, file, body.isCover === 'true');
    return { success: true, message: 'Media uploaded', data };
  }

  @Put(':id/itinerary')
  async saveItinerary(@Req() req: any, @Param('id') id: string, @Body() body: { days: any[] }) {
    const data = await this.packageService.saveItinerary(req.user.partnerProfileId, id, body.days);
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
  async saveAvailability(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const data = await this.packageService.saveAvailability(req.user.partnerProfileId, id, body);
    return { success: true, message: 'Availability saved', data };
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
