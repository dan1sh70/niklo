import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { PayoutsService } from './payouts.service';
import { CreatePayoutDto, ProcessPayoutDto } from './dto/payout.dto';

@Controller('api/v1/admin/payouts')
export class PayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  @Get()
  findAll() {
    return this.payoutsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.payoutsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreatePayoutDto) {
    return this.payoutsService.create(dto);
  }

  @Patch(':id/process')
  process(@Param('id') id: string, @Body() dto: ProcessPayoutDto) {
    return this.payoutsService.process(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.payoutsService.remove(id);
  }
}
