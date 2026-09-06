import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EarningsService } from './earnings.service';
import { EarningsController } from './earnings.controller';
import { PackagePartnerBank } from '../setup/entities/package_partner-bank.entity';
import { PackageSettlement } from './entities/package-settlement.entity';
import { PackageSettlementItem } from './entities/package-settlement-item.entity';
import { PackageWithdrawalRequest } from './entities/package-withdrawal-request.entity';
import { PackageBooking } from '../bookings/entities/package-booking.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PackagePartnerBank,
      PackageSettlement,
      PackageSettlementItem,
      PackageWithdrawalRequest,
      PackageBooking,
    ]),
  ],
  controllers: [EarningsController],
  providers: [EarningsService],
  exports: [EarningsService],
})
export class EarningsModule {}
