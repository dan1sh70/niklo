import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto, UpdateApiKeyDto } from './dto/api-key.dto';

@Controller('api/v1/admin/api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Get()
  findAll() {
    return this.apiKeysService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.apiKeysService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateApiKeyDto) {
    return this.apiKeysService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateApiKeyDto) {
    return this.apiKeysService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.apiKeysService.remove(id);
  }
}
