import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { Schedule } from './schedule.entity';

export enum ScheduleSeatStatus {
  BOOKED = 'BOOKED',
  RELEASED = 'RELEASED',
}

/**
 * Per-schedule seat state.
 *
 * `seat_layouts` describes the *physical* seats of a bus and is shared by every
 * trip that bus ever runs — writing availability there would mark a seat sold
 * out on every date. This table records what happened to a seat on one specific
 * schedule, so the same physical seat can be free on Tuesday and sold on
 * Wednesday.
 *
 * Rows are only created when a seat is sold. A seat with no row here is free.
 * Cancellations flip the row to RELEASED rather than deleting it, so the unique
 * constraint keeps doubling as the anti-double-booking lock.
 */
@Entity('schedule_seats')
@Unique('UQ_schedule_seat', ['schedule_id', 'seat_number'])
export class ScheduleSeat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  schedule_id: string;

  @ManyToOne(() => Schedule, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'schedule_id' })
  schedule: Schedule;

  @Column({ type: 'varchar', length: 10 })
  seat_number: string;

  @Column({
    type: 'enum',
    enum: ScheduleSeatStatus,
    default: ScheduleSeatStatus.BOOKED,
  })
  status: ScheduleSeatStatus;

  /** Booking that owns the seat. Lives in booking-service, so no FK. */
  @Column({ type: 'uuid', nullable: true })
  booking_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  user_id: string | null;

  /** 'M' | 'F' | 'O' — drives the ladies-seat rules in the seat map. */
  @Column({ type: 'varchar', length: 1, nullable: true })
  booked_gender: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
