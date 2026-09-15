import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { CreateVendorDto, UpdateVendorDto } from './dto/vendor.dto';

@Controller('api/v1/admin/vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Get()
  findAll() {
    return this.vendorsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vendorsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateVendorDto) {
    return this.vendorsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateVendorDto) {
    return this.vendorsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.vendorsService.remove(id);
  }
}
