import { Injectable, Logger } from '@nestjs/common';

export interface DriverProfile {
  id: string;
  vehicleType: string | null;
  vehicleNumber: string | null;
  status: string | null;
}

const DRIVER_SERVICE_URL =
  process.env.DRIVER_SERVICE_URL || 'http://driver-service:3011';

// Driver records barely change during a ride, and a failed lookup must never
// block a status poll — so results are cached briefly and errors are swallowed.
const CACHE_TTL_MS = 60_000;
const REQUEST_TIMEOUT_MS = 2_000;

// Shared secret for service-to-service writes. driver-service refuses the
// earnings endpoint without it, so an unset value here means trips silently
// stop being credited — hence the warning on first use rather than a quiet 401.
const INTERNAL_API_TOKEN = process.env.INTERNAL_API_TOKEN || '';

/**
 * Read-only view of driver-service, used to put real vehicle details on a ride
 * status response instead of the placeholder string it used to return.
 *
 * Name, phone and photo are deliberately absent: the `drivers` table does not
 * carry them, and user-service (which would) is still a stub. They are added
 * here as `null` so the contract does not change once it is implemented.
 */
@Injectable()
export class DriverDirectoryService {
  private readonly logger = new Logger(DriverDirectoryService.name);
  private readonly cache = new Map<
    string,
    { value: DriverProfile | null; expiresAt: number }
  >();

  async lookup(driverId: string): Promise<DriverProfile | null> {
    if (!driverId) return null;

    const cached = this.cache.get(driverId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    const value = await this.fetchDriver(driverId);
    this.cache.set(driverId, { value, expiresAt: Date.now() + CACHE_TTL_MS });
    return value;
  }

  /**
   * Credits a completed trip to the driver's earnings ledger.
   *
   * Nothing used to write here at all: `driver_earnings` only ever held the
   * rows driver-service seeds itself, so the partner app had no server-side
   * number to show and fell back to a figure kept on the device. The endpoint
   * is idempotent on `rideId`, which matters because a trip is completed twice
   * (socket and REST).
   */
  async recordRideEarning(
    driverId: string,
    rideId: string,
    amount: number,
  ): Promise<void> {
    if (!INTERNAL_API_TOKEN) {
      this.logger.warn(
        `INTERNAL_API_TOKEN is not set — ride ${rideId} will not be credited to driver ${driverId}`,
      );
      return;
    }

    const url = `${DRIVER_SERVICE_URL}/api/v1/driver/earnings/record`;

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-token': INTERNAL_API_TOKEN,
        },
        body: JSON.stringify({ driverId, rideId, amount }),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) {
        this.logger.error(
          `Could not credit ride ${rideId} to driver ${driverId}: driver-service returned ${res.status}`,
        );
        return;
      }

      this.logger.log(
        `Credited ${amount} to driver ${driverId} for ride ${rideId}`,
      );
    } catch (err) {
      this.logger.error(
        `Could not credit ride ${rideId} to driver ${driverId}: ${(err as Error).message}`,
      );
    }
  }

  private async fetchDriver(driverId: string): Promise<DriverProfile | null> {
    const url = `${DRIVER_SERVICE_URL}/api/v1/driver/${encodeURIComponent(driverId)}`;

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);

      if (!res.ok) {
        this.logger.warn(`driver-service returned ${res.status} for ${driverId}`);
        return null;
      }

      const body = await res.json();
      const d = body?.data ?? body;
      if (!d?.id) return null;

      return {
        id: d.id,
        vehicleType: d.vehicle_type ?? null,
        vehicleNumber: d.vehicle_number ?? null,
        status: d.status ?? null,
      };
    } catch (err) {
      this.logger.warn(
        `Could not reach driver-service for ${driverId}: ${(err as Error).message}`,
      );
      return null;
    }
  }
}
