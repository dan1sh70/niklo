import {
  Controller,
  Get,
  Put,
  Patch,
  Post,
  Delete,
  Body,
  Req,
  Param,
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

  @Patch('profile')
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

  @Post('avatar')
  uploadAvatar(@Req() req: any) {
    const userId = req.user.id;
    // Mocking file upload since no real storage is configured yet
    return this.usersService.uploadAvatar(userId, 'mock-file-data');
  }

  @Get('emergency-contacts')
  getEmergencyContacts(@Req() req: any) {
    const userId = req.user.id;
    return this.usersService.getEmergencyContacts(userId);
  }

  @Post('emergency-contacts')
  addEmergencyContact(@Req() req: any, @Body() contactData: any) {
    const userId = req.user.id;
    return this.usersService.addEmergencyContact(userId, contactData);
  }

  @Delete('emergency-contacts/:id')
  deleteEmergencyContact(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.id;
    return this.usersService.deleteEmergencyContact(userId, id);
  }

  @Post('emergency-sos/trigger')
  triggerEmergencySos(@Req() req: any, @Body() sosData: any) {
    const userId = req.user.id;
    return this.usersService.triggerEmergencySos(userId, sosData);
  }

  // --- Phase 3: Home Screen Aggregator ---
  @Get('active-trip')
  getActiveTrip(@Req() req: any) {
    const userId = req.user.id;
    return this.usersService.getActiveTrip(userId);
  }

  @Get('recommendations/smart-suggestions')
  getSmartSuggestions(@Req() req: any) {
    const userId = req.user.id;
    return this.usersService.getSmartSuggestions(userId);
  }

  @Get('promotions/banners')
  getPromotionsBanners() {
    return this.usersService.getPromotionsBanners();
  }
}
