import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

/// The four kinds of card the app puts a heart on. Keep this in step with the
/// `type` strings the client sends from `toggleWishlist` — anything else is
/// rejected at the pipe rather than written as an unreadable row.
export const WISHLIST_ITEM_TYPES = [
  'hotel',
  'bus',
  'package',
  'experience',
] as const;

export type WishlistItemType = (typeof WISHLIST_ITEM_TYPES)[number];

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class WishlistItemDto {
  @IsString()
  @IsIn(WISHLIST_ITEM_TYPES, {
    message: `item_type must be one of: ${WISHLIST_ITEM_TYPES.join(', ')}`,
  })
  item_type: WishlistItemType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Transform(trim)
  item_id: string;

  /// Optional so a client that only has an id can still save. The global
  /// ValidationPipe runs with `whitelist: true`, which strips unknown keys off
  /// DTOs — but not out of a plain object property, so the snapshot arrives
  /// whole.
  @IsOptional()
  @IsObject()
  raw_data?: Record<string, unknown>;
}

/// Bulk merge, used once per device when a user who already had a local-only
/// wishlist signs in. Capped because it arrives unpaginated; a real list is a
/// few dozen items, and anything near the cap is a client bug rather than a
/// user with 500 favourites.
export class SyncWishlistDto {
  @IsArray()
  @ArrayMaxSize(500, {
    message: 'Cannot sync more than 500 wishlist items at once',
  })
  @ValidateNested({ each: true })
  @Type(() => WishlistItemDto)
  items: WishlistItemDto[];
}
