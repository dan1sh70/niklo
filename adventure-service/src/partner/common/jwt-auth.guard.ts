import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    // In a real microservice, API Gateway handles auth and sets the user header.
    // We mock the user here for development.
    if (!request.user) {
      request.user = { id: request.headers['x-user-id'] || 'f5012a44-245f-4a0b-99d8-842e47c1a842' };
    }
    return true;
  }
}
