import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'fallback-secret',
    });
  }

  // Shaped like every other service's strategy (`req.user.id`), which is what
  // the controllers here already read. Returning only `userId` meant
  // `req.user.id` was silently undefined: `POST /operators` stored a null
  // `user_id` on every operator it created, and `GET /operators/me` queried on
  // `user_id: undefined` and died with a 500 instead of a 404 — so an operator
  // could never be linked to, or found from, the account that owned it.
  async validate(payload: any) {
    return { id: payload.sub, ...payload };
  }
}
