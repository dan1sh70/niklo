import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('package_bookings')
export class PackageBooking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  booking_ref: string;

  @Column()
  package_id: string;

  @Column()
  partner_id: string;

  @Column()
  departure_id: string;

  @Column()
  traveler_user_id: string;

  @Column({ type: 'date' })
  start_date: string;

  @Column({ type: 'date' })
  end_date: string;

  @Column({ default: '' })
  pickup_point: string;

  @Column({ default: '08:00 AM' })
  reporting_time: string;

  @Column({ type: 'int' })
  adults_count: number;

  @Column({ type: 'int', default: 0 })
  children_count: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  gross_amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount_amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  gst_amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  net_total: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 10.0 })
  platform_fee_percent: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  platform_fee_amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  partner_payout_amount: number;

  @Column({ default: 'PENDING_ACCEPTANCE' })
  status: string;

  @Column({ default: 'PAID_ADVANCE' })
  payment_status: string;

  @Column({ nullable: true })
  settlement_id: string;

  @Column({ type: 'timestamptz', nullable: true })
  expires_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  accepted_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completed_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
