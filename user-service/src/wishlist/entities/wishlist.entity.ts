import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Unique,
  Index,
} from 'typeorm';

@Entity('user_wishlist')
@Unique('uq_user_wishlist_item', ['user_id', 'item_type', 'item_id'])
@Index('idx_user_wishlist_user', ['user_id'])
export class UserWishlist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'varchar', length: 50 })
  item_type: string;

  @Column({ type: 'varchar', length: 100 })
  item_id: string;

  @Column({ type: 'jsonb', nullable: true })
  raw_data: any;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;
}
