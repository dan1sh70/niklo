import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { DriversService } from './drivers.service';
import { OnboardDriverDto, UploadKycDto } from './dto/create-driver.dto';
import { BankDetailsDto } from './dto/bank-details.dto';

@Controller('api/v1/driver')
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Post('onboard')
  async onboard(@Body() onboardDto: OnboardDriverDto) {
    const data = await this.driversService.onboard(onboardDto);
    return { success: true, data };
  }

  @Post('kyc')
  async uploadKyc(@Body() kycDto: UploadKycDto) {
    const data = await this.driversService.uploadKyc(kycDto);
    return { success: true, data };
  }

  @Get('kyc/status')
  async getKycStatus(@Query('driverId') driverId: string) {
    const data = await this.driversService.getKycStatus(driverId);
    return { success: true, data };
  }

  @Get('earnings')
  async getEarnings(@Query('driverId') driverId: string) {
    const data = await this.driversService.getEarnings(driverId);
    return { success: true, data };
  }

  @Get('payouts')
  async getPayouts(@Query('driverId') driverId: string) {
    const data = await this.driversService.getPayouts(driverId);
    return { success: true, data };
  }

  @Post('bank-details')
  async saveBankDetails(@Body() bankDetailsDto: BankDetailsDto) {
    const data = await this.driversService.saveBankDetails(bankDetailsDto);
    return { success: true, data };
  }

  @Post('session/start')
  async startSession(@Body() body: { driverId: string }) {
    const data = await this.driversService.startSession(body.driverId);
    return { success: true, data };
  }

  @Post('session/end')
  async endSession(@Body() body: { driverId: string }) {
    const data = await this.driversService.endSession(body.driverId);
    return { success: true, data };
  }

  @Post('withdraw')
  async withdraw(@Body() body: { driverId: string; amount: number }) {
    const data = await this.driversService.withdraw(body.driverId, body.amount);
    return { success: true, data };
  }
}
