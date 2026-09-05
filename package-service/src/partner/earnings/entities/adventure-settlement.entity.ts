import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { PackagePartner } from '../../setup/entities/package_partner.entity';
import { PackageBankAccount } from './adventure-bank-account.entity';

@Entity('package_partner_settlements')
@Index('idx_adv_settlements_partner_id', ['partner_id'])
@Index('idx_adv_settlements_ref_id', ['reference_id'])
@Index('idx_adv_settlements_status', ['status'])
export class PackageSettlement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  reference_id: string;

  @Column({ type: 'uuid' })
  partner_id: string;

  @Column({ type: 'uuid', nullable: true })
  bank_account_id: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  gross_amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  commission_amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  tds_gst_amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0.00 })
  refunds_deducted: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  net_amount: number;

  @Column({ type: 'int' })
  total_bookings_count: number;

  @Column({ type: 'varchar', length: 255 })
  bank_display_text: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  utr_number: string;

  @Column({ type: 'varchar', length: 30, default: 'PROCESSING' })
  status: string;

  @Column({ type: 'text', nullable: true })
  failure_reason: string;

  @Column({ type: 'timestamptz', nullable: true })
  settled_at: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @ManyToOne(() => PackagePartner, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'partner_id' })
  partner: PackagePartner;

  @ManyToOne(() => PackageBankAccount, { nullable: true })
  @JoinColumn({ name: 'bank_account_id' })
  bank_account: PackageBankAccount;
}
