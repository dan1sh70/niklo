import {
  Controller, Get, Post, Delete, Body, Param, Req, UseGuards,
  UseInterceptors, UploadedFile, HttpCode, HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SetupService } from './setup.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';

@Controller('api/v1/package-partner/setup')
@UseGuards(JwtAuthGuard)
export class SetupController {
  constructor(private readonly setupService: SetupService) {}

  @Get('meta')
  getSetupMeta() {
    return { success: true, data: this.setupService.getSetupMeta() };
  }

  @Get('progress')
  async getProgress(@Req() req: any) {
    const data = await this.setupService.getProgress(req.user.id);
    return { success: true, data };
  }

  @Post('partner-type')
  async savePartnerType(@Req() req: any, @Body() body: { partnerType: string }) {
    const data = await this.setupService.savePartnerType(req.user.id, body.partnerType);
    return { success: true, message: 'Partner type saved', data };
  }

  @Post('business-details')
  async saveBusinessDetails(@Req() req: any, @Body() body: any) {
    const data = await this.setupService.saveBusinessDetails(req.user.id, body);
    return { success: true, message: 'Business details saved', data };
  }

  @Post('categories')
  async saveCategories(@Req() req: any, @Body() body: { categoryIds: string[] }) {
    const data = await this.setupService.saveCategories(req.user.id, body.categoryIds);
    return { success: true, message: 'Categories saved', data };
  }

  @Post('location')
  async saveLocation(@Req() req: any, @Body() body: any) {
    const data = await this.setupService.saveLocation(req.user.id, body);
    return { success: true, message: 'Operating location saved', data };
  }

  @Post('documents/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @Req() req: any,
    @Body() body: { docType: string; title: string },
    @UploadedFile() file: Express.Multer.File,
  ) {
    const data = await this.setupService.uploadDocument(req.user.id, body.docType, body.title, file);
    return {
      success: true,
      message: 'Document uploaded successfully',
      data: { id: data.id, docType: data.doc_type, fileName: data.file_name, status: data.status },
    };
  }

  @Delete('documents/:docType')
  async deleteDocument(@Req() req: any, @Param('docType') docType: string) {
    await this.setupService.deleteDocument(req.user.id, docType);
    return { success: true, message: 'Document removed' };
  }

  @Post('bank')
  async verifyBankDetails(@Req() req: any, @Body() body: { accountName: string; accountNumber: string; ifsc: string }) {
    const data = await this.setupService.verifyBankDetails(req.user.id, body);
    return { success: true, message: 'Bank details verified and saved', data };
  }

  @Post('submit')
  @HttpCode(HttpStatus.OK)
  async submitForVerification(@Req() req: any) {
    const data = await this.setupService.submitForVerification(req.user.id);
    return { success: true, message: 'Onboarding application submitted successfully', data };
  }

  @Get('verification-status')
  async getVerificationStatus(@Req() req: any) {
    const data = await this.setupService.getVerificationStatus(req.user.id);
    return { success: true, data };
  }
}
