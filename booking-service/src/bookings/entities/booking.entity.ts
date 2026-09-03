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
  HOTEL = 'HOTEL',
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

  @Column({ type: 'uuid', nullable: true })
  reference_id: string;

  @Column({ type: 'varchar', length: 50, unique: true, nullable: true })
  booking_reference: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  subtitle: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  from_location: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  to_location: string;

  @Column({ type: 'date', nullable: true })
  travel_date: Date;

  @Column({ type: 'varchar', length: 20, nullable: true })
  departure_time: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  total_amount: number;

  @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.CONFIRMED })
  status: BookingStatus;

  @Column({ type: 'text', nullable: true })
  qr_code_token: string;

  @Column({ type: 'boolean', default: false })
  has_insurance: boolean;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0.00 })
  insurance_premium: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  insurance_policy_number: string;

  @Column({ type: 'varchar', length: 50, default: 'Digit / Acko' })
  insurance_partner: string;

  @Column({ type: 'boolean', default: false })
  has_gov_id_verification: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  primary_gov_id_type: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  primary_gov_id_number: string;

  @Column({ type: 'varchar', length: 30, default: 'UNVERIFIED' })
  id_verification_status: string;

  @Column({ type: 'simple-array', nullable: true })
  seat_numbers: string[];

  @Column({ type: 'varchar', length: 50, nullable: true })
  coupon_code: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0.00 })
  discount_amount: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
