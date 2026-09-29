import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AdminsService } from '../admins/admins.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly adminsService: AdminsService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'super-secret-admin-key',
    });
  }

  async validate(payload: any) {
    if (payload.pending_2fa) {
      throw new UnauthorizedException('Please complete 2FA');
    }
    const admin = await this.adminsService.findById(payload.sub);
    if (!admin || !admin.is_active) {
      throw new UnauthorizedException('Admin is inactive or not found');
    }
    return admin;
  }
}
