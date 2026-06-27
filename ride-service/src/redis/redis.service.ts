import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;
  private subscriber: Redis;

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

  async setDriverLocation(driverId: string, lat: number, lng: number) {
    // Expiry in 30s as per specs: driver:loc:{driverId} 30s
    await this.client.setex(
      `driver:loc:${driverId}`,
      30,
      JSON.stringify({ lat, lng }),
    );
    // Add to Geo set for matching pool
    await this.client.geoadd('drivers:online', lng, lat, driverId);
  }

  async getNearbyDrivers(
    lat: number,
    lng: number,
    radiusKm: number,
  ): Promise<string[]> {
    // returns array of driverIds
    const results = await this.client.geosearch(
      'drivers:online',
      'FROMLONLAT',
      lng,
      lat,
      'BYRADIUS',
      radiusKm,
      'km',
      'ASC',
    );
    return results as string[];
  }

  async publish(channel: string, message: string) {
    await this.client.publish(channel, message);
  }

  async subscribe(channel: string, callback: (message: string) => void) {
    await this.subscriber.subscribe(channel);
    this.subscriber.on('message', (ch, msg) => {
      if (ch === channel) {
        callback(msg);
      }
    });
  }
}
