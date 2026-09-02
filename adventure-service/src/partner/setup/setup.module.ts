import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SetupService } from './setup.service';
import { SetupController } from './setup.controller';
import { AdventurePartner } from './entities/adventure-partner.entity';
import { AdventurePartnerCategory } from './entities/adventure-partner-category.entity';
import { AdventurePartnerLocation } from './entities/adventure-partner-location.entity';
import { AdventurePartnerDocument } from './entities/adventure-partner-document.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    AdventurePartner,
    AdventurePartnerCategory,
    AdventurePartnerLocation,
    AdventurePartnerDocument,
  ])],
  controllers: [SetupController],
  providers: [SetupService],
  exports: [SetupService, TypeOrmModule],
})
export class SetupModule {}
