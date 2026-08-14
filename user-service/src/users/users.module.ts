import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { EmergencyContact } from './entities/emergency-contact.entity';
import { MarketingBanner } from './entities/marketing-banner.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, EmergencyContact, MarketingBanner])],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
