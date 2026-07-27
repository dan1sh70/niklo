import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { RoomType } from './room-type.entity';
import { Review } from './review.entity';

@Entity('hotels')
export class Hotel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Partner (hotel owner) who manages this property, taken from the JWT at
   * creation time. Nullable because rows seeded before partner support existed
   * have no owner — those stay visible to guests but cannot be managed.
   */
  @Index()
  @Column({ nullable: true })
  ownerId: string | null;

  /** Unpublished properties stay out of search/trending but keep their data. */
  @Column({ default: true })
  isActive: boolean;

  @Column()
  hotelName: string;

  @Column({ nullable: true })
  badgeText: string;

  @Column()
  imagePath: string;

  @Column('text', { array: true, default: [] })
  galleryImages: string[];

  @Column()
  distanceText: string;

  @Column('float')
  ratingValue: number;

  @Column()
  ratingText: string;

  @Column('int', { default: 0 })
  reviewsCount: number;

  @Column({ default: false })
  freeBreakfast: boolean;

  @Column({ default: false })
  freeWifi: boolean;

  @Column({ default: false })
  freeCancellation: boolean;

  @Column()
  priceText: string;

  @Column('int')
  priceInt: number;

  @Column('text')
  description: string;

  @Column()
  address: string;

  // Nullable: a partner onboards with a name and an address; coordinates are
  // added later, and (0, 0) would put the property in the Atlantic.
  @Column('float', { nullable: true })
  latitude: number | null;

  @Column('float', { nullable: true })
  longitude: number | null;

  @Column({ type: 'jsonb', default: [] })
  popularAmenities: any[];

  @Column({ type: 'jsonb', default: [] })
  nearbyPlaces: any[];

  @Column({ type: 'jsonb', default: [] })
  features: any[];

  @Column({ type: 'jsonb', nullable: true })
  rules: any;

  @Column({ type: 'jsonb', nullable: true })
  hourlyOptions: any;

  /** Partner-managed promotions: `[{ id, title, description, cta, discountPercent, expiresAt, isActive }]`. */
  @Column({ type: 'jsonb', default: [] })
  offers: any[];

  @OneToMany(() => RoomType, (roomType) => roomType.hotel, { cascade: true })
  roomTypes: RoomType[];

  @OneToMany(() => Review, (review) => review.hotel, { cascade: true })
  reviews: Review[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
