import { Module } from '@nestjs/common';
import { DriverGateway } from './driver.gateway';
import { PassengerGateway } from './passenger.gateway';
import { RidesModule } from '../rides/rides.module';

@Module({
  imports: [RidesModule],
  providers: [DriverGateway, PassengerGateway],
})
export class GatewaysModule {}
