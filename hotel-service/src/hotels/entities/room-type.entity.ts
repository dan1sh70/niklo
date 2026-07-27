import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Hotel } from './hotel.entity';

@Entity('room_types')
export class RoomType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Hotel, (hotel) => hotel.roomTypes, { onDelete: 'CASCADE' })
  hotel: Hotel;

  @Column()
  title: string;

  @Column()
  guestCount: string;

  @Column()
  size: string;

  @Column('int')
  imageCount: number;

  @Column('text', { array: true, default: [] })
  images: string[];

  @Column()
  mealPlan: string;

  @Column()
  mealPlanDesc: string;

  @Column('int')
  price: number;

  @Column('int', { nullable: true })
  oldPrice: number;

  @Column()
  taxes: string;

  @Column({ type: 'jsonb', default: [] })
  amenities: any[];

  @Column({ type: 'jsonb', nullable: true })
  cancellationPolicy: any;

  @Column('text', { array: true, default: [] })
  inclusions: string[];

  /**
   * How many physical rooms of this type the property has. Availability is
   * `totalRooms` minus the rooms held by bookings overlapping the requested
   * dates, which is what stops the same room being sold twice.
   */
  @Column('int', { default: 1 })
  totalRooms: number;

  /** Rooms taken off sale keep their history but stop accepting bookings. */
  @Column({ default: true })
  isActive: boolean;
}
