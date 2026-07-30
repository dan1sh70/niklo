import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { io, Socket } from 'socket.io-client';

import { RidesService } from '../src/rides/rides.service';
import { RidesController } from '../src/rides/rides.controller';
import { DriverDirectoryService } from '../src/rides/driver-directory.service';
import { RedisService } from '../src/redis/redis.service';
import { DriverGateway } from '../src/gateways/driver.gateway';
import { PassengerGateway } from '../src/gateways/passenger.gateway';
import { Ride, RideStatus, RideType } from '../src/rides/entities/ride.entity';
import { JwtAuthGuard } from '../src/rides/jwt-auth.guard';

import { FakeRedisClient, FakeRideRepository } from './fakes';

// Bengaluru.
const PICKUP = { lat: 12.9716, lng: 77.5946 };
const NEAR_DRIVER = { lat: 12.9352, lng: 77.6245 }; // ~5km — inside the first ring
const MID_DRIVER = { lat: 13.0416, lng: 77.5946 }; // ~8km — second ring only
const FAR_DRIVER = { lat: 13.1400, lng: 77.5946 }; // ~19km — beyond every ring

const PASSENGER_ID = 'p1111111-1111-1111-1111-111111111111';

jest.setTimeout(60_000);

describe('Ride flow smoke test', () => {
  let app: INestApplication;
  let url: string;
  let redis: FakeRedisClient;
  let repo: FakeRideRepository;
  let rides: RidesService;
  const sockets: Socket[] = [];

  beforeAll(async () => {
    redis = new FakeRedisClient();
    repo = new FakeRideRepository();

    const moduleRef = await Test.createTestingModule({
      controllers: [RidesController],
      providers: [
        RedisService,
        RidesService,
        DriverGateway,
        PassengerGateway,
        DriverDirectoryService,
        { provide: getRepositoryToken(Ride), useValue: repo },
      ],
    })
      // Every ride route sits behind this guard. Let requests through, but
      // still attach a user the way the real guard does — routes that read
      // req.user (my-rides) are otherwise exercised against a request shape
      // that never occurs in production.
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (ctx: any) => {
          ctx.switchToHttp().getRequest().user = { id: PASSENGER_ID };
          return true;
        },
      })
      .compile();

    app = moduleRef.createNestApplication();

    // Wire the in-memory double now, and neutralise onModuleInit so app.init()
    // does not replace it with a real ioredis pointed at localhost.
    //
    // Doing both matters: Nest fires onModuleInit in provider-registration
    // order, not dependency order, so the gateways can subscribe before
    // RedisService's own hook would have run.
    const redisService = app.get(RedisService);
    (redisService as any).client = redis;
    (redisService as any).subscriber = redis;
    (redisService as any).handlers = new Map();
    (redisService as any).onModuleInit = () => {};
    redis.on('message', (channel: string, message: string) => {
      for (const h of (redisService as any).handlers.get(channel) ?? []) {
        h(message);
      }
    });

    // driver-service is not running here — return a Sedan so the vehicle-type
    // gate is genuinely exercised rather than short-circuited.
    jest
      .spyOn(app.get(DriverDirectoryService), 'lookup')
      .mockResolvedValue({
        id: 'driver',
        vehicleType: 'SEDAN',
        vehicleNumber: 'KA-01-MJ-1234',
        status: 'approved',
      });

    await app.init();
    await app.listen(0);
    const port = (app.getHttpServer().address() as any).port;
    url = `http://127.0.0.1:${port}`;

    rides = app.get(RidesService);
  });

  // Each case must start from an empty pool. Without this a driver connected by
  // an earlier test stays nearest, wins the offer, never answers, and the case
  // under test only sees it 20s later — which is exactly the failure mode the
  // dispatch loop is supposed to survive, but not what these assertions target.
  afterEach(async () => {
    for (const s of sockets) s.disconnect();
    sockets.length = 0;
    await waitFor(() => redis.geoMembers('drivers:online').length === 0).catch(
      async () => {
        for (const m of redis.geoMembers('drivers:online')) {
          await redis.zrem('drivers:online', m);
        }
      },
    );
    repo.rows.clear();
  });

  afterAll(async () => {
    for (const s of sockets) s.disconnect();
    await app?.close();
  });

  /** Connects a driver socket and waits for it to be registered online. */
  async function connectDriver(driverId: string, at: typeof PICKUP) {
    const socket = io(`${url}/driver`, { transports: ['websocket'] });
    sockets.push(socket);

    await new Promise<void>((resolve, reject) => {
      socket.on('connect', () => resolve());
      socket.on('connect_error', reject);
    });

    socket.emit('driver:go_online', { driverId, lat: at.lat, lng: at.lng });
    await waitFor(() => redis.geoMembers('drivers:online').includes(driverId));
    return socket;
  }

  it('1. quotes a fare from real distance, not a constant', async () => {
    const short = await rides.estimateRide({
      pickup: PICKUP,
      drop: NEAR_DRIVER,
      rideType: 'SEDAN',
    });
    const long = await rides.estimateRide({
      pickup: { lat: 28.6139, lng: 77.209 }, // Delhi
      drop: { lat: 19.076, lng: 72.8777 }, // Mumbai
      rideType: 'SEDAN',
    });

    expect(short.distanceKm).toBeGreaterThan(3);
    expect(short.distanceKm).toBeLessThan(12);
    expect(long.distanceKm).toBeGreaterThan(1000);
    expect(long.fareEstimate).toBeGreaterThan(short.fareEstimate * 50);
  });

  it('2. rejects an estimate with no coordinates instead of inventing one', async () => {
    await expect(rides.estimateRide({})).rejects.toThrow();
  });

  it('3. delivers the request to an online driver and records the accept', async () => {
    const driverId = 'drv-online-1';
    const socket = await connectDriver(driverId, NEAR_DRIVER);

    const offered = new Promise<any>((resolve) =>
      socket.once('ride:new_request', resolve),
    );

    const res = await rides.requestRide(PASSENGER_ID, {
      pickup: PICKUP,
      dropoff: NEAR_DRIVER,
      vehicleType: 'SEDAN',
      pickupAddress: 'MG Road',
      dropAddress: 'Koramangala',
    });
    expect(res.status).toBe('SEARCHING');

    const payload = await offered;
    expect(payload.rideId).toBe(res.rideId);

    socket.emit('ride:accepted', { rideId: res.rideId, driverId });

    await waitFor(async () => {
      const ride = await repo.findOne({ where: { id: res.rideId } });
      return ride?.status === RideStatus.ACCEPTED;
    });

    const ride = await repo.findOne({ where: { id: res.rideId } });
    expect(ride.driver_id).toBe(driverId);
    // Fare came from the distance calculation, not the old ₹250 constant.
    expect(Number(ride.fare_estimate)).toBeGreaterThan(0);
    expect(Number(ride.fare_estimate)).not.toBe(250);
  });

  it('4. a disconnected driver is dropped from the matching pool', async () => {
    const driverId = 'drv-ghost';
    const socket = await connectDriver(driverId, NEAR_DRIVER);

    expect(redis.geoMembers('drivers:online')).toContain(driverId);

    socket.disconnect();

    await waitFor(
      () => !redis.geoMembers('drivers:online').includes(driverId),
    );
    expect(redis.geoMembers('drivers:online')).not.toContain(driverId);
  });

  it('5. a stale driver never receives an offer and the ride is cancelled', async () => {
    const driverId = 'drv-stale';

    // Simulate the old bug directly: present in the geo set, but the location
    // key has expired — i.e. a driver whose disconnect we never saw.
    await redis.geoadd(
      'drivers:online',
      NEAR_DRIVER.lng,
      NEAR_DRIVER.lat,
      driverId,
    );
    expect(redis.geoMembers('drivers:online')).toContain(driverId);

    const res = await rides.requestRide(PASSENGER_ID, {
      pickup: PICKUP,
      dropoff: NEAR_DRIVER,
      vehicleType: 'SEDAN',
      pickupAddress: 'MG Road',
      dropAddress: 'Koramangala',
    });

    // Previously this hung in REQUESTED forever. Now the stale entry is
    // evicted and dispatch falls through to "no drivers".
    await waitFor(async () => {
      const ride = await repo.findOne({ where: { id: res.rideId } });
      return ride?.status === RideStatus.CANCELLED;
    }, 15_000);

    expect(redis.geoMembers('drivers:online')).not.toContain(driverId);
  });

  it('6. a rejection moves the offer straight on to the next driver', async () => {
    const first = 'drv-decliner';
    const second = 'drv-taker';

    // Decliner is nearer, so it is offered the ride first. The taker sits in
    // the second ring — reachable, but only once the first is exhausted.
    const s1 = await connectDriver(first, NEAR_DRIVER);
    const s2 = await connectDriver(second, MID_DRIVER);

    const s2Offered = new Promise<any>((resolve) =>
      s2.once('ride:new_request', resolve),
    );

    s1.once('ride:new_request', (p: any) => {
      s1.emit('ride:rejected', { rideId: p.rideId, driverId: first });
    });

    const started = Date.now();
    const res = await rides.requestRide(PASSENGER_ID, {
      pickup: PICKUP,
      dropoff: NEAR_DRIVER,
      vehicleType: 'SEDAN',
      pickupAddress: 'MG Road',
      dropAddress: 'Koramangala',
    });

    const payload = await s2Offered;
    const elapsed = Date.now() - started;

    expect(payload.rideId).toBe(res.rideId);
    // The old code stopped after one driver. The new code must also not sit
    // out the full 20s offer timeout when a rejection arrives.
    expect(elapsed).toBeLessThan(10_000);

    s2.emit('ride:accepted', { rideId: res.rideId, driverId: second });
    await waitFor(async () => {
      const ride = await repo.findOne({ where: { id: res.rideId } });
      return ride?.status === RideStatus.ACCEPTED;
    });

    const ride = await repo.findOne({ where: { id: res.rideId } });
    expect(ride.driver_id).toBe(second);
  });

  it('7. a second accept on a taken ride is refused', async () => {
    const a = 'drv-a';
    const b = 'drv-b';
    const sa = await connectDriver(a, NEAR_DRIVER);

    const offered = new Promise<any>((resolve) =>
      sa.once('ride:new_request', resolve),
    );
    const res = await rides.requestRide(PASSENGER_ID, {
      pickup: PICKUP,
      dropoff: NEAR_DRIVER,
      vehicleType: 'SEDAN',
      pickupAddress: 'MG Road',
      dropAddress: 'Koramangala',
    });
    await offered;

    const firstAccept = await rides.acceptRide(res.rideId, a);
    const secondAccept = await rides.acceptRide(res.rideId, b);

    expect(firstAccept.accepted).toBe(true);
    expect(secondAccept.accepted).toBe(false);
    expect(secondAccept.reason).toBe('ALREADY_TAKEN');

    const ride = await repo.findOne({ where: { id: res.rideId } });
    expect(ride.driver_id).toBe(a);
  });

  it('8. status carries real vehicle details, not the "Driver Info" placeholder', async () => {
    const driverId = 'drv-details';
    const socket = await connectDriver(driverId, NEAR_DRIVER);

    const offered = new Promise<any>((resolve) =>
      socket.once('ride:new_request', resolve),
    );
    const res = await rides.requestRide(PASSENGER_ID, {
      pickup: PICKUP,
      dropoff: NEAR_DRIVER,
      vehicleType: 'SEDAN',
      pickupAddress: 'MG Road',
      dropAddress: 'Koramangala',
    });
    await offered;
    await rides.acceptRide(res.rideId, driverId);

    const status = await rides.getRideStatus(res.rideId);

    expect(status.status).toBe(RideStatus.ACCEPTED);
    expect(status.driverDetails).toBeTruthy();
    expect(status.driverDetails!.name).not.toBe('Driver Info');
    expect(status.driverDetails!.vehicleNumber).toBe('KA-01-MJ-1234');
    expect(status.driverDetails!.currentLocation).toEqual({
      lat: NEAR_DRIVER.lat,
      lng: NEAR_DRIVER.lng,
    });
  });

  it('9. completing the ride re-quotes the final fare from where it ended', async () => {
    const driverId = 'drv-complete';
    const socket = await connectDriver(driverId, NEAR_DRIVER);

    const offered = new Promise<any>((resolve) =>
      socket.once('ride:new_request', resolve),
    );
    const res = await rides.requestRide(PASSENGER_ID, {
      pickup: PICKUP,
      dropoff: NEAR_DRIVER,
      vehicleType: 'SEDAN',
      pickupAddress: 'MG Road',
      dropAddress: 'Koramangala',
    });
    await offered;
    await rides.acceptRide(res.rideId, driverId);

    const booked = await repo.findOne({ where: { id: res.rideId } });

    // Driver actually ended much further out than the booked drop.
    await rides.completeRide(res.rideId, FAR_DRIVER.lat, FAR_DRIVER.lng);

    const done = await repo.findOne({ where: { id: res.rideId } });
    expect(done.status).toBe(RideStatus.COMPLETED);
    expect(Number(done.fare_final)).toBeGreaterThan(
      Number(booked.fare_estimate),
    );
  });

  it('10. passengers are notified over the socket, not only by polling', async () => {
    const driverId = 'drv-broadcast';
    const driverSocket = await connectDriver(driverId, NEAR_DRIVER);

    const offered = new Promise<any>((resolve) =>
      driverSocket.once('ride:new_request', resolve),
    );
    const res = await rides.requestRide(PASSENGER_ID, {
      pickup: PICKUP,
      dropoff: NEAR_DRIVER,
      vehicleType: 'SEDAN',
      pickupAddress: 'MG Road',
      dropAddress: 'Koramangala',
    });
    await offered;

    const passenger = io(`${url}/passenger`, { transports: ['websocket'] });
    sockets.push(passenger);
    await new Promise<void>((resolve) => passenger.on('connect', () => resolve()));
    passenger.emit('join:ride', { rideId: res.rideId });
    await new Promise((r) => setTimeout(r, 200));

    const assigned = new Promise<any>((resolve) =>
      passenger.once('ride:driver_assigned', resolve),
    );

    await rides.acceptRide(res.rideId, driverId);

    const payload = await assigned;
    expect(payload.rideId).toBe(res.rideId);
    expect(payload.driverId).toBe(driverId);
  });

  // The history routes are declared above `@Get(':id')`. Exercised over HTTP
  // rather than through the service, because the bug they guard against is a
  // routing one: declared after `:id`, `/ride/my-rides` is read as a ride whose
  // id is "my-rides" and never reaches the handler at all.
  describe('history', () => {
    /** Two rides for one driver, one for another, plus a second passenger. */
    async function seedHistory() {
      const older = await repo.save({
        passenger_id: PASSENGER_ID,
        driver_id: 'drv-history',
        ride_type: RideType.SEDAN,
        pickup_address: 'MG Road',
        drop_address: 'Koramangala',
        status: RideStatus.COMPLETED,
        distance_km: '4.20',
        fare_final: '180.50',
        created_at: new Date('2026-07-01T10:00:00Z'),
      });
      const newer = await repo.save({
        passenger_id: PASSENGER_ID,
        driver_id: 'drv-history',
        ride_type: RideType.SEDAN,
        pickup_address: 'Indiranagar',
        drop_address: 'Whitefield',
        status: RideStatus.CANCELLED,
        created_at: new Date('2026-07-20T10:00:00Z'),
      });
      const other = await repo.save({
        passenger_id: 'p2222222-2222-2222-2222-222222222222',
        driver_id: 'drv-someone-else',
        ride_type: RideType.MINI,
        pickup_address: 'Jayanagar',
        drop_address: 'HSR',
        status: RideStatus.COMPLETED,
        created_at: new Date('2026-07-25T10:00:00Z'),
      });
      return { older, newer, other };
    }

    it('11. returns a driver\'s own trips, newest first', async () => {
      const { older, newer } = await seedHistory();

      const res = await fetch(`${url}/api/v1/ride/driver/drv-history/trips`);
      expect(res.status).toBe(200);

      const trips = await res.json();
      expect(trips.map((t: any) => t.id)).toEqual([newer.id, older.id]);
      // Another driver's ride must not leak into this list.
      expect(trips).toHaveLength(2);
    });

    it('12. sends history fields as the apps index them', async () => {
      await seedHistory();

      const trips = await (
        await fetch(`${url}/api/v1/ride/driver/drv-history/trips`)
      ).json();
      const completed = trips.find((t: any) => t.status === 'COMPLETED');

      expect(completed.pickup_address).toBe('MG Road');
      expect(completed.drop_address).toBe('Koramangala');
      expect(completed.created_at).toBeTruthy();
      // Postgres returns numeric as a string; the clients parse numbers.
      expect(completed.fare_final).toBe(180.5);
      expect(completed.distance_km).toBe(4.2);
    });

    it('13. my-rides resolves as a route, not as a ride id', async () => {
      const { older, newer, other } = await seedHistory();

      const res = await fetch(`${url}/api/v1/ride/my-rides`);
      expect(res.status).toBe(200);

      const mine = await res.json();
      // Only this passenger's rides, newest first.
      expect(mine.map((r: any) => r.id)).toEqual([newer.id, older.id]);
      expect(mine.map((r: any) => r.id)).not.toContain(other.id);
    });

    it('14. caps how many rides a single call can return', async () => {
      for (let i = 0; i < 5; i++) {
        await repo.save({
          passenger_id: PASSENGER_ID,
          driver_id: 'drv-bulk',
          ride_type: RideType.SEDAN,
          pickup_address: `Stop ${i}`,
          status: RideStatus.COMPLETED,
          created_at: new Date(2026, 6, i + 1),
        });
      }

      const trips = await (
        await fetch(`${url}/api/v1/ride/driver/drv-bulk/trips?limit=2`)
      ).json();
      expect(trips).toHaveLength(2);
      // Newest two, not the first two inserted.
      expect(trips[0].pickup_address).toBe('Stop 4');
    });
  });
});

async function waitFor(
  predicate: () => boolean | Promise<boolean>,
  timeoutMs = 8_000,
) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await predicate()) return;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error(`Condition not met within ${timeoutMs}ms`);
}
