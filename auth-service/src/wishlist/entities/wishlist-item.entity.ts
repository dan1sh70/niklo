import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

/// One saved item per (user, type, id).
///
/// The customer app kept this list in a local Hive box keyed only by
/// `${type}_${id}` — no user id anywhere — so two accounts on one device saw a
/// merged list, and a reinstall lost everything. The unique constraint here is
/// what makes "add" idempotent: the app fires toggles optimistically and
/// retries, and a double-add must not create a second row.
@Entity('wishlist_items')
@Unique('UQ_wishlist_user_item', ['user_id', 'item_type', 'item_id'])
export class WishlistItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('IDX_wishlist_user')
  @Column({ type: 'uuid' })
  user_id: string;

  /// 'hotel' | 'bus' | 'package' | 'experience'. Deliberately a varchar and not
  /// a pg enum: `synchronize` is on for this service, and altering an enum in
  /// place is the one schema change it does not handle cleanly. The allowed set
  /// is enforced by the DTO instead — see WISHLIST_ITEM_TYPES.
  @Column({ type: 'varchar', length: 32 })
  item_type: string;

  /// Not a foreign key. These ids live in other services' databases (hotel,
  /// bus, package), and experiences are currently saved by title because the
  /// app has no stable id for them yet — 255 leaves room for that.
  @Column({ type: 'varchar', length: 255 })
  item_id: string;

  /// Denormalised snapshot of the card the user saved: name, image, price.
  ///
  /// The wishlist screen renders straight from this, which is what lets it work
  /// offline and survive the owning service being down. It goes stale — treat
  /// it as a thumbnail, and refetch by `item_id` before anything that depends
  /// on a current price.
  @Column({ type: 'jsonb', nullable: true })
  raw_data: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
