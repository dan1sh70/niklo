import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SavedAddress } from './entities/saved-address.entity';
import { AddressesController } from './addresses.controller';
import { AddressesService } from './addresses.service';

/// PassportModule is imported so JwtAuthGuard resolves here without depending
/// on AuthModule having loaded first — same arrangement as ProfileModule and
/// WishlistModule. The 'jwt' strategy is still registered once, by AuthModule.
@Module({
  imports: [TypeOrmModule.forFeature([SavedAddress]), PassportModule],
  controllers: [AddressesController],
  providers: [AddressesService],
})
export class AddressesModule {}
