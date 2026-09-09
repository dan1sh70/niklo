import { Module, forwardRef } from '@nestjs/common';
import { DriverGateway } from './driver.gateway';
import { PassengerGateway } from './passenger.gateway';
import { RidesModule } from '../rides/rides.module';

@Module({
  imports: [forwardRef(() => RidesModule)],
  providers: [DriverGateway, PassengerGateway],
  exports: [DriverGateway, PassengerGateway],
})
export class GatewaysModule {}
