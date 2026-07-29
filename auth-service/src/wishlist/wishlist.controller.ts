import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WishlistService } from './wishlist.service';
import { SyncWishlistDto, WishlistItemDto } from './dto/wishlist-item.dto';

/// Lives on auth-service for the same reason profile does: it is per-user data
/// keyed by a real `users` row, and this is the service that owns those rows.
///
/// JwtStrategy.validate returns `{ userId, phone }` — `req.user.userId`, not
/// `req.user.id`.
@Controller('api/v1/wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  list(@Request() req, @Query('type') type?: string) {
    return this.wishlistService.list(req.user.userId, type);
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  add(@Request() req, @Body() dto: WishlistItemDto) {
    return this.wishlistService.add(req.user.userId, dto);
  }

  /// Declared above the `:type/:itemId` routes so Nest does not match 'toggle'
  /// and 'sync' as a type segment. Nest resolves in declaration order.
  @Post('toggle')
  @HttpCode(HttpStatus.OK)
  toggle(@Request() req, @Body() dto: WishlistItemDto) {
    return this.wishlistService.toggle(req.user.userId, dto);
  }

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  sync(@Request() req, @Body() dto: SyncWishlistDto) {
    return this.wishlistService.sync(req.user.userId, dto);
  }

  @Delete(':type/:itemId')
  @HttpCode(HttpStatus.OK)
  remove(
    @Request() req,
    @Param('type') type: string,
    @Param('itemId') itemId: string,
  ) {
    return this.wishlistService.remove(req.user.userId, type, itemId);
  }
}
