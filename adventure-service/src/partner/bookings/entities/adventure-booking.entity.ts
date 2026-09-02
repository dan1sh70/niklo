import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn, Index,
} from 'typeorm';
import { AdventurePartner } from '../../setup/entities/adventure-partner.entity';
import { AdventureActivity } from '../../activities/entities/adventure-activity.entity';
import { AdventureBookingParticipant } from './adventure-booking-participant.entity';
import { AdventureBookingInclusion } from './adventure-booking-inclusion.entity';

@Entity('adventure_bookings')
@Index('idx_adv_bookings_partner_id', ['partner_id'])
@Index('idx_adv_bookings_status', ['status'])
@Index('idx_adv_bookings_date', ['booking_date'])
@Index('idx_adv_bookings_number', ['booking_number'])
export class AdventureBooking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  booking_number: string;

  @Column({ type: 'uuid' })
  partner_id: string;

  @Column({ type: 'uuid' })
  activity_id: string;

  @Column({ type: 'uuid', nullable: true })
  slot_id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'date' })
  booking_date: string;

  @Column({ type: 'varchar', length: 50 })
  time_slot: string;

  @Column({ type: 'int' })
  participants_count: number;

  @Column({ type: 'varchar', length: 100, default: 'Standard' })
  tier_name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  instructor_name: string;

  @Column({ type: 'varchar', length: 255 })
  customer_name: string;

  @Column({ type: 'varchar', length: 30 })
  customer_phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  customer_email: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_amount: number;

  @Column({ type: 'varchar', length: 30, default: 'PENDING' })
  payment_status: string;

  @Column({ type: 'varchar', length: 50, default: 'ONLINE' })
  payment_method: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  transaction_id: string;

  @Column({ type: 'varchar', length: 30, default: 'CONFIRMED' })
  status: string;

  @Column({ type: 'boolean', default: false })
  is_rescheduled: boolean;

  @Column({ type: 'date', nullable: true })
  rescheduled_from_date: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  rescheduled_from_slot: string;

  @Column({ type: 'text', nullable: true })
  reschedule_reason: string;

  @Column({ type: 'timestamptz', nullable: true })
  checked_in_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completed_at: Date;

  @Column({ type: 'text', nullable: true })
  cancellation_reason: string;

  @Column({ type: 'timestamptz', nullable: true })
  cancelled_at: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @ManyToOne(() => AdventurePartner, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'partner_id' })
  partner: AdventurePartner;

  @ManyToOne(() => AdventureActivity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'activity_id' })
  activity: AdventureActivity;

  @OneToMany(() => AdventureBookingParticipant, (p) => p.booking, { cascade: true })
  participants: AdventureBookingParticipant[];

  @OneToMany(() => AdventureBookingInclusion, (i) => i.booking, { cascade: true })
  inclusions: AdventureBookingInclusion[];
}
