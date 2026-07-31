import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Headers,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { DriversService } from './drivers.service';
import { OnboardDriverDto, UploadKycDto } from './dto/create-driver.dto';

// Shared secret for service-to-service writes. Set the same value on
// ride-service (`INTERNAL_API_TOKEN`); docker-compose gives both the same
// default so the pair works out of the box.
const INTERNAL_API_TOKEN = process.env.INTERNAL_API_TOKEN || '';

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

  /**
   * Credits a completed ride. Called by ride-service only — a driver must not
   * be able to write their own earnings, so this is behind a shared secret
   * rather than the caller's token.
   */
  @Post('earnings/record')
  async recordEarning(
    @Headers('x-internal-token') token: string,
    @Body() body: { driverId?: string; rideId?: string; amount?: number },
  ) {
    if (!INTERNAL_API_TOKEN || token !== INTERNAL_API_TOKEN) {
      throw new UnauthorizedException('Invalid internal token');
    }
    if (!body?.driverId || !body?.rideId || body?.amount == null) {
      throw new BadRequestException('driverId, rideId and amount are required');
    }

    const data = await this.driversService.recordRideEarning({
      driverId: body.driverId,
      rideId: body.rideId,
      amount: Number(body.amount),
    });
    return { success: true, data };
  }

  @Get('payouts')
  async getPayouts(@Query('driverId') driverId: string) {
    const data = await this.driversService.getPayouts(driverId);
    return { success: true, data };
  }

  // Kept last: a bare `:driverId` would otherwise swallow `kyc/status`,
  // `earnings` and `payouts`.
  @Get(':driverId')
  async getDriver(@Param('driverId') driverId: string) {
    const data = await this.driversService.findByIdOrUserId(driverId);
    return { success: true, data };
  }
}
