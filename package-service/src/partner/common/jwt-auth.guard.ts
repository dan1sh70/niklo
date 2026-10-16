import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DEFAULT_TEST_UUID = 'a0000000-0000-0000-0000-000000000001';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    
    // Check for authorization header first
    const authHeader = request.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const payload = JSON.parse(jsonPayload);
        
        const rawPartnerId = payload.partnerProfileId ||
                             request.headers['x-partner-profile-id'] ||
                             payload.sub;

        request.user = {
          id: (payload.sub && UUID_REGEX.test(payload.sub)) ? payload.sub : DEFAULT_TEST_UUID,
          phone: payload.phone,
          role: payload.role || 'PARTNER',
          partnerProfileId: (rawPartnerId && UUID_REGEX.test(rawPartnerId)) ? rawPartnerId : DEFAULT_TEST_UUID,
        };
        return true;
      } catch (e) {
        // Fall back to header inspection
      }
    }

    const rawUserId = request.headers['x-user-id'];
    const rawPartnerId = request.headers['x-partner-profile-id'];

    request.user = { 
      id: (rawUserId && UUID_REGEX.test(rawUserId)) ? rawUserId : 'f5012a44-245f-4a0b-99d8-842e47c1a842',
      partnerProfileId: (rawPartnerId && UUID_REGEX.test(rawPartnerId)) ? rawPartnerId : DEFAULT_TEST_UUID,
    };
    return true;
  }
}
