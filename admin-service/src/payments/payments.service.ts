import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class PaymentsService {
  private paymentServiceUrl = process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3007';

  constructor(private httpService: HttpService) {}

  async getPayouts() {
    const response = await lastValueFrom(
      this.httpService.get(`${this.paymentServiceUrl}/api/v1/payouts`)
    );
    return response.data;
  }

  async releasePayout(id: string) {
    const response = await lastValueFrom(
      this.httpService.post(`${this.paymentServiceUrl}/api/v1/payouts/${id}/release`)
    );
    return response.data;
  }

  async getRefunds() {
    const response = await lastValueFrom(
      this.httpService.get(`${this.paymentServiceUrl}/api/v1/refunds`)
    );
    return response.data;
  }

  async processRefund(id: string) {
    const response = await lastValueFrom(
      this.httpService.post(`${this.paymentServiceUrl}/api/v1/refunds/${id}/process`)
    );
    return response.data;
  }
}
