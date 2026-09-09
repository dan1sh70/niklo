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

@WebSocketGateway({ namespace: '/passenger', cors: true })
export class PassengerGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
  @WebSocketServer()
  server: Server;
  private readonly logger = new Logger(PassengerGateway.name);

  constructor(private readonly redisService: RedisService) {}

  async onModuleInit() {
    try {
      await this.redisService.subscribe('driver_locations', (msg) => {
        try {
          const payload = JSON.parse(msg);
          if (payload.rideId) {
            this.server.to(payload.rideId).emit('ride:location_update', payload);
          }
        } catch (err) {
          this.logger.error('Error parsing driver_locations message', err);
        }
      });
      
      await this.redisService.subscribe('ride:status_update', (msg) => {
        try {
          const payload = JSON.parse(msg);
          if (payload.rideId) {
            this.broadcastStatusChange(payload.rideId, { status: payload.status });
          }
        } catch (err) {
          this.logger.error('Error parsing ride:status_update message', err);
        }
      });
      
      this.logger.log('Subscribed to Redis channels successfully.');
    } catch (err) {
      this.logger.error('Failed to subscribe to Redis channels', err);
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
