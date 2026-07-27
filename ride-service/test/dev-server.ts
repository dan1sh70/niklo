/**
 * Local ride-service for end-to-end testing without deploying.
 *
 * Boots the real controller, service and both gateways — the same code that
 * ships — but swaps Postgres and Redis for the in-memory doubles in `fakes.ts`.
 * That makes the whole ride path testable from the two Flutter apps on a
 * machine with no Docker, no database and no Redis.
 *
 *   npm run dev:local
 *
 * Caveats, in order of how likely they are to bite:
 *   - Nothing is persisted. Restarting the server loses every ride and every
 *     online driver.
 *   - The geo search uses haversine; real Redis uses geohash. Distances agree
 *     to within a few metres at city scale, which is well inside the ring
 *     boundaries this code cares about.
 *   - driver-service is not reachable, so vehicle details come back null and
 *     the vehicle-type filter lets every driver through. Point
 *     DRIVER_SERVICE_URL at a running instance to exercise that path.
 */
import { NestFactory } from '@nestjs/core';
import { Module, Logger } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as os from 'os';

import { RidesService } from '../src/rides/rides.service';
import { RidesController } from '../src/rides/rides.controller';
import { DriverDirectoryService } from '../src/rides/driver-directory.service';
import { RedisService } from '../src/redis/redis.service';
import { DriverGateway } from '../src/gateways/driver.gateway';
import { PassengerGateway } from '../src/gateways/passenger.gateway';
import { Ride } from '../src/rides/entities/ride.entity';
import { JwtAuthGuard } from '../src/rides/jwt-auth.guard';

import { FakeRedisClient, FakeRideRepository } from './fakes';

const PORT = Number(process.env.PORT || 3005);

const redis = new FakeRedisClient();
const repo = new FakeRideRepository();

// The real guard needs a signed token. Locally we accept anything and read the
// passenger id straight off the Authorization header if one is present.
class PermissiveGuard {
  canActivate(context: any): boolean {
    const req = context.switchToHttp().getRequest();
    req.user = { id: req.headers['x-passenger-id'] || 'local-passenger' };
    return true;
  }
}

@Module({
  controllers: [RidesController],
  providers: [
    RedisService,
    RidesService,
    DriverGateway,
    PassengerGateway,
    DriverDirectoryService,
    { provide: getRepositoryToken(Ride), useValue: repo },
    { provide: JwtAuthGuard, useClass: PermissiveGuard },
  ],
})
class LocalRideModule {}

async function bootstrap() {
  const logger = new Logger('DevServer');
  const app = await NestFactory.create(LocalRideModule, { cors: true });

  // Same trick as the smoke test: install the double and disable the real
  // lifecycle hook, because Nest fires onModuleInit in provider-registration
  // order and the gateways subscribe before RedisService would have connected.
  const redisService = app.get(RedisService);
  (redisService as any).client = redis;
  (redisService as any).subscriber = redis;
  (redisService as any).handlers = new Map();
  (redisService as any).onModuleInit = () => {};
  redis.on('message', (channel: string, message: string) => {
    for (const h of (redisService as any).handlers.get(channel) ?? []) h(message);
  });

  await app.listen(PORT, '0.0.0.0');

  const lan = Object.values(os.networkInterfaces())
    .flat()
    .filter((i): i is os.NetworkInterfaceInfo => !!i)
    .find((i) => i.family === 'IPv4' && !i.internal)?.address;

  logger.log(`ride-service (local, in-memory) listening on 0.0.0.0:${PORT}`);
  logger.log(`  this machine : http://localhost:${PORT}`);
  if (lan) logger.log(`  LAN / device : http://${lan}:${PORT}`);
  logger.log(`  Android emu  : http://10.0.2.2:${PORT}`);
  logger.log('');
  logger.log('Point RIDE_BASE_URL (customer app) and RIDE_SERVICE_URL');
  logger.log('(partner app) at one of the above, then restart both apps.');

  // A heartbeat makes it obvious whether drivers are actually registering.
  setInterval(() => {
    const online = redis.geoMembers('drivers:online');
    logger.log(
      `online drivers: ${online.length ? online.join(', ') : '(none)'} | rides: ${repo.rows.size}`,
    );
  }, 15_000);
}

void bootstrap();
