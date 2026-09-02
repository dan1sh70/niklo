import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    try {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        const token = parts[1];
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString('utf8'));
          
          if (!payload.sub && !payload.id) {
             throw new UnauthorizedException('Invalid token payload: missing user ID');
          }

          request.user = {
            id: payload.sub || payload.id,
            email: payload.email,
            name: payload.name,
            ...payload,
          };
          return true;
        }
      }
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    throw new UnauthorizedException('Invalid Authorization header format');
  }
}
