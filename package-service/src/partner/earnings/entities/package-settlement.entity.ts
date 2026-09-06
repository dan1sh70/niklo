import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('package_settlements')
export class PackageSettlement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  reference_id: string;

  @Column()
  partner_id: string;

  @Column()
  bank_account_id: string;

  @Column({ type: 'date' })
  cycle_start_date: string;

  @Column({ type: 'date' })
  cycle_end_date: string;

  @Column({ type: 'date' })
  settlement_date: string;

  @Column({ type: 'int' })
  total_completed_bookings: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  gross_volume: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 10.0 })
  commission_rate: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  commission_amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  gst_on_commission: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  tds_deduction_amount: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  net_payout_amount: number;

  @Column({ default: 'RAZORPAYX' })
  gateway_provider: string;

  @Column({ nullable: true })
  gateway_transfer_id: string;

  @Column({ nullable: true })
  utr_number: string;

  @Column({ default: 'PROCESSING' })
  status: string;

  @Column({ type: 'text', nullable: true })
  failure_reason: string;

  @Column({ nullable: true })
  invoice_pdf_url: string;

  @Column({ nullable: true })
  invoice_number: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
