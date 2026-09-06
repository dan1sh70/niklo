import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('package_booking_cancellations')
export class PackageBookingCancellation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  booking_id: string;

  @Column()
  cancelled_by: string;

  @Column()
  reason_category: string;

  @Column({ type: 'text', nullable: true })
  custom_notes: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  refund_amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  partner_penalty_amount: number;

  @CreateDateColumn({ type: 'timestamptz' })
  cancelled_at: Date;
}
