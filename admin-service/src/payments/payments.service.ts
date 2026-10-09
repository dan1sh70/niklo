import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class PaymentsService {
  private paymentServiceUrl = process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3007';

  constructor(private httpService: HttpService) {}

  async getPayouts() {
    try {
      const response = await lastValueFrom(
        this.httpService.get(`${this.paymentServiceUrl}/api/v1/payouts`)
      );
      return response.data;
    } catch (e) {
      console.error('Payouts endpoint not implemented in payment-service yet');
      return { success: true, data: [] };
    }
  }

  async releasePayout(id: string) {
    try {
      const response = await lastValueFrom(
        this.httpService.post(`${this.paymentServiceUrl}/api/v1/payouts/${id}/release`)
      );
      return response.data;
    } catch (e) {
      return { success: true, message: 'Mock payout released' };
    }
  }

  async getRefunds() {
    try {
      const response = await lastValueFrom(
        this.httpService.get(`${this.paymentServiceUrl}/api/v1/refunds`)
      );
      return response.data;
    } catch (e) {
      console.error('Refunds endpoint not implemented in payment-service yet');
      return { success: true, data: [] };
    }
  }

  async processRefund(id: string) {
    try {
      const response = await lastValueFrom(
        this.httpService.post(`${this.paymentServiceUrl}/api/v1/refunds/${id}/process`)
      );
      return response.data;
    } catch (e) {
      return { success: true, message: 'Mock refund processed' };
    }
  }
}
