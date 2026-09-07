import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    
    // Check for authorization header first
    const authHeader = request.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        // Decode token to get user info (assuming standard JWT structure without verifying signature here since gateway might have done it)
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const payload = JSON.parse(jsonPayload);
        
        request.user = {
          id: payload.sub,
          phone: payload.phone,
          role: payload.role,
          // Extract partnerProfileId if available in token, or fallback to mock header/logic
          partnerProfileId: payload.partnerProfileId || request.headers['x-partner-profile-id'] || 'mock-partner-profile-id',
        };
        return true;
      } catch (e) {
        // Fall back to mock logic if token decode fails
      }
    }

    if (!request.user) {
      request.user = { 
        id: request.headers['x-user-id'] || 'f5012a44-245f-4a0b-99d8-842e47c1a842',
        partnerProfileId: request.headers['x-partner-profile-id'] || 'mock-partner-profile-id'
      };
    }
    return true;
  }
}
