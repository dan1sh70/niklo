import { Controller, Post, Req, Res, Headers, BadRequestException, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from '../payments/payments.service';
import { WalletService } from '../wallet/wallet.service';
import { PaymentStatus } from '../payments/entities/payment.entity';
import * as crypto from 'crypto';

@Controller('api/v1/payment/webhook')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly paymentsService: PaymentsService,
    private readonly walletService: WalletService,
  ) {}

  @Post('razorpay')
  async handleRazorpayWebhook(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    const secret = this.configService.get<string>('razorpay.webhook_secret');
    if (!secret) {
      this.logger.error('Webhook secret not configured');
      return res.status(500).send('Configuration Error');
    }

    const payload = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    if (expectedSignature !== signature) {
      this.logger.warn('Invalid signature for webhook');
      return res.status(400).send('Invalid signature');
    }

    const event = req.body.event;
    const paymentData = req.body.payload.payment.entity;
    const orderId = paymentData.order_id;
    const paymentId = paymentData.id;
    const method = paymentData.method;

    if (event === 'payment.captured') {
      this.logger.log(`Payment captured for order ${orderId}`);
      const payment = await this.paymentsService.updatePaymentStatus(
        orderId,
        PaymentStatus.COMPLETED,
        paymentId,
        method
      );
      
      // If payment is for a wallet top-up (no booking_id), process the top-up
      if (payment && !payment.booking_id) {
        await this.walletService.processTopUpSuccess(payment.user_id, payment.amount, paymentId);
      }
      
    } else if (event === 'payment.failed') {
      this.logger.log(`Payment failed for order ${orderId}`);
      await this.paymentsService.updatePaymentStatus(
        orderId,
        PaymentStatus.FAILED,
        paymentId,
        method
      );
    }

    res.status(200).json({ status: 'ok' });
  }
}
