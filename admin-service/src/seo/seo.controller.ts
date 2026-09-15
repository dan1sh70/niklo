import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { SeoService } from './seo.service';
import { CreateSeoBlogDto, UpdateSeoBlogDto } from './dto/seo-blog.dto';

@Controller('api/v1/admin/seo/blogs')
export class SeoController {
  constructor(private readonly seoService: SeoService) {}

  @Get()
  findAll() {
    return this.seoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.seoService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateSeoBlogDto) {
    return this.seoService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSeoBlogDto) {
    return this.seoService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.seoService.remove(id);
  }
}
