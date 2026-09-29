import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AdminsService } from '../admins/admins.service';
import * as bcrypt from 'bcrypt';
// @ts-ignore
import { authenticator } from 'otplib';

@Injectable()
export class AuthService {
  constructor(
    private readonly adminsService: AdminsService,
    private readonly jwtService: JwtService,
  ) {}

  async validateAdmin(email: string, pass: string): Promise<any> {
    const admin = await this.adminsService.findByEmail(email);
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    const isMatch = await bcrypt.compare(pass, admin.password_hash);
    if (isMatch) {
      const { password_hash, totp_secret, ...result } = admin;
      return result;
    }
    return null;
  }

  async login(admin: any) {
    if (admin.totp_enabled) {
      return {
        require_2fa: true,
        temp_token: this.jwtService.sign(
          { sub: admin.id, email: admin.email, pending_2fa: true },
          { expiresIn: '5m' }
        ),
      };
    }

    const payload = { sub: admin.id, email: admin.email, role: admin.role?.name };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async verify2FA(tempToken: string, token: string) {
    try {
      const decoded = this.jwtService.verify(tempToken);
      if (!decoded.pending_2fa) {
        throw new UnauthorizedException('Invalid temporary token');
      }

      const admin = await this.adminsService.findById(decoded.sub);
      if (!admin || !admin.totp_secret) {
        throw new UnauthorizedException('2FA not configured');
      }

      const isValid = authenticator.verify({
        token,
        secret: admin.totp_secret,
      });

      if (!isValid) {
        throw new UnauthorizedException('Invalid 2FA code');
      }

      const payload = { sub: admin.id, email: admin.email, role: admin.role?.name };
      return {
        access_token: this.jwtService.sign(payload),
      };
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
