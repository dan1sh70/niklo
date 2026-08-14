import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { EmergencyContact } from './entities/emergency-contact.entity';
import { SavedAddress } from './entities/saved-address.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, EmergencyContact, SavedAddress])],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
