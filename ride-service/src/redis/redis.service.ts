import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import Redis from 'ioredis';

// Key holding a driver's last known position. Refreshed on every
// `driver:location` ping, and expires on its own — so it doubles as the
// liveness signal for the matching pool.
const DRIVER_LOC_KEY = (driverId: string) => `driver:loc:${driverId}`;

// Geo set used to find candidates by distance. Membership here is NOT proof
// that a driver is still connected — always cross-check against
// DRIVER_LOC_KEY, which does expire.
const ONLINE_GEO_SET = 'drivers:online';

// How long a driver stays matchable without sending a location ping.
const DRIVER_TTL_SECONDS = 60;

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;
  private subscriber: Redis;

  // channel -> handlers. One shared `message` listener fans out from here, so
  // subscribing to N channels does not attach N listeners to the same socket.
  private readonly handlers = new Map<string, ((msg: string) => void)[]>();

  onModuleInit() {
    const host = process.env.REDIS_HOST || 'localhost';
    const port = parseInt(process.env.REDIS_PORT || '6379', 10);
    this.client = new Redis({ host, port });
    this.subscriber = new Redis({ host, port });

    this.client.on('error', (err) =>
      this.logger.error('Redis Client Error', err),
    );
    this.subscriber.on('error', (err) =>
      this.logger.error('Redis Subscriber Error', err),
    );

    this.subscriber.on('message', (channel, message) => {
      for (const handler of this.handlers.get(channel) ?? []) {
        try {
          handler(message);
        } catch (err) {
          this.logger.error(`Handler for "${channel}" threw`, err);
        }
      }
    });
  }

  onModuleDestroy() {
    this.client.disconnect();
    this.subscriber.disconnect();
  }

  getClient(): Redis {
    return this.client;
  }

  getSubscriber(): Redis {
    return this.subscriber;
  }

  // ── Driver presence ───────────────────────────────────────────────────────

  async setDriverLocation(driverId: string, lat: number, lng: number) {
    await this.client.setex(
      DRIVER_LOC_KEY(driverId),
      DRIVER_TTL_SECONDS,
      JSON.stringify({ lat, lng, at: Date.now() }),
    );
    await this.client.geoadd(ONLINE_GEO_SET, lng, lat, driverId);
  }

  /**
   * Drops a driver out of the matching pool immediately.
   *
   * The geo set has no per-member TTL, so without this a driver who went online
   * once stayed matchable forever — rides were dispatched to a socket room
   * nobody was in and hung in REQUESTED. Called on socket disconnect and on
   * explicit go-offline.
   */
  async removeDriver(driverId: string) {
    await Promise.all([
      this.client.zrem(ONLINE_GEO_SET, driverId),
      this.client.del(DRIVER_LOC_KEY(driverId)),
    ]);
    this.logger.log(`Driver ${driverId} removed from the matching pool`);
  }

  async getDriverLocation(
    driverId: string,
  ): Promise<{ lat: number; lng: number } | null> {
    const raw = await this.client.get(DRIVER_LOC_KEY(driverId));
    if (!raw) return null;
    try {
      const { lat, lng } = JSON.parse(raw);
      return { lat, lng };
    } catch {
      return null;
    }
  }

  /**
   * Nearest-first driver ids within `radiusKm`.
   *
   * Candidates whose location key has expired are treated as stale: they are
   * evicted from the geo set and left out of the result. This is the safety net
   * for drivers whose disconnect we never saw — app killed, network drop, or a
   * REST-only `go-online` that never opened a socket.
   */
  async getNearbyDrivers(
    lat: number,
    lng: number,
    radiusKm: number,
  ): Promise<string[]> {
    const candidates = (await this.client.geosearch(
      ONLINE_GEO_SET,
      'FROMLONLAT',
      lng,
      lat,
      'BYRADIUS',
      radiusKm,
      'km',
      'ASC',
    )) as string[];

    if (candidates.length === 0) return [];

    const liveness = await this.client.mget(
      ...candidates.map((id) => DRIVER_LOC_KEY(id)),
    );

    const live: string[] = [];
    const stale: string[] = [];
    candidates.forEach((driverId, i) =>
      (liveness[i] ? live : stale).push(driverId),
    );

    if (stale.length > 0) {
      await this.client.zrem(ONLINE_GEO_SET, ...stale);
      this.logger.warn(
        `Evicted ${stale.length} stale driver(s): ${stale.join(', ')}`,
      );
    }

    return live;
  }

  // ── Pub/Sub ───────────────────────────────────────────────────────────────

  async publish(channel: string, message: string) {
    await this.client.publish(channel, message);
  }

  async subscribe(channel: string, callback: (message: string) => void) {
    const existing = this.handlers.get(channel);
    if (existing) {
      existing.push(callback);
      return;
    }
    this.handlers.set(channel, [callback]);
    await this.subscriber.subscribe(channel);
  }
}
