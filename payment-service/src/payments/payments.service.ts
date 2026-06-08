import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { ConfigService } from '@nestjs/config';
import { CreateOrderDto } from './dto/create-order.dto';
import Razorpay = require('razorpay');

@Injectable()
export class PaymentsService {
  private razorpayInstance: Razorpay;

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    private configService: ConfigService,
  ) {
    const key_id = this.configService.get<string>('razorpay.key_id');
    const key_secret = this.configService.get<string>('razorpay.key_secret');
    if (key_id && key_secret) {
      this.razorpayInstance = new Razorpay({ key_id, key_secret });
    }
  }

  async createOrder(userId: string, dto: CreateOrderDto) {
    if (!this.razorpayInstance) {
      throw new InternalServerErrorException('Razorpay credentials not configured');
    }

    // Amount should be in smallest currency unit (e.g. paise for INR)
    const amountInPaise = Math.round(dto.amount * 100);

    const orderOptions = {
      amount: amountInPaise,
      currency: dto.currency || 'INR',
      receipt: `rcpt_${userId}_${Date.now()}`,
    };

    try {
      const order = await this.razorpayInstance.orders.create(orderOptions);

      const payment = this.paymentRepo.create({
        user_id: userId,
        booking_id: dto.booking_id,
        amount: dto.amount,
        currency: order.currency,
        razorpay_order_id: order.id,
        status: PaymentStatus.PENDING,
      });

      const savedPayment = await this.paymentRepo.save(payment);

      return {
        payment_id: savedPayment.id,
        razorpay_order_id: order.id,
        amount: order.amount,
        currency: order.currency,
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to create Razorpay order', error.message);
    }
  }

  async findOne(id: string): Promise<Payment> {
    const payment = await this.paymentRepo.findOne({ where: { id } });
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  async updatePaymentStatus(orderId: string, status: PaymentStatus, paymentId?: string, method?: string) {
    const payment = await this.paymentRepo.findOne({ where: { razorpay_order_id: orderId } });
    if (payment) {
      payment.status = status;
      if (paymentId) payment.razorpay_payment_id = paymentId;
      if (method) payment.payment_method = method;
      await this.paymentRepo.save(payment);
      return payment;
    }
    return null;
  }
}
