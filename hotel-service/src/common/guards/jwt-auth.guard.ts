import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    // Simplified JWT decoding logic for Partner Scoping
    // In production, this would use @nestjs/jwt and verify the token.
    const authHeader = request.headers.authorization;
    if (authHeader) {
      // Mock decoding
      request.user = { id: 'p1111111-1111-1111-1111-111111111111', role: 'Hotel Partner' };
    } else {
      // Default mock for dev
      request.user = { id: 'p1111111-1111-1111-1111-111111111111', role: 'Hotel Partner' };
    }
    return true;
  }
}
