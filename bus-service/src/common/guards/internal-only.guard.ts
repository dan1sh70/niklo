import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class InternalOnlyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const secret = request.headers['x-internal-secret'];
    
    // In production, compare with process.env.INTERNAL_API_SECRET
    if (secret !== (process.env.INTERNAL_API_SECRET || 'super-secret-internal-key')) {
      throw new ForbiddenException('Access denied. Internal endpoint only.');
    }
    return true;
  }
}
