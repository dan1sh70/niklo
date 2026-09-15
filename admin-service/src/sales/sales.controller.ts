import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateReferralDto, UpdateReferralDto } from './dto/referral.dto';

@Controller('api/v1/admin/sales/referrals')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  findAll() {
    return this.salesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.salesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateReferralDto) {
    return this.salesService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateReferralDto) {
    return this.salesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.salesService.remove(id);
  }
}
