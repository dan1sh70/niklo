import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    // Only log state-changing requests
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      return next.handle().pipe(
        tap(() => {
          this.auditLogsService.log({
            admin_id: request.user?.id,
            action: `${request.method} ${request.route?.path}`,
            resource: request.route?.path,
            resource_id: request.params?.id || null,
            metadata: { body: request.body, query: request.query },
            ip_address: request.ip,
            user_agent: request.headers['user-agent'],
          }).catch((err) => console.error('Failed to write audit log:', err));
        }),
      );
    }

    return next.handle();
  }
}
