import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EarningsService } from './earnings.service';
import { EarningsController } from './earnings.controller';
import { PackageEarningsWallet } from './entities/adventure-earnings-wallet.entity';
import { PackageBankAccount } from './entities/adventure-bank-account.entity';
import { PackageSettlement } from './entities/adventure-settlement.entity';
import { PackagePartner } from '../setup/entities/package_partner.entity';
import { PackageBooking } from '../bookings/entities/adventure-booking.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    PackageEarningsWallet, PackageBankAccount, PackageSettlement,
    PackagePartner, PackageBooking,
  ])],
  controllers: [EarningsController],
  providers: [EarningsService],
  exports: [EarningsService],
})
export class EarningsModule {}
