import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WishlistItem } from './entities/wishlist-item.entity';
import { WishlistController } from './wishlist.controller';
import { WishlistService } from './wishlist.service';

/// PassportModule is imported here so JwtAuthGuard resolves without depending
/// on AuthModule having loaded first — same arrangement as ProfileModule. The
/// 'jwt' strategy itself is still registered once, by AuthModule.
@Module({
  imports: [TypeOrmModule.forFeature([WishlistItem]), PassportModule],
  controllers: [WishlistController],
  providers: [WishlistService],
})
export class WishlistModule {}
