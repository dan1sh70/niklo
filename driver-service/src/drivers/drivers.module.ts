import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriversService } from './drivers.service';
import { DriversController } from './drivers.controller';
import { Driver } from './entities/driver.entity';
import { DriverKyc } from './entities/driver-kyc.entity';
import { DriverEarning } from './entities/driver-earning.entity';
import { DriverPayout } from './entities/driver-payout.entity';
import { DriverBankDetail } from './entities/driver-bank-detail.entity';
import { DriverSession } from './entities/driver-session.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Driver, DriverKyc, DriverEarning, DriverPayout, DriverBankDetail, DriverSession]),
  ],
  controllers: [DriversController],
  providers: [DriversService],
})
export class DriversModule {}
