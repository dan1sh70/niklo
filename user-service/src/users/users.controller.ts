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
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('api/v1/user')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: any) {
    const userId = req.user.id;
    const data = await this.usersService.getProfile(userId);
    return { success: true, statusCode: 200, data };
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@Req() req: any, @Body() updateData: any) {
    const userId = req.user.id;
    const data = await this.usersService.updateProfile(userId, updateData);
    return { success: true, statusCode: 200, data };
  }

  @Post('kyc')
  @UseGuards(JwtAuthGuard)
  async uploadKyc(@Req() req: any, @Body() kycData: any) {
    const userId = req.user.id;
    const data = await this.usersService.uploadKyc(userId, kycData);
    return { success: true, statusCode: 200, data };
  }

  @Get('wallet')
  @UseGuards(JwtAuthGuard)
  async getWallet(@Req() req: any) {
    const userId = req.user.id;
    const data = await this.usersService.getWallet(userId);
    return { success: true, statusCode: 200, data };
  }

  @Get('locations')
  @UseGuards(JwtAuthGuard)
  async getSavedLocations(@Req() req: any) {
    const data = await this.usersService.getSavedLocations(req.user.id);
    return { success: true, statusCode: 200, data };
  }

  @Post('locations')
  @UseGuards(JwtAuthGuard)
  async addSavedLocation(@Req() req: any, @Body() locationData: any) {
    const userId = req.user.id;
    const data = await this.usersService.addSavedLocation(userId, locationData);
    return { success: true, statusCode: 201, data };
  }

  @Put('locations/:id')
  @UseGuards(JwtAuthGuard)
  async updateSavedLocation(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const data = await this.usersService.updateSavedLocation(req.user.id, id, dto);
    return { success: true, statusCode: 200, data };
  }

  @Delete('locations/:id')
  @UseGuards(JwtAuthGuard)
  async deleteSavedLocation(@Req() req: any, @Param('id') id: string) {
    const data = await this.usersService.deleteSavedLocation(req.user.id, id);
    return { success: true, statusCode: 200, data };
  }

  @Post('locations/:id/default')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async setDefaultLocation(@Req() req: any, @Param('id') id: string) {
    const data = await this.usersService.setDefaultLocation(req.user.id, id);
    return { success: true, statusCode: 200, data };
  }

  @Post('avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(@Req() req: any, @UploadedFile() file: any) {
    const userId = req.user.id;
    const data = await this.usersService.uploadAvatar(userId, file);
    return { success: true, statusCode: 200, data };
  }

  @Get('emergency-contacts')
  @UseGuards(JwtAuthGuard)
  async getEmergencyContacts(@Req() req: any) {
    const userId = req.user.id;
    const data = await this.usersService.getEmergencyContacts(userId);
    return { success: true, statusCode: 200, data };
  }

  @Post('emergency-contacts')
  @UseGuards(JwtAuthGuard)
  async addEmergencyContact(@Req() req: any, @Body() contactData: any) {
    const userId = req.user.id;
    const data = await this.usersService.addEmergencyContact(userId, contactData);
    return { success: true, statusCode: 200, data };
  }

  @Delete('emergency-contacts/:id')
  @UseGuards(JwtAuthGuard)
  async deleteEmergencyContact(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.id;
    const data = await this.usersService.deleteEmergencyContact(userId, id);
    return { success: true, statusCode: 200, data };
  }

  @Post('emergency-sos/trigger')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async triggerEmergencySos(@Req() req: any, @Body() sosData: any) {
    const userId = req.user.id;
    const data = await this.usersService.triggerEmergencySos(userId, sosData);
    return { success: true, statusCode: 200, data };
  }

  @Post(':id/sync-wallet')
  @HttpCode(HttpStatus.OK)
  async syncWallet(@Param('id') id: string, @Body() body: { amount: number }) {
    const data = await this.usersService.syncWalletBalance(id, body.amount);
    return { success: true, statusCode: 200, data };
  }
}
