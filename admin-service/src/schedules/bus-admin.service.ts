import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class BusAdminService {
  private busServiceUrl = process.env.BUS_SERVICE_URL || 'http://bus-service:3003';

  constructor(private httpService: HttpService) {}

  private async request(method: string, path: string, data?: any, params?: any, headers?: any) {
    const url = `${this.busServiceUrl}${path}`;
    const response = await lastValueFrom(
      this.httpService.request({
        method,
        url,
        data,
        params,
        headers: {
          'content-type': 'application/json',
          'x-internal-secret': process.env.INTERNAL_API_SECRET || 'super-secret-internal-key',
          ...headers,
        },
        validateStatus: () => true,
      })
    );
    return response.data;
  }

  // --- BUSES ---
  async getBuses(operatorId?: string) {
    return this.request('GET', '/api/v1/bus/buses', null, { operator_id: operatorId });
  }

  async createBus(data: any, headers?: any) {
    return this.request('POST', '/api/v1/bus/buses', data, null, headers);
  }

  async getBusById(id: string) {
    return this.request('GET', `/api/v1/bus/buses/${id}`);
  }

  async updateBus(id: string, data: any, headers?: any) {
    return this.request('PATCH', `/api/v1/bus/buses/${id}`, data, null, headers);
  }

  async bulkCreateSeats(id: string, data: any, headers?: any) {
    return this.request('POST', `/api/v1/bus/buses/${id}/seats`, data, null, headers);
  }

  async getBusSeats(id: string) {
    return this.request('GET', `/api/v1/bus/buses/${id}/seats`);
  }

  // --- LOCATIONS ---
  async getLocationsAutocomplete(query: string) {
    return this.request('GET', '/api/v1/bus/locations/autocomplete', null, { query });
  }

  // --- OPERATORS ---
  async getOperators() {
    return this.request('GET', '/api/v1/bus/operators');
  }

  async createOperator(data: any, headers?: any) {
    return this.request('POST', '/api/v1/bus/operators', data, null, headers);
  }

  async getOperatorById(id: string) {
    return this.request('GET', `/api/v1/bus/operators/${id}`);
  }

  async getOperatorSummary(id: string, headers?: any) {
    return this.request('GET', `/api/v1/bus/operators/${id}/summary`, null, null, headers);
  }

  async updateOperator(id: string, data: any, headers?: any) {
    return this.request('PATCH', `/api/v1/bus/operators/${id}`, data, null, headers);
  }

  async deleteOperator(id: string, headers?: any) {
    return this.request('DELETE', `/api/v1/bus/operators/${id}`, null, null, headers);
  }

  // --- POPULAR ROUTES ---
  async getPopularRoutes() {
    return this.request('GET', '/api/v1/bus/popular-routes');
  }

  async createPopularRoute(data: any) {
    return this.request('POST', '/api/v1/bus/popular-routes', data);
  }

  // --- ROUTES ---
  async searchRoutes(source: string, destination: string) {
    return this.request('GET', '/api/v1/bus/routes/search', null, { source, destination });
  }

  async getRoutes() {
    return this.request('GET', '/api/v1/bus/routes');
  }

  async createRoute(data: any, headers?: any) {
    return this.request('POST', '/api/v1/bus/routes', data, null, headers);
  }

  async getRouteById(id: string) {
    return this.request('GET', `/api/v1/bus/routes/${id}`);
  }

  async updateRoute(id: string, data: any, headers?: any) {
    return this.request('PATCH', `/api/v1/bus/routes/${id}`, data, null, headers);
  }

  async deleteRoute(id: string, headers?: any) {
    return this.request('DELETE', `/api/v1/bus/routes/${id}`, null, null, headers);
  }

  // --- SCHEDULES ---
  async searchSchedules(source: string, destination: string, date: string) {
    return this.request('GET', '/api/v1/bus/schedules/search', null, { source, destination, date });
  }

  async getSchedules(routeId?: string, date?: string, operatorId?: string) {
    return this.request('GET', '/api/v1/bus/schedules', null, { route_id: routeId, date, operator_id: operatorId });
  }

  async createSchedule(data: any, headers?: any) {
    return this.request('POST', '/api/v1/bus/schedules', data, null, headers);
  }

  async getScheduleById(id: string) {
    return this.request('GET', `/api/v1/bus/schedules/${id}`);
  }

  async getScheduleSeatMap(id: string) {
    return this.request('GET', `/api/v1/bus/schedules/${id}/seat-map`);
  }

  async lockSeat(id: string, data: { seat_numbers: string[]; user_id: string }) {
    return this.request('POST', `/api/v1/bus/schedules/${id}/lock-seat`, data);
  }

  async confirmSeats(id: string, data: { seat_numbers: string[] }) {
    return this.request('POST', `/api/v1/bus/schedules/${id}/confirm-seats`, data);
  }

  async getScheduleBoardingPoints(id: string) {
    return this.request('GET', `/api/v1/bus/schedules/${id}/boarding-points`);
  }

  async updateSchedule(id: string, data: any, headers?: any) {
    return this.request('PATCH', `/api/v1/bus/schedules/${id}`, data, null, headers);
  }

  async deleteSchedule(id: string, headers?: any) {
    return this.request('DELETE', `/api/v1/bus/schedules/${id}`, null, null, headers);
  }
}
