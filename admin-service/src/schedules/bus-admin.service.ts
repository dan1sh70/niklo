import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class BusAdminService {
  private busServiceUrl = process.env.BUS_SERVICE_URL || 'http://bus-service:3003';

  constructor(private httpService: HttpService) {}

  private async request(method: string, path: string, data?: any, params?: any, headers?: any) {
    const url = `${this.busServiceUrl}${path}`;
    
    // Clean params so undefined / null values are not sent
    const cleanParams: Record<string, any> = {};
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          cleanParams[key] = params[key];
        }
      });
    }

    const config: any = {
      method,
      url,
      headers: {
        'x-internal-secret': process.env.INTERNAL_API_SECRET || 'super-secret-internal-key',
        ...headers,
      },
      validateStatus: () => true,
    };

    if (Object.keys(cleanParams).length > 0) {
      config.params = cleanParams;
    }

    // Only set data and content-type if there is actually a body to send (POST/PATCH/PUT)
    if (data !== undefined && data !== null) {
      config.data = data;
      config.headers['content-type'] = 'application/json';
    }

    const response = await lastValueFrom(this.httpService.request(config));
    return response.data;
  }

  private isValidUUID(str: any): boolean {
    if (typeof str !== 'string') return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str.trim());
  }

  // --- BUSES ---
  async getBuses(operatorId?: string) {
    return this.request('GET', '/api/v1/bus/buses', undefined, operatorId ? { operator_id: operatorId } : undefined);
  }

  async createBus(data: any, headers?: any) {
    const payload = { ...data };
    if (payload.operator_id && !this.isValidUUID(payload.operator_id)) {
      delete payload.operator_id;
    }
    return this.request('POST', '/api/v1/bus/buses', payload, null, headers);
  }

  async getBusById(id: string) {
    return this.request('GET', `/api/v1/bus/buses/${id}`);
  }

  async updateBus(id: string, data: any, headers?: any) {
    const payload: Record<string, any> = {};
    if (data && typeof data === 'object') {
      Object.keys(data).forEach((key) => {
        const val = data[key];
        if (val !== undefined && val !== null && val !== '') {
          // If operator_id is provided, only include it if it's a valid UUID
          if (key === 'operator_id') {
            if (this.isValidUUID(val)) {
              payload[key] = val.trim();
            }
          } else {
            payload[key] = val;
          }
        }
      });
    }
    return this.request('PATCH', `/api/v1/bus/buses/${id}`, payload, null, headers);
  }

  async bulkCreateSeats(id: string, data: any, headers?: any) {
    return this.request('POST', `/api/v1/bus/buses/${id}/seats`, data, null, headers);
  }

  async getBusSeats(id: string) {
    return this.request('GET', `/api/v1/bus/buses/${id}/seats`);
  }

  // --- LOCATIONS ---
  async getLocationsAutocomplete(query: string) {
    return this.request('GET', '/api/v1/bus/locations/autocomplete', undefined, { query });
  }

  // --- OPERATORS ---
  async getOperators() {
    return this.request('GET', '/api/v1/bus/operators');
  }

  async createOperator(data: any, headers?: any) {
    return this.request('POST', '/api/v1/bus/operators', data, undefined, headers);
  }

  async getOperatorById(id: string) {
    return this.request('GET', `/api/v1/bus/operators/${id}`);
  }

  async getOperatorSummary(id: string, headers?: any) {
    return this.request('GET', `/api/v1/bus/operators/${id}/summary`, undefined, undefined, headers);
  }

  async updateOperator(id: string, data: any, headers?: any) {
    return this.request('PATCH', `/api/v1/bus/operators/${id}`, data, undefined, headers);
  }

  async deleteOperator(id: string, headers?: any) {
    return this.request('DELETE', `/api/v1/bus/operators/${id}`, undefined, undefined, headers);
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
    return this.request('GET', '/api/v1/bus/routes/search', undefined, { source, destination });
  }

  async getRoutes() {
    return this.request('GET', '/api/v1/bus/routes');
  }

  async createRoute(data: any, headers?: any) {
    return this.request('POST', '/api/v1/bus/routes', data, undefined, headers);
  }

  async getRouteById(id: string) {
    return this.request('GET', `/api/v1/bus/routes/${id}`);
  }

  async updateRoute(id: string, data: any, headers?: any) {
    return this.request('PATCH', `/api/v1/bus/routes/${id}`, data, undefined, headers);
  }

  async deleteRoute(id: string, headers?: any) {
    return this.request('DELETE', `/api/v1/bus/routes/${id}`, undefined, undefined, headers);
  }

  // --- SCHEDULES ---
  async searchSchedules(source: string, destination: string, date: string) {
    return this.request('GET', '/api/v1/bus/schedules/search', undefined, { source, destination, date });
  }

  async getSchedules(routeId?: string, date?: string, operatorId?: string) {
    return this.request('GET', '/api/v1/bus/schedules', undefined, { route_id: routeId, date, operator_id: operatorId });
  }

  async createSchedule(data: any, headers?: any) {
    return this.request('POST', '/api/v1/bus/schedules', data, undefined, headers);
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

  async getScheduleManifest(id: string) {
    return this.request('GET', `/api/v1/bus/schedules/${id}/manifest`);
  }

  async updateSchedule(id: string, data: any, headers?: any) {
    return this.request('PATCH', `/api/v1/bus/schedules/${id}`, data, undefined, headers);
  }

  async deleteSchedule(id: string, headers?: any) {
    return this.request('DELETE', `/api/v1/bus/schedules/${id}`, undefined, undefined, headers);
  }

  // --- DRIVERS ---
  async getDrivers(operatorId?: string, headers?: any) {
    return this.request('GET', '/api/v1/bus/drivers', undefined, { operator_id: operatorId }, headers);
  }

  async createDriver(data: any, headers?: any) {
    return this.request('POST', '/api/v1/bus/drivers', data, undefined, headers);
  }

  async getDriverById(id: string, headers?: any) {
    return this.request('GET', `/api/v1/bus/drivers/${id}`, undefined, undefined, headers);
  }

  async updateDriver(id: string, data: any, headers?: any) {
    return this.request('PATCH', `/api/v1/bus/drivers/${id}`, data, undefined, headers);
  }

  async deleteDriver(id: string, headers?: any) {
    return this.request('DELETE', `/api/v1/bus/drivers/${id}`, undefined, undefined, headers);
  }
}
