import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApprovalsService } from './approvals.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Permissions } from '../auth/roles.guard';
import { ApprovalStatus } from './entities/approval.entity';

@Controller('api/v1/admin/approvals')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Get()
  @Permissions('read:finance', 'approve:payouts', 'approve:refunds')
  async getApprovals(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: ApprovalStatus,
  ) {
    return this.approvalsService.getApprovals(parseInt(page, 10), parseInt(limit, 10), status);
  }

  @Post(':id/approve')
  @Permissions('approve:payouts', 'approve:refunds')
  async approve(@Param('id') id: string, @Req() req: any, @Body() body: { comments?: string }) {
    return this.approvalsService.updateApproval(id, ApprovalStatus.APPROVED, req.user.id, body.comments);
  }

  @Post(':id/reject')
  @Permissions('approve:payouts', 'approve:refunds')
  async reject(@Param('id') id: string, @Req() req: any, @Body() body: { comments?: string }) {
    return this.approvalsService.updateApproval(id, ApprovalStatus.REJECTED, req.user.id, body.comments);
  }
}
