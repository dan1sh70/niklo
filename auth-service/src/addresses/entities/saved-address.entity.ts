import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/// A pickup/drop address the user saved.
///
/// The customer app kept these in an in-memory list that was re-seeded with two
/// hardcoded Kolkata addresses on every launch — nothing a user added survived
/// leaving the screen, and every account saw the same two fakes.
@Entity('saved_addresses')
export class SavedAddress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('IDX_saved_addresses_user')
  @Column({ type: 'uuid' })
  user_id: string;

  /// 'home' | 'work' | 'other'. Varchar rather than a pg enum for the same
  /// reason as the wishlist: `synchronize` is on and does not alter enums
  /// cleanly. The allowed set is enforced by the DTO.
  ///
  /// Not unique per user. The app's Home/Work shortcuts take the first match,
  /// so a second 'home' is harmless, and a unique index here would reject an
  /// edit the user has every right to make.
  @Column({ type: 'varchar', length: 16 })
  type: string;

  @Column({ type: 'varchar', length: 64 })
  label: string;

  /// Free text, newlines included — the app renders this verbatim across
  /// several lines.
  @Column({ type: 'text' })
  full_address: string;

  /// `double precision`, not `numeric`. pg returns `numeric` to the driver as a
  /// string, and the app calls `.toDouble()` on these — the same trap
  /// `wallet_balance` fell into.
  @Column({ type: 'double precision', nullable: true })
  latitude: number | null;

  @Column({ type: 'double precision', nullable: true })
  longitude: number | null;

  /// At most one per user, held true by AddressesService rather than by a
  /// constraint: a partial unique index would make the "move the default"
  /// write order-dependent and fail mid-swap.
  @Column({ type: 'boolean', default: false })
  is_default: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
