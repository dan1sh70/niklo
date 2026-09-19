import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Missing authorization header');
    }

    try {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        const token = parts[1];
        const secret = process.env.JWT_SECRET || 'fallback_secret_for_dev';
        const payload = jwt.verify(token, secret) as any;
        request.user = {
          id: payload.sub || payload.id,
          email: payload.email,
          name: payload.name,
          ...payload,
        };
        return true;
      }
      throw new UnauthorizedException('Invalid authorization format');
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
