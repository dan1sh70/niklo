import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { RolesService } from './roles.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('api/v1/admin/roles')
@UseGuards(AuthGuard('jwt'))
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  async getRoles() {
    return this.rolesService.findAll();
  }

  @Post()
  async createRole(@Body() body: any) {
    return this.rolesService.createRole(body);
  }

  @Patch(':id')
  async updateRole(@Param('id') id: string, @Body() body: any) {
    return this.rolesService.updateRole(id, body);
  }
}
