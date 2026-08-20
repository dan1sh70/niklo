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

@Controller('api/v1/payment')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('orders')
  async createOrder(@Request() req: any, @Body() dto: CreateOrderDto) {
    return this.paymentsService.createOrder(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('orders/:id')
  async getPaymentDetails(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }

  @Post('webhook/razorpay')
  async razorpayWebhook(@Request() req: any, @Body() body: any) {
    const signature = req.headers['x-razorpay-signature'];
    return this.paymentsService.handleWebhook(body, signature);
  }
}
