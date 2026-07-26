import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum BookingType {
  BUS = 'BUS',
  CAR = 'CAR',
  JOURNEY_LEG = 'JOURNEY_LEG',
  PACKAGE = 'PACKAGE',
  ADVENTURE = 'ADVENTURE',
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'enum', enum: BookingType })
  booking_type: BookingType;

  @Column({ type: 'uuid' })
  schedule_id: string;

  @Column({ type: 'uuid', nullable: true })
  journey_id: string;

  @Column({ type: 'varchar', array: true, nullable: true })
  seat_numbers: string[];

  @Column({ type: 'varchar', length: 255, nullable: true })
  boarding_point: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  dropping_point: string;

  @Column({ type: 'jsonb', nullable: true })
  passenger_details: any;

  /**
   * Whoever the operator should call about this trip. Kept off
   * `passenger_details` so the manifest can show one contact per booking rather
   * than repeating it on every traveller.
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  contact_email: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  contact_phone: string | null;

  @Column({ type: 'jsonb', nullable: true })
  fare_breakdown: any;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  total_amount: number;

  @Column({ type: 'uuid', nullable: true })
  payment_id: string;

  @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.PENDING })
  status: BookingStatus;

  @Column({ type: 'text', nullable: true })
  qr_code: string;

  @Column({ type: 'date', nullable: true })
  travel_date: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
