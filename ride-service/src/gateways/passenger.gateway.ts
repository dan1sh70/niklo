import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RedisService } from '../redis/redis.service';
import { Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ride, RideStatus } from '../rides/entities/ride.entity';

@WebSocketGateway({ namespace: '/passenger', cors: true })
export class PassengerGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
  @WebSocketServer()
  server: Server;
  private readonly logger = new Logger(PassengerGateway.name);

  // driverId -> ride ids that driver is currently serving, so a GPS ping can be
  // routed to the right passenger room without hitting the DB on every update.
  private readonly driverToRides = new Map<string, Set<string>>();

  constructor(
    private readonly redisService: RedisService,
    @InjectRepository(Ride)
    private readonly rideRepository: Repository<Ride>,
  ) {}

  /**
   * Wires the broadcast helpers below to the Redis channels ride-service
   * already publishes on.
   *
   * Without this the gateway had no subscribers at all — every `broadcast*`
   * method was unreachable, and a passenger could only learn about a status
   * change by polling.
   */
  async onModuleInit() {
    try {
      await this.redisService.subscribe('ride:status_update', (msg) =>
        void this.onStatusUpdate(msg),
      );
      await this.redisService.subscribe('driver_locations', (msg) =>
        void this.onDriverLocation(msg),
      );
      this.logger.log('Subscribed to ride:status_update and driver_locations');
    } catch (err) {
      this.logger.error('Failed to subscribe to Redis channels', err);
    }
  }

  private async onStatusUpdate(msg: string) {
    try {
      const payload = JSON.parse(msg);
      const { rideId, status, driverId } = payload;
      if (!rideId) return;

      this.broadcastStatusChange(rideId, payload);

      if (status === RideStatus.ACCEPTED && driverId) {
        this.trackDriver(driverId, rideId);
        this.broadcastDriverAssigned(rideId, payload);
      }

      if (status === RideStatus.COMPLETED || status === RideStatus.CANCELLED) {
        this.untrackRide(rideId);
      }
    } catch (err) {
      this.logger.error('Bad ride:status_update payload', err);
    }
  }

  private async onDriverLocation(msg: string) {
    try {
      const { driverId, lat, lng, bearing, speed } = JSON.parse(msg);
      if (!driverId) return;

      let rideIds = this.driverToRides.get(driverId);

      // On a cold start the in-memory map is empty, so fall back to the DB once
      // and cache what we find.
      if (!rideIds || rideIds.size === 0) {
        const active = await this.rideRepository.find({
          where: [
            { driver_id: driverId, status: RideStatus.ACCEPTED },
            { driver_id: driverId, status: RideStatus.ARRIVED },
            { driver_id: driverId, status: RideStatus.IN_PROGRESS },
          ],
        });
        if (active.length === 0) return;
        rideIds = new Set(active.map((r) => r.id));
        this.driverToRides.set(driverId, rideIds);
      }

      for (const rideId of rideIds) {
        this.broadcastLocationUpdate(rideId, { lat, lng, bearing, speed });
      }
    } catch (err) {
      this.logger.error('Bad driver_locations payload', err);
    }
  }

  private trackDriver(driverId: string, rideId: string) {
    const set = this.driverToRides.get(driverId) ?? new Set<string>();
    set.add(rideId);
    this.driverToRides.set(driverId, set);
  }

  private untrackRide(rideId: string) {
    for (const [driverId, rides] of this.driverToRides) {
      if (rides.delete(rideId) && rides.size === 0) {
        this.driverToRides.delete(driverId);
      }
    }
  }

  handleConnection(client: Socket) {
    this.logger.log(`Passenger connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Passenger disconnected: ${client.id}`);
  }

  @SubscribeMessage('join:ride')
  handleJoinRide(
    @MessageBody() data: { rideId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(data.rideId);
    this.logger.log(`Client ${client.id} joined ride room: ${data.rideId}`);
  }

  @SubscribeMessage('leave:ride')
  handleLeaveRide(
    @MessageBody() data: { rideId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(data.rideId);
  }

  broadcastDriverAssigned(rideId: string, payload: any) {
    this.server.to(rideId).emit('ride:driver_assigned', payload);
  }

  broadcastLocationUpdate(rideId: string, payload: any) {
    this.server.to(rideId).emit('ride:location_update', payload);
  }

  broadcastStatusChange(rideId: string, payload: { status: string }) {
    this.server.to(rideId).emit('ride:status_change', payload);
  }
}
