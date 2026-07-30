import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

/// PassportModule is imported so JwtAuthGuard resolves here without depending
/// on AuthModule having been loaded first. The 'jwt' strategy itself is
/// registered once, by AuthModule.
@Module({
  imports: [TypeOrmModule.forFeature([User]), PassportModule],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
