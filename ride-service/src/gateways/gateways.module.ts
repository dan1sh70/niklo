import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriverGateway } from './driver.gateway';
import { PassengerGateway } from './passenger.gateway';
import { RidesModule } from '../rides/rides.module';
import { Ride } from '../rides/entities/ride.entity';

@Module({
  // PassengerGateway reads active rides directly to route driver GPS pings to
  // the right passenger room after a restart.
  imports: [RidesModule, TypeOrmModule.forFeature([Ride])],
  providers: [DriverGateway, PassengerGateway],
})
export class GatewaysModule {}
