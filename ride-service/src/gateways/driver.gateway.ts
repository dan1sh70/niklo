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
import { RidesService } from '../rides/rides.service';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ namespace: '/driver', cors: true })
export class DriverGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  private readonly logger = new Logger(DriverGateway.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly ridesService: RidesService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Driver connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Driver disconnected: ${client.id}`);
  }

  @SubscribeMessage('driver:go_online')
  async handleGoOnline(
    @MessageBody() data: { driverId: string; lat: number; lng: number },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(data.driverId);
    await this.redisService.setDriverLocation(
      data.driverId,
      data.lat,
      data.lng,
    );
    this.logger.log(
      `Driver ${data.driverId} is online at [${data.lat}, ${data.lng}]`,
    );
  }

  @SubscribeMessage('driver:location')
  async handleLocationUpdate(
    @MessageBody()
    data: {
      driverId: string;
      lat: number;
      lng: number;
      bearing: number;
      speed: number;
    },
  ) {
    await this.redisService.setDriverLocation(
      data.driverId,
      data.lat,
      data.lng,
    );
    // Publish location to redis so passenger gateway or ride-service can broadcast it
    await this.redisService.publish('driver_locations', JSON.stringify(data));
  }

  @SubscribeMessage('ride:accepted')
  async handleRideAccepted(
    @MessageBody() data: { rideId: string; driverId: string },
  ) {
    await this.ridesService.acceptRide(data.rideId, data.driverId);
  }

  @SubscribeMessage('ride:rejected')
  async handleRideRejected(
    @MessageBody() data: { rideId: string; driverId: string },
  ) {
    await this.ridesService.rejectRide(data.rideId, data.driverId);
  }

  @SubscribeMessage('ride:start')
  async handleRideStart(@MessageBody() data: { rideId: string }) {
    await this.ridesService.updateRideStatus(data.rideId, 'IN_PROGRESS');
  }

  @SubscribeMessage('ride:end')
  async handleRideEnd(
    @MessageBody() data: { rideId: string; finalLat: number; finalLng: number },
  ) {
    await this.ridesService.completeRide(
      data.rideId,
      data.finalLat,
      data.finalLng,
    );
  }

  sendNewRequestToDriver(driverId: string, payload: any) {
    this.server.to(driverId).emit('ride:new_request', payload);
  }
}
