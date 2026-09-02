import { Controller, Get, Post, Patch, Put, Body, Param, Req, UseGuards, UseInterceptors, UploadedFile, HttpCode, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';

@Controller('api/v1/adventure')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('profile')
  async getProfile(@Req() req: any) {
    const data = await this.profileService.getProfile(req.user.id);
    return { success: true, data };
  }

  @Patch('profile/business-details')
  async updateBusinessDetails(@Req() req: any, @Body() body: any) {
    const data = await this.profileService.updateBusinessDetails(req.user.id, body);
    return { success: true, message: 'Business details updated successfully', data };
  }

  @Get('profile/documents')
  async getDocuments(@Req() req: any) {
    const data = await this.profileService.getDocuments(req.user.id);
    return { success: true, data };
  }

  @Post('profile/documents')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(@Req() req: any, @Body() body: any, @UploadedFile() file: Express.Multer.File) {
    const data = await this.profileService.uploadDocument(req.user.id, file, body);
    return { success: true, message: 'Compliance document uploaded successfully', data };
  }

  @Put('profile/documents/:id')
  @UseInterceptors(FileInterceptor('file'))
  async renewDocument(@Req() req: any, @Param('id') id: string, @Body() body: any, @UploadedFile() file: Express.Multer.File) {
    const data = await this.profileService.renewDocument(req.user.id, id, file, body);
    return { success: true, message: 'Compliance document submitted for renewal', data };
  }

  @Get('profile/bank-details')
  async getBankDetails(@Req() req: any) {
    const data = await this.profileService.getBankDetails(req.user.id);
    return { success: true, data };
  }

  @Post('profile/bank-details')
  async addBankDetails(@Req() req: any, @Body() body: any) {
    const data = await this.profileService.addBankDetails(req.user.id, body);
    return { success: true, message: 'Bank account added successfully', data };
  }

  @Post('auth/logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: any, @Body() body: { fcmToken?: string }) {
    await this.profileService.logout(req.user.id, body.fcmToken);
    return { success: true, message: 'Logged out successfully' };
  }
}
