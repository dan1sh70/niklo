import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Permissions } from '../auth/roles.guard';

@Controller('api/v1/admin/users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Permissions('read:users')
  async getUsers() {
    return this.usersService.getUsers();
  }

  @Post(':id/reset-password')
  @Permissions('write:users')
  async resetPassword(@Param('id') id: string) {
    return this.usersService.resetPassword(id);
  }

  @Post(':id/ban')
  @Permissions('write:users')
  async banUser(@Param('id') id: string) {
    return this.usersService.banUser(id);
  }
}
