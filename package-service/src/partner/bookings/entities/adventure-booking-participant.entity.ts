import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { PackageBooking } from './adventure-booking.entity';

@Entity('adventure_booking_participants')
export class PackageBookingParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  booking_id: string;

  @Column({ type: 'varchar', length: 255 })
  full_name: string;

  @Column({ type: 'int' })
  age: number;

  @Column({ type: 'varchar', length: 20, default: 'Adult' })
  gender: string;

  @Column({ type: 'boolean', default: false })
  waiver_signed: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @ManyToOne(() => PackageBooking, (b) => b.participants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: PackageBooking;
}
