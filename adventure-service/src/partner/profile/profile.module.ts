import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { AdventureComplianceDocument } from './entities/adventure-compliance-document.entity';
import { AdventurePartner } from '../setup/entities/adventure-partner.entity';
import { AdventurePartnerLocation } from '../setup/entities/adventure-partner-location.entity';
import { AdventureBankAccount } from '../earnings/entities/adventure-bank-account.entity';
import { AdventureDeviceToken } from '../notifications/entities/adventure-device-token.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    AdventureComplianceDocument, AdventurePartner, AdventurePartnerLocation,
    AdventureBankAccount, AdventureDeviceToken,
  ])],
  controllers: [ProfileController],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}
