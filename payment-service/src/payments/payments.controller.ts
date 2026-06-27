import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('api/v1/payment/orders')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createOrder(@Request() req: any, @Body() dto: CreateOrderDto) {
    return this.paymentsService.createOrder(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getPaymentDetails(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }
}
