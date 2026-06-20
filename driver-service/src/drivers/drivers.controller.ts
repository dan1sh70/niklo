import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { DriversService } from './drivers.service';
import { OnboardDriverDto, UploadKycDto } from './dto/create-driver.dto';

@Controller()
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
}
