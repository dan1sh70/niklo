import { Controller, Get, Param, Post, Delete, Body, UseGuards } from '@nestjs/common';
import { ContentService } from './content.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Permissions } from '../auth/roles.guard';

@Controller('api/v1/admin/content')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get('blogs')
  @Permissions('read:content')
  async getBlogs() {
    return this.contentService.getBlogs();
  }

  @Post('blogs')
  @Permissions('write:content')
  async createBlog(@Body() data: unknown) {
    return this.contentService.createBlog(data);
  }

  @Delete('blogs/:id')
  @Permissions('write:content')
  async deleteBlog(@Param('id') id: string) {
    return this.contentService.deleteBlog(id);
  }
}
