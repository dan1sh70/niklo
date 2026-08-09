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

  /** Door number the property uses for this room, e.g. "302". */
  @Column({ type: 'varchar', nullable: true })
  roomNumber: string | null;

  /** Category the property files this room under, e.g. "Deluxe". */
  @Column({ type: 'varchar', nullable: true })
  roomType: string | null;

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

  /** Nightly rate applied on weekends; falls back to `price` when unset. */
  @Column('int', { nullable: true })
  weekendPrice: number | null;

  /** Charged per guest beyond what the room's base rate covers. */
  @Column('int', { nullable: true })
  extraGuestCharge: number | null;

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
