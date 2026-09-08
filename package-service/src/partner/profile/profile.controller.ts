import { Controller, Get, Post, Put, Patch, Body, Param, UseGuards, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';

@Controller('api/v1/package-partner/profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  async getProfile(@Req() req: any) {
    return { success: true, data: await this.profileService.getProfile(req.user.id) };
  }

  @Put('business')
  async updateBusinessDetails(@Req() req: any, @Body() body: any) {
    return { success: true, data: await this.profileService.updateBusinessDetails(req.user.id, body) };
  }

  @Patch('notifications-toggle')
  async toggleNotifications(@Req() req: any, @Body() body: any) {
    return { success: true, message: 'Notification preferences updated' }; // Mock for now
  }

  @Get('bank')
  async getBankDetails(@Req() req) {
    const data = await this.profileService.getBankDetails(req.user.partnerProfileId);
    return { success: true, data };
  }

  @Post('bank/otp/send')
  async sendBankOtp(@Req() req) {
    const data = await this.profileService.sendBankOtp(req.user.partnerProfileId);
    return data;
  }

  @Put('bank')
  async addBankDetails(@Req() req, @Body() body: any) {
    const data = await this.profileService.addBankDetails(req.user.partnerProfileId, body);
    return {
      success: true,
      message: 'Bank account updated and verified via penny-drop! A 24-hour security hold has been applied to automated settlements.',
      data
    };
  }

  @Get('support/categories')
  async getSupportCategories() {
    return this.profileService.getSupportCategories();
  }

  @Get('support/tickets')
  async getSupportTickets(@Req() req) {
    return this.profileService.getSupportTickets(req.user.partnerProfileId);
  }

  @Post('support/tickets')
  async raiseSupportTicket(@Req() req, @Body() body: any) {
    return this.profileService.raiseSupportTicket(req.user.partnerProfileId, body);
  }

  @Get('legal/:documentType')
  async getLegalDocument(@Param('documentType') documentType: string) {
    return this.profileService.getLegalDocument(documentType);
  }

  @Post('logout')
  async logout(@Req() req: any, @Body() body: any) {
    return { success: true, data: await this.profileService.logout(req.user.id, body.fcmToken || '') };
  }
}
