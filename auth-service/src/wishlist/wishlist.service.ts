import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { WishlistItem } from './entities/wishlist-item.entity';
import { SyncWishlistDto, WishlistItemDto } from './dto/wishlist-item.dto';

/// Raised by Postgres when the (user_id, item_type, item_id) unique index is
/// hit. Adding an item that is already saved is a no-op, not an error — the app
/// toggles optimistically and retries on a flaky connection.
const PG_UNIQUE_VIOLATION = '23505';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(WishlistItem)
    private readonly wishlistRepository: Repository<WishlistItem>,
  ) {}

  /// Newest first — the wishlist screen shows the most recently saved card at
  /// the top and does no sorting of its own.
  async list(userId: string, itemType?: string) {
    const items = await this.wishlistRepository.find({
      where: {
        user_id: userId,
        ...(itemType ? { item_type: itemType } : {}),
      },
      order: { created_at: 'DESC' },
    });

    return items.map((item) => this.toResponse(item));
  }

  async add(userId: string, dto: WishlistItemDto) {
    const existing = await this.findOne(userId, dto.item_type, dto.item_id);

    // Re-adding refreshes the snapshot rather than duplicating the row. A card
    // whose price or photo changed should not stay frozen at whatever it was
    // the first time it was hearted.
    if (existing) {
      if (dto.raw_data !== undefined) {
        existing.raw_data = dto.raw_data;
        return this.toResponse(await this.wishlistRepository.save(existing));
      }
      return this.toResponse(existing);
    }

    const item = this.wishlistRepository.create({
      user_id: userId,
      item_type: dto.item_type,
      item_id: dto.item_id,
      raw_data: dto.raw_data ?? null,
    });

    try {
      return this.toResponse(await this.wishlistRepository.save(item));
    } catch (error) {
      // Two requests for the same card can pass the existence check together;
      // the loser re-reads the winner's row instead of surfacing a 500.
      if (error?.driverError?.code === PG_UNIQUE_VIOLATION) {
        const saved = await this.findOne(userId, dto.item_type, dto.item_id);
        if (saved) return this.toResponse(saved);
      }
      throw error;
    }
  }

  async remove(userId: string, itemType: string, itemId: string) {
    const result = await this.wishlistRepository.delete({
      user_id: userId,
      item_type: itemType,
      item_id: itemId,
    });

    if (!result.affected) {
      throw new NotFoundException('That item is not in your wishlist');
    }

    return { wishlisted: false, item_type: itemType, item_id: itemId };
  }

  /// What the heart button actually calls. Returns the resulting state so the
  /// client can settle its optimistic update against the server's answer
  /// instead of guessing.
  async toggle(userId: string, dto: WishlistItemDto) {
    const existing = await this.findOne(userId, dto.item_type, dto.item_id);

    if (existing) {
      await this.wishlistRepository.delete({ id: existing.id });
      return {
        wishlisted: false,
        item_type: dto.item_type,
        item_id: dto.item_id,
      };
    }

    const added = await this.add(userId, dto);
    return { wishlisted: true, ...added };
  }

  /// Merges a device's local list into the account's, then returns the full
  /// server-side list.
  ///
  /// Union, never replace. Users already have wishlists sitting in a local Hive
  /// box from before this table existed, and a device syncing an empty or
  /// partial list must not delete what was saved on another phone.
  async sync(userId: string, dto: SyncWishlistDto) {
    if (dto.items.length > 0) {
      await this.wishlistRepository
        .createQueryBuilder()
        .insert()
        .into(WishlistItem)
        .values(
          // Cast: TypeORM's QueryDeepPartialEntity maps a jsonb column of type
          // Record<string, unknown> onto its own deep-partial recursion and
          // rejects a plain object. The shape is already correct.
          dto.items.map((item) => ({
            user_id: userId,
            item_type: item.item_type,
            item_id: item.item_id,
            raw_data: item.raw_data ?? null,
          })) as QueryDeepPartialEntity<WishlistItem>[],
        )
        // Already-saved items keep their original created_at, so merging a
        // device does not reshuffle the list the user is looking at.
        .orIgnore()
        .execute();
    }

    return this.list(userId);
  }

  private findOne(userId: string, itemType: string, itemId: string) {
    return this.wishlistRepository.findOne({
      where: { user_id: userId, item_type: itemType, item_id: itemId },
    });
  }

  /// `user_id` is deliberately not echoed back: the caller is the user, and the
  /// column exists to scope the query, not to be shipped to a client.
  private toResponse(item: WishlistItem) {
    return {
      id: item.id,
      item_type: item.item_type,
      item_id: item.item_id,
      raw_data: item.raw_data,
      created_at: item.created_at,
    };
  }
}
