import {
  Injectable,
  Logger,
  ConflictException,
  ServiceUnavailableException,
  HttpException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SeatAssignment {
  seat_number: string;
  gender?: string;
}

/**
 * Thin HTTP client for bus-service, which owns seat inventory.
 *
 * booking-service and bus-service run against separate databases, so seat
 * availability cannot be touched in the same transaction as the booking row.
 * The compensating pattern used by [BookingsService] is: write the booking,
 * claim the seats here, and roll the booking back if the claim fails.
 */
@Injectable()
export class BusServiceClient {
  private readonly logger = new Logger(BusServiceClient.name);
  private readonly baseUrl: string;
  private readonly internalKey?: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = (
      this.configService.get<string>('BUS_SERVICE_URL') ||
      'http://bus-service:3003'
    ).replace(/\/+$/, '');
    // Lets seat writes go through when there is no user token to forward —
    // notably the sweep that frees seats from abandoned checkouts.
    this.internalKey = this.configService.get<string>('INTERNAL_API_KEY');
  }

  async bookSeats(
    scheduleId: string,
    payload: {
      seats: SeatAssignment[];
      booking_id: string;
      user_id: string;
    },
    authHeader?: string,
  ) {
    return this.post(
      `/api/v1/bus/schedules/${scheduleId}/seats/book`,
      payload,
      authHeader,
    );
  }

  async releaseSeats(
    scheduleId: string,
    payload: { seat_numbers: string[]; booking_id?: string },
    authHeader?: string,
  ) {
    return this.post(
      `/api/v1/bus/schedules/${scheduleId}/seats/release`,
      payload,
      authHeader,
    );
  }

  async getSchedule(scheduleId: string): Promise<any> {
    return this.get(`/api/v1/bus/schedules/${scheduleId}`);
  }

  /** Asks bus-service whether the bearer of [authHeader] owns [operatorId]. */
  async ownsOperator(operatorId: string, authHeader: string): Promise<boolean> {
    try {
      const result = await this.get(
        `/api/v1/bus/operators/${operatorId}/ownership`,
        authHeader,
      );
      return result?.owned === true;
    } catch (error) {
      this.logger.warn(
        `Ownership check failed for operator ${operatorId}: ${String(error)}`,
      );
      return false;
    }
  }

  private async get(path: string, authHeader?: string) {
    return this.request('GET', path, undefined, authHeader);
  }

  private async post(path: string, body: unknown, authHeader?: string) {
    return this.request('POST', path, body, authHeader);
  }

  private async request(
    method: 'GET' | 'POST',
    path: string,
    body?: unknown,
    authHeader?: string,
  ) {
    const url = `${this.baseUrl}${path}`;
    let response: Response;

    try {
      response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { Authorization: authHeader } : {}),
          ...(this.internalKey ? { 'x-internal-key': this.internalKey } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(10_000),
      });
    } catch (error: any) {
      this.logger.error(`${method} ${url} failed: ${error?.message}`);
      throw new ServiceUnavailableException(
        'Bus service is unreachable, please try again',
      );
    }

    const text = await response.text();
    const payload = text ? safeJsonParse(text) : null;

    if (!response.ok) {
      // Seat conflicts carry the offending seat numbers — pass them through so
      // the app can grey those seats out instead of showing a generic error.
      if (response.status === 409) {
        throw new ConflictException(
          payload ?? { message: 'Seats are no longer available' },
        );
      }
      throw new HttpException(
        payload ?? { message: `Bus service error (${response.status})` },
        response.status,
      );
    }

    return payload;
  }
}

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}
