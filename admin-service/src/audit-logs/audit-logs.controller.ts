import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Permissions } from '../auth/roles.guard';
import { AuditLogsService } from './audit-logs.service';

@Controller('api/v1/admin/audit-logs')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @Permissions('read:system')
  async getLogs(@Query('skip') skip?: number, @Query('take') take?: number) {
    return this.auditLogsService.getLogs(skip ? Number(skip) : 0, take ? Number(take) : 50);
  }
}
