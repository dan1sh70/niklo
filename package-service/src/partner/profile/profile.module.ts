import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { PackageComplianceDocument } from './entities/adventure-compliance-document.entity';
import { PackagePartner } from '../setup/entities/package_partner.entity';
import { PackagePartnerLocation } from '../setup/entities/package_partner-location.entity';
import { PackageBankAccount } from '../earnings/entities/adventure-bank-account.entity';
import { PackageDeviceToken } from '../notifications/entities/adventure-device-token.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    PackageComplianceDocument, PackagePartner, PackagePartnerLocation,
    PackageBankAccount, PackageDeviceToken,
  ])],
  controllers: [ProfileController],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}
