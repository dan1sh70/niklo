import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { AdventureBooking } from './adventure-booking.entity';

@Entity('adventure_booking_inclusions')
export class AdventureBookingInclusion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  booking_id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @ManyToOne(() => AdventureBooking, (b) => b.inclusions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: AdventureBooking;
}
