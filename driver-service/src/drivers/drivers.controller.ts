import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DriversService } from './drivers.service';
import { OnboardDriverDto, UploadKycDto } from './dto/create-driver.dto';
import { BankDetailsDto } from './dto/bank-details.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller()
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Post('onboard')
  async onboard(@Body() onboardDto: OnboardDriverDto) {
    const data = await this.driversService.onboard(onboardDto);
    return { success: true, data };
  }

  @Post('kyc')
  @UseGuards(JwtAuthGuard)
  async uploadKyc(@Body() kycDto: UploadKycDto) {
    const data = await this.driversService.uploadKyc(kycDto);
    return { success: true, data };
  }

  @Post('kyc/upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadKycFile(
    @Req() req: any,
    @UploadedFile() file: any,
    @Body('document_type') documentType: string,
  ) {
    if (!file) throw new BadRequestException('No file provided');
    if (!documentType) throw new BadRequestException('document_type is required');
    const data = await this.driversService.uploadKycDocument(req.user.id, documentType, file);
    return { success: true, data };
  }

  @Get('kyc/status')
  @UseGuards(JwtAuthGuard)
  async getKycStatus(@Query('driverId') driverId: string, @Req() req: any) {
    const targetId = driverId || req.user.id;
    const data = await this.driversService.getKycStatus(targetId);
    return { success: true, data };
  }

  @Get('earnings')
  @UseGuards(JwtAuthGuard)
  async getEarnings(@Query('driverId') driverId: string, @Req() req: any) {
    const targetId = driverId || req.user.id;
    const data = await this.driversService.getEarnings(targetId);
    return { success: true, data };
  }

  @Get('payouts')
  @UseGuards(JwtAuthGuard)
  async getPayouts(@Query('driverId') driverId: string, @Req() req: any) {
    const targetId = driverId || req.user.id;
    const data = await this.driversService.getPayouts(targetId);
    return { success: true, data };
  }

  @Get('wallet/summary')
  @UseGuards(JwtAuthGuard)
  async getWalletSummary(@Query('driverId') driverId: string, @Req() req: any) {
    const targetId = driverId || req.user.id;
    const data = await this.driversService.getWalletSummary(targetId);
    return { success: true, data };
  }

  @Get('bank-details')
  @UseGuards(JwtAuthGuard)
  async getBankDetails(@Query('driverId') driverId: string, @Req() req: any) {
    const targetId = driverId || req.user.id;
    const data = await this.driversService.getBankDetails(targetId);
    return { success: true, data };
  }

  @Post('bank-details')
  @UseGuards(JwtAuthGuard)
  async saveBankDetails(@Body() bankDetailsDto: BankDetailsDto, @Req() req: any) {
    if (!bankDetailsDto.driverId && req.user?.id) {
      bankDetailsDto.driverId = req.user.id;
    }
    const data = await this.driversService.saveBankDetails(bankDetailsDto);
    return { success: true, data };
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getDriverStats(@Query('driverId') driverId: string, @Req() req: any) {
    const targetId = driverId || req.user.id;
    const data = await this.driversService.getDriverStats(targetId);
    return { success: true, data };
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@Req() req: any, @Body() dto: any) {
    const data = await this.driversService.updateDriverProfile(req.user.id, dto);
    return { success: true, data };
  }

  @Put('vehicle')
  @UseGuards(JwtAuthGuard)
  async updateVehicle(@Req() req: any, @Body() dto: any) {
    const data = await this.driversService.updateDriverVehicle(req.user.id, dto);
    return { success: true, data };
  }

  @Post('session/start')
  @UseGuards(JwtAuthGuard)
  async startSession(@Body() body: { driverId?: string }, @Req() req: any) {
    const targetId = body?.driverId || req.user.id;
    const data = await this.driversService.startSession(targetId);
    return { success: true, data };
  }

  @Post('session/end')
  @UseGuards(JwtAuthGuard)
  async endSession(@Body() body: { driverId?: string }, @Req() req: any) {
    const targetId = body?.driverId || req.user.id;
    const data = await this.driversService.endSession(targetId);
    return { success: true, data };
  }

  @Post('withdraw')
  @UseGuards(JwtAuthGuard)
  async withdraw(@Body() body: { driverId?: string; amount: number }, @Req() req: any) {
    const targetId = body?.driverId || req.user.id;
    const data = await this.driversService.withdraw(targetId, body.amount);
    return { success: true, data };
  }

  @Get(':id/profile')
  async getProfile(@Param('id') id: string) {
    const data = await this.driversService.getProfile(id);
    return { success: true, data };
  }

  // Internal route called by ride-service
  @Post('earnings/record')
  async recordEarnings(@Body() body: { driverId: string; amount: number; type: any; rideId?: string }) {
    const data = await this.driversService.recordEarnings(body.driverId, body.amount, body.type, body.rideId);
    return { success: true, data };
  }

  // Internal route called by ride-service
  @Post(':id/rating')
  async recordRating(@Param('id') id: string, @Body() body: { rating: number }) {
    const data = await this.driversService.recordRating(id, body.rating);
    return { success: true, data };
  }
}
