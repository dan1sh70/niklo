import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('hotel_payouts')
export class HotelPayout {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  payout_ref: string;

  @Column({ type: 'uuid' })
  @Index()
  partner_id: string;

  @Column({ type: 'uuid', nullable: true })
  hotel_id: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  commission_deducted: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  tds_deducted: number;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  net_disbursed: number;

  @Column({ type: 'varchar', length: 20, default: 'REQUESTED' })
  status: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  gateway_payout_id: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  utr_number: string;

  @Column({ type: 'varchar', length: 30, default: 'NEFT' })
  transfer_mode: string;

  @Column({ type: 'text', nullable: true })
  failure_reason: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  processed_at: Date;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;
}
