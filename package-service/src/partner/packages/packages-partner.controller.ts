import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { PackagesPartnerService } from './packages-partner.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('api/v1/package-partner/packages')
@UseGuards(JwtAuthGuard)
export class PackagesPartnerController {
  constructor(private readonly packageService: PackagesPartnerService) {}

  @Get()
  async getPackages(@Req() req: any, @Query() query: any) {
    const data = await this.packageService.getPackages(req.user.id, query);
    return { success: true, ...data };
  }

  @Get(':id')
  async getPackage(@Req() req: any, @Param('id') id: string) {
    const data = await this.packageService.getPackage(req.user.id, id);
    return { success: true, data };
  }

  // WIZARD STEP 1: Basic Details
  @Post('wizard/step-1')
  async saveStep1(@Req() req: any, @Body() body: any) {
    const data = await this.packageService.saveStep1(req.user.id, body);
    return { success: true, message: 'Step 1 saved', data };
  }

  // WIZARD STEP 2: Itinerary Setup
  @Post('wizard/:id/step-2')
  async saveStep2(@Req() req: any, @Param('id') id: string, @Body() body: { days: any[] }) {
    const data = await this.packageService.saveStep2(req.user.id, id, body.days);
    return { success: true, message: 'Step 2 saved', data };
  }

  // WIZARD STEP 3: Inclusions & Exclusions
  @Post('wizard/:id/step-3')
  async saveStep3(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const data = await this.packageService.saveStep3(req.user.id, id, body);
    return { success: true, message: 'Step 3 saved', data };
  }

  // WIZARD STEP 4: Group Size & Price
  @Post('wizard/:id/step-4')
  async saveStep4(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const data = await this.packageService.saveStep4(req.user.id, id, body);
    return { success: true, message: 'Step 4 saved', data };
  }

  // WIZARD STEP 5: Discounts & Offers
  @Post('wizard/:id/step-5')
  async saveStep5(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const data = await this.packageService.saveStep5(req.user.id, id, body);
    return { success: true, message: 'Step 5 saved', data };
  }

  // WIZARD STEP 6: Media Gallery
  @Post('wizard/:id/step-6/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadMedia(
    @Req() req: any,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { isCover?: string }
  ) {
    const data = await this.packageService.uploadMedia(req.user.id, id, file, body.isCover === 'true');
    return { success: true, message: 'Media uploaded', data };
  }

  @Delete('wizard/:id/step-6/:mediaId')
  async deleteMedia(@Req() req: any, @Param('id') id: string, @Param('mediaId') mediaId: string) {
    await this.packageService.deleteMedia(req.user.id, id, mediaId);
    return { success: true, message: 'Media deleted' };
  }

  // WIZARD STEP 7: Review & Publish
  @Post('wizard/:id/step-7/publish')
  async publishPackage(@Req() req: any, @Param('id') id: string) {
    const data = await this.packageService.publishPackage(req.user.id, id);
    return { success: true, message: 'Package published successfully', data };
  }

  @Delete(':id')
  async deletePackage(@Req() req: any, @Param('id') id: string) {
    await this.packageService.deletePackage(req.user.id, id);
    return { success: true, message: 'Package deleted' };
  }
}
