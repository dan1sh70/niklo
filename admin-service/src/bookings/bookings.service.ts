import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class BookingsService {
  private bookingServiceUrl = process.env.BOOKING_SERVICE_URL || 'http://booking-service:3014';

  constructor(private httpService: HttpService) {}

  async getBookings() {
    const response = await lastValueFrom(
      this.httpService.get(`${this.bookingServiceUrl}/api/v1/bookings/internal/all`)
    );
    return response.data;
  }

  async cancelBooking(id: string) {
    const response = await lastValueFrom(
      this.httpService.post(`${this.bookingServiceUrl}/api/v1/bookings/internal/${id}/cancel`)
    );
    return response.data;
  }
}
