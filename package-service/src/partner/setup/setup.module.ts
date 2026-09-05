import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SetupService } from './setup.service';
import { SetupController } from './setup.controller';
import { PackagePartner } from './entities/package_partner.entity';
import { PackagePartnerCategory } from './entities/package_partner-category.entity';
import { PackagePartnerLocation } from './entities/package_partner-location.entity';
import { PackagePartnerDocument } from './entities/package_partner-document.entity';
import { PackagePartnerBank } from './entities/package_partner-bank.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    PackagePartner,
    PackagePartnerCategory,
    PackagePartnerLocation,
    PackagePartnerDocument,
    PackagePartnerBank,
  ])],
  controllers: [SetupController],
  providers: [SetupService],
  exports: [SetupService, TypeOrmModule],
})
export class SetupModule {}
