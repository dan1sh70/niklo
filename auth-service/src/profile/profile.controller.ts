import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

/// Both path prefixes are kept so the route matches whatever clients already
/// call — user-service served these under the same two.
@Controller(['api/v1/user', 'api/v1/users'])
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('profile')
  getProfile(@Request() req) {
    // JwtStrategy.validate returns { userId, phone } — note it is `userId`
    // here, not `id` as in user-service.
    return this.profileService.getProfile(req.user.userId);
  }

  @Put('profile')
  @HttpCode(HttpStatus.OK)
  updateProfile(@Request() req, @Body() dto: UpdateProfileDto) {
    return this.profileService.updateProfile(req.user.userId, dto);
  }
}
