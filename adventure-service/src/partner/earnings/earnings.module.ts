import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EarningsService } from './earnings.service';
import { EarningsController } from './earnings.controller';
import { AdventureEarningsWallet } from './entities/adventure-earnings-wallet.entity';
import { AdventureBankAccount } from './entities/adventure-bank-account.entity';
import { AdventureSettlement } from './entities/adventure-settlement.entity';
import { AdventurePartner } from '../setup/entities/adventure-partner.entity';
import { AdventureBooking } from '../bookings/entities/adventure-booking.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    AdventureEarningsWallet, AdventureBankAccount, AdventureSettlement,
    AdventurePartner, AdventureBooking,
  ])],
  controllers: [EarningsController],
  providers: [EarningsService],
  exports: [EarningsService],
})
export class EarningsModule {}
