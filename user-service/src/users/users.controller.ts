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

@Controller('api/v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  getProfile() {
    // In a real app, extract user ID from JWT token using a guard
    const userId = '123e4567-e89b-12d3-a456-426614174000'; // dummy uuid
    return this.usersService.getProfile(userId);
  }

  @Put('profile')
  updateProfile(@Body() updateData: any) {
    const userId = '123e4567-e89b-12d3-a456-426614174000'; // dummy uuid
    return this.usersService.updateProfile(userId, updateData);
  }

  @Post('kyc')
  uploadKyc(@Body() kycData: any) {
    const userId = '123e4567-e89b-12d3-a456-426614174000'; // dummy uuid
    return this.usersService.uploadKyc(userId, kycData);
  }

  @Get('wallet')
  getWallet() {
    const userId = '123e4567-e89b-12d3-a456-426614174000'; // dummy uuid
    return this.usersService.getWallet(userId);
  }
}
