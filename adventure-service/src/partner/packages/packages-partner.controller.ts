import { Controller, Get, Post, Patch, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { PackagesPartnerService } from './packages-partner.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';

@Controller('api/v1/adventure')
@UseGuards(JwtAuthGuard)
export class PackagesPartnerController {
  constructor(private readonly packagesService: PackagesPartnerService) {}

  @Get('activities/:activityId/packages')
  async listPackages(@Req() req: any, @Param('activityId') activityId: string) {
    const data = await this.packagesService.listPackages(req.user.id, activityId);
    return { success: true, data };
  }

  @Post('activities/:activityId/packages')
  async createPackage(@Req() req: any, @Param('activityId') activityId: string, @Body() body: any) {
    const data = await this.packagesService.createPackage(req.user.id, activityId, body);
    return { success: true, message: 'Package tier created successfully', data };
  }

  @Patch('packages/:id')
  async updatePackage(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const data = await this.packagesService.updatePackage(req.user.id, id, body);
    return { success: true, message: 'Package updated successfully', data };
  }

  @Patch('packages/:id/status')
  async toggleStatus(@Req() req: any, @Param('id') id: string, @Body() body: { status: string }) {
    const data = await this.packagesService.toggleStatus(req.user.id, id, body.status);
    return { success: true, message: `Package status updated to ${data.status}`, data };
  }

  @Delete('packages/:id')
  async archivePackage(@Req() req: any, @Param('id') id: string) {
    await this.packagesService.archivePackage(req.user.id, id);
    return { success: true, message: 'Package archived successfully' };
  }
}
