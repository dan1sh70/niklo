import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('coupons')
export class Coupon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 20 })
  discount_type: 'FLAT' | 'PERCENTAGE';

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  discount_value: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  min_order_amount: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  max_discount_amount: number;

  @Column({ type: 'varchar', length: 50, default: 'ALL' })
  applicable_category: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  valid_from: Date;

  @Column({ type: 'timestamptz' })
  valid_until: Date;

  @Column({ type: 'int', default: 1000 })
  usage_limit: number;

  @Column({ type: 'int', default: 0 })
  used_count: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
