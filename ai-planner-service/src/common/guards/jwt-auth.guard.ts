import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('Missing Authorization header');
    }
    
    // For prototype purposes, we mock a decoded user context
    // In production, you would verify the JWT with JwtService here.
    request.user = {
      id: 'usr_test_9999',
      email: 'test@example.com',
    };
    
    return true;
  }
}
