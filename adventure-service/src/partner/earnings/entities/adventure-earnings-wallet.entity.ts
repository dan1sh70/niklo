import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, OneToOne, JoinColumn, Index } from 'typeorm';
import { AdventurePartner } from '../../setup/entities/adventure-partner.entity';

@Entity('adventure_partner_earnings_wallets')
export class AdventureEarningsWallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  partner_id: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0.00 })
  total_gross_revenue: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0.00 })
  total_net_earnings: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0.00 })
  available_balance: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0.00 })
  pending_clearance: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0.00 })
  total_withdrawn: number;

  @Column({ type: 'varchar', length: 10, default: 'INR' })
  currency: string;

  @Column({ type: 'varchar', length: 30, default: 'ON_TRACK' })
  payout_status: string;

  @Column({ type: 'timestamptz', nullable: true })
  last_payout_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @OneToOne(() => AdventurePartner, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'partner_id' })
  partner: AdventurePartner;
}
