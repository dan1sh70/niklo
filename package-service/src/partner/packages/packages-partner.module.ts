import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PackagesPartnerService } from './packages-partner.service';
import { PackagesPartnerController } from './packages-partner.controller';
import { PackagePackageTier } from './entities/adventure-package-tier.entity';
import { PackagePackageBenefit } from './entities/adventure-package-benefit.entity';
import { PackagePartner } from '../setup/entities/package_partner.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    PackagePackageTier, PackagePackageBenefit, PackagePartner,
  ])],
  controllers: [PackagesPartnerController],
  providers: [PackagesPartnerService],
  exports: [PackagesPartnerService],
})
export class PackagesPartnerModule {}
