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
          // Assuming the passenger is subscribed to a room named after the driverId or we map it to rideId.
          // Since we might not know rideId here without querying DB, it's common to have the passenger
          // subscribe to the driver's room `payload.driverId` or have a map.
          // For now, we will broadcast it if the room exists, or we expect the passenger to join driverId room.
          // In a real app, you'd look up the active ride for this driver.
          // To keep it simple per requirements, we'll emit to a room with the driver's ID.
          // The passenger frontend should listen to `driver_locations` or join `payload.driverId`.
          this.server.to(payload.driverId).emit('ride:location_update', payload);
        } catch (err) {
          this.logger.error('Error parsing driver_locations message', err);
        }
      });
      this.logger.log('Subscribed to Redis driver_locations successfully.');
    } catch (err) {
      this.logger.error('Failed to subscribe to Redis driver_locations', err);
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
