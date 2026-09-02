import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PackagesPartnerService } from './packages-partner.service';
import { PackagesPartnerController } from './packages-partner.controller';
import { AdventurePackageTier } from './entities/adventure-package-tier.entity';
import { AdventurePackageBenefit } from './entities/adventure-package-benefit.entity';
import { AdventurePartner } from '../setup/entities/adventure-partner.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    AdventurePackageTier, AdventurePackageBenefit, AdventurePartner,
  ])],
  controllers: [PackagesPartnerController],
  providers: [PackagesPartnerService],
  exports: [PackagesPartnerService],
})
export class PackagesPartnerModule {}
