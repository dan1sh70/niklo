import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { RoomType } from './room-type.entity';
import { Review } from './review.entity';

@Entity('hotels')
export class Hotel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  @Column('float')
  latitude: number;

  @Column('float')
  longitude: number;

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

  @OneToMany(() => RoomType, (roomType) => roomType.hotel, { cascade: true })
  roomTypes: RoomType[];

  @OneToMany(() => Review, (review) => review.hotel, { cascade: true })
  reviews: Review[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
