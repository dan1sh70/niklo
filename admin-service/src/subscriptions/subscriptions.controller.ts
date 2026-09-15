import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionPlanDto, UpdateSubscriptionPlanDto } from './dto/subscription.dto';

@Controller('api/v1/admin/subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  findAll() {
    return this.subscriptionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.subscriptionsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateSubscriptionPlanDto) {
    return this.subscriptionsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSubscriptionPlanDto) {
    return this.subscriptionsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.subscriptionsService.remove(id);
  }
}
