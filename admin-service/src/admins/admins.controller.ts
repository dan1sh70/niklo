import { Controller, Get, Post, Body, Param, Req, UseGuards, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminsService } from './admins.service';
import * as bcrypt from 'bcrypt';

@Controller('api/v1/admin/profile')
@UseGuards(AuthGuard('jwt'))
export class AdminsController {
  constructor(private readonly adminsService: AdminsService) {}

  @Get()
  async getProfile(@Req() req: any) {
    const admin = await this.adminsService.findById(req.user.id);
    if (!admin) throw new UnauthorizedException('Admin not found');
    const { password_hash, totp_secret, ...result } = admin;
    return result;
  }

  @Post('change-password')
  async changePassword(@Req() req: any, @Body() body: any) {
    const { currentPassword, newPassword } = body;
    const admin = await this.adminsService.findById(req.user.id);
    if (!admin) throw new UnauthorizedException('Admin not found');
    
    const isMatch = await bcrypt.compare(currentPassword, admin.password_hash);
    if (!isMatch) throw new UnauthorizedException('Invalid current password');
    
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);
    await this.adminsService.updatePassword(req.user.id, hash);
    
    return { success: true };
  }

  @Get('all')
  async getAllAdmins() {
    const admins = await this.adminsService.findAll();
    return admins.map(({ password_hash, totp_secret, ...rest }) => rest);
  }

  @Post('create')
  async createNewAdmin(@Body() body: any) {
    const { email, name, password, role_id } = body;
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password || 'Admin@123!', salt);
    const newAdmin = await this.adminsService.createAdmin({
      email,
      name,
      password_hash,
      role_id,
    });
    const { password_hash: _, totp_secret: __, ...result } = newAdmin;
    return result;
  }

  @Post(':id/status')
  async toggleAdminStatus(@Param('id') id: string, @Body() body: { is_active: boolean }) {
    return this.adminsService.updateAdmin(id, { is_active: body.is_active });
  }
}
