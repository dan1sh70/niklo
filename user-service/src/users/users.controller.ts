import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller(['api/v1/user', 'api/v1/users'])
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  getProfile(@Req() req: any) {
    const userId = req.user.id;
    return this.usersService.getProfile(userId);
  }

  @Put('profile')
  updateProfile(@Req() req: any, @Body() updateData: any) {
    const userId = req.user.id;
    return this.usersService.updateProfile(userId, updateData);
  }

  @Post('kyc')
  uploadKyc(@Req() req: any, @Body() kycData: any) {
    const userId = req.user.id;
    return this.usersService.uploadKyc(userId, kycData);
  }

  @Get('wallet')
  getWallet(@Req() req: any) {
    const userId = req.user.id;
    return this.usersService.getWallet(userId);
  }

  @Post('locations')
  addSavedLocation(@Req() req: any, @Body() locationData: any) {
    const userId = req.user.id;
    return this.usersService.addSavedLocation(userId, locationData);
  }
}
