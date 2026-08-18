import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { ConfigService } from '@nestjs/config';
import { CreateOrderDto } from './dto/create-order.dto';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import Razorpay = require('razorpay');


@Injectable()
export class PaymentsService {
  private razorpayInstance: Razorpay;

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    private configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    const key_id = this.configService.get<string>('razorpay.key_id');
    const key_secret = this.configService.get<string>('razorpay.key_secret');
    if (key_id && key_secret) {
      this.razorpayInstance = new Razorpay({ key_id, key_secret });
    }
  }

  async createOrder(userId: string, dto: CreateOrderDto) {
    const amountInPaise = Math.round(dto.amount * 100);

    if (!this.razorpayInstance) {
      // Return sandbox order for local development
      return {
        payment_id: `pay_${Date.now()}`,
        razorpay_order_id: `order_${Date.now()}`,
        amount: amountInPaise,
        currency: dto.currency || 'INR',
      };
    }

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
      throw new InternalServerErrorException(
        'Failed to create Razorpay order',
        error.message,
      );
    }
  }

  async findOne(id: string): Promise<Payment> {
    const payment = await this.paymentRepo.findOne({ where: { id } });
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  async updatePaymentStatus(
    orderId: string,
    status: PaymentStatus,
    paymentId?: string,
    method?: string,
  ) {
    const payment = await this.paymentRepo.findOne({
      where: { razorpay_order_id: orderId },
    });
    if (payment) {
      payment.status = status;
      if (paymentId) payment.razorpay_payment_id = paymentId;
      if (method) payment.payment_method = method;
      await this.paymentRepo.save(payment);
      return payment;
    }
    return null;
  }

  async handleWebhook(body: any, signature: string) {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || this.configService.get<string>('razorpay.webhook_secret');
    if (!webhookSecret) {
      throw new InternalServerErrorException('Webhook secret not configured');
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(body))
      .digest('hex');

    if (expectedSignature !== signature) {
      throw new BadRequestException('Invalid signature');
    }

    if (body.event === 'payment.captured') {
      const paymentEntity = body.payload.payment.entity;
      const payment = await this.updatePaymentStatus(paymentEntity.order_id, PaymentStatus.SUCCESS, paymentEntity.id, paymentEntity.method);
      
      // If payment is successful and has no booking_id, it's a wallet top-up
      if (payment && !payment.booking_id) {
        try {
          const userServiceUrl = process.env.USER_SERVICE_URL || 'http://user-service:3002';
          await lastValueFrom(this.httpService.post(`${userServiceUrl}/api/v1/user/${payment.user_id}/sync-wallet`, {
            amount: Number(payment.amount),
          }));
        } catch (error) {
          // Log error but don't fail webhook
          console.error(`Failed to sync wallet for user ${payment.user_id}:`, error.message);
        }
      }
    } else if (body.event === 'payment.failed') {
      const payment = body.payload.payment.entity;
      await this.updatePaymentStatus(payment.order_id, PaymentStatus.FAILED, payment.id, payment.method);
    }

    return {
      success: true,
      statusCode: 200,
      message: 'Payment webhook processed successfully'
    };
  }
}
