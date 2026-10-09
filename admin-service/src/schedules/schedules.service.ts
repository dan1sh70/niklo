import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class SchedulesService {
  private busServiceUrl = process.env.BUS_SERVICE_URL || 'http://bus-service:3003';

  constructor(private httpService: HttpService) {}

  async getSchedules() {
    const response = await lastValueFrom(
      this.httpService.get(`${this.busServiceUrl}/api/v1/bus/schedules`)
    );
    return response.data;
  }

  async createSchedule(data: any) {
    const response = await lastValueFrom(
      this.httpService.post(`${this.busServiceUrl}/api/v1/bus/schedules`, data)
    );
    return response.data;
  }
}
