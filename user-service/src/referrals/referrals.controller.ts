import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ReferralsService } from './referrals.service';
import { JwtAuthGuard } from '../users/jwt-auth.guard';

@Controller('api/v1/user/referrals')
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getReferralStats(@Req() req: any) {
    const data = await this.referralsService.getReferralStats(req.user.id);
    return { success: true, statusCode: 200, data };
  }

  @Post('apply')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async applyReferralCode(
    @Req() req: any,
    @Body('referral_code') code: string,
  ) {
    const data = await this.referralsService.applyReferralCode(
      req.user.id,
      code,
    );
    return { success: true, statusCode: 200, data };
  }
}
