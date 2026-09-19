import {
  Controller, Get, Post, Delete, Body, Param, Req, UseGuards,
  UseInterceptors, UploadedFile, HttpCode, HttpStatus, Query, BadRequestException
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

  @Post('email/otp/send')
  async sendEmailOtp(@Req() req: any) {
    return { success: true, message: 'OTP sent to email', data: { otp: '1234' } }; // Mocked
  }

  @Post('email/otp/verify')
  async verifyEmailOtp(@Req() req: any, @Body() body: { otp: string }) {
    const data = await this.setupService.verifyEmail(req.user.id, body.otp);
    return { success: true, message: 'Email verified', data };
  }

  @Post('phone/otp/send')
  async sendPhoneOtp(@Req() req: any) {
    return { success: true, message: 'OTP sent to phone', data: { otp: '1234' } }; // Mocked
  }

  @Post('phone/otp/verify')
  async verifyPhoneOtp(@Req() req: any, @Body() body: { otp: string }) {
    const data = await this.setupService.verifyPhone(req.user.id, body.otp);
    return { success: true, message: 'Phone verified', data };
  }

  @Post('business')
  async saveBusinessDetails(@Req() req: any, @Body() body: any) {
    // Body now matches { businessName, email, phone, address: { line1, city, state, pincode }, panNumber, ownerName }
    if (body.panNumber) {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(body.panNumber)) {
        throw new BadRequestException('Invalid PAN number format');
      }
    }
    const data = await this.setupService.saveBusinessDetails(req.user.id, body);
    return { success: true, message: 'Business details saved', data };
  }

  @Post('categories')
  async saveCategories(@Req() req: any, @Body() body: any) {
    // Body matches { primaryRegions, tourCategories, averageGroupSize }
    const data = await this.setupService.saveCategories(req.user.id, body.tourCategories || []);
    return { success: true, message: 'Categories saved', data };
  }

  @Get('documents')
  async getDocuments(@Req() req: any) {
    const data = await this.setupService.getDocuments(req.user.id);
    return { success: true, data };
  }

  @Post('documents/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @Req() req: any,
    @Body() body: { documentType: string; documentNumber?: string },
    @UploadedFile() file: Express.Multer.File,
  ) {
    const data = await this.setupService.uploadDocument(req.user.id, body.documentType, body.documentType, file);
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

  @Get('bank/ifsc-lookup')
  async ifscLookup(@Query('code') code: string) {
    // Mock IFSC lookup
    return {
      success: true,
      data: {
        bankName: 'HDFC Bank',
        branch: 'Andheri West',
        city: 'Mumbai'
      }
    };
  }

  @Post('bank')
  async verifyBankDetails(@Req() req: any, @Body() body: { accountHolderName: string; accountNumber: string; confirmAccountNumber: string; ifscCode: string; accountType: string }) {
    const data = await this.setupService.verifyBankDetails(req.user.id, body);
    return { success: true, message: 'Bank details verified and saved', data };
  }

  @Post('submit')
  @HttpCode(HttpStatus.OK)
  async submitForVerification(@Req() req: any) {
    const data = await this.setupService.submitForVerification(req.user.id);
    return { success: true, message: 'Onboarding application submitted successfully', data };
  }

  @Get('status')
  async getStatus(@Req() req: any) {
    const data = await this.setupService.getVerificationStatus(req.user.id);
    return { success: true, data };
  }
}
