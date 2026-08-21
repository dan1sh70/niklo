import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { JwtAuthGuard } from '../users/jwt-auth.guard';

@Controller('api/v1/wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  async getWishlist(@Req() req: any) {
    const userId = req.user.id;
    const data = await this.wishlistService.getWishlist(userId);
    return { success: true, statusCode: 200, data };
  }

  @Post('toggle')
  @HttpCode(HttpStatus.OK)
  async toggleWishlist(
    @Req() req: any,
    @Body() body: { item_type: string; item_id: string; raw_data?: any },
  ) {
    const userId = req.user.id;
    const data = await this.wishlistService.toggleWishlist(
      userId,
      body.item_type,
      body.item_id,
      body.raw_data,
    );
    return { success: true, statusCode: 200, data };
  }

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  async syncWishlist(
    @Req() req: any,
    @Body() body: { items: any[] },
  ) {
    const userId = req.user.id;
    const data = await this.wishlistService.syncWishlist(userId, body.items || []);
    return { success: true, statusCode: 200, data };
  }
}
