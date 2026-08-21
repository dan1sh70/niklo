import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserWishlist } from './entities/wishlist.entity';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(UserWishlist)
    private readonly wishlistRepo: Repository<UserWishlist>,
  ) {}

  async getWishlist(userId: string) {
    try {
      const items = await this.wishlistRepo.find({
        where: { user_id: userId },
        order: { created_at: 'DESC' },
      });
      return items;
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch wishlist');
    }
  }

  async toggleWishlist(userId: string, itemType: string, itemId: string, rawData: any) {
    try {
      const existing = await this.wishlistRepo.findOne({
        where: { user_id: userId, item_type: itemType, item_id: itemId },
      });

      if (existing) {
        await this.wishlistRepo.remove(existing);
        return { action: 'removed', item_id: itemId };
      } else {
        const newItem = this.wishlistRepo.create({
          user_id: userId,
          item_type: itemType,
          item_id: itemId,
          raw_data: rawData,
        });
        await this.wishlistRepo.save(newItem);
        return { action: 'added', item: newItem };
      }
    } catch (error) {
      throw new InternalServerErrorException('Failed to toggle wishlist item');
    }
  }

  async syncWishlist(userId: string, items: any[]) {
    try {
      const results: UserWishlist[] = [];
      for (const item of items) {
        if (!item.item_type || !item.item_id) continue;
        
        const existing = await this.wishlistRepo.findOne({
          where: { user_id: userId, item_type: item.item_type, item_id: item.item_id },
        });

        if (!existing) {
          const newItem = this.wishlistRepo.create({
            user_id: userId,
            item_type: item.item_type,
            item_id: item.item_id,
            raw_data: item.raw_data || null,
          });
          await this.wishlistRepo.save(newItem);
          results.push(newItem);
        }
      }
      return results;
    } catch (error) {
      throw new InternalServerErrorException('Failed to sync wishlist');
    }
  }
}
