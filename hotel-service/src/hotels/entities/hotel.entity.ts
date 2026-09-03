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

export enum StayType {
  HOTEL = 'HOTEL',
  RESORT = 'RESORT',
  VILLA = 'VILLA',
  HOMESTAY = 'HOMESTAY',
  APARTMENT = 'APARTMENT',
}

@Entity('hotels')
export class Hotel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  partnerId: string;

  @Column({ nullable: true })
  title: string;

  @Column({
    type: 'enum',
    enum: StayType,
    default: StayType.HOTEL,
  })
  stay_type: StayType;

  @Column({ length: 100, default: 'City' })
  city: string;

  @Column('text', { nullable: true })
  address: string;

  @Column('numeric', { precision: 10, scale: 6, nullable: true })
  latitude: number;

  @Column('numeric', { precision: 10, scale: 6, nullable: true })
  longitude: number;

  @Column('int', { default: 4 })
  star_rating: number;

  @Column('numeric', { precision: 3, scale: 2, default: 4.5 })
  user_rating: number;

  @Column({ length: 50, default: 'Very Good' })
  rating_text: string;

  @Column('int', { default: 0 })
  reviews_count: number;

  @Column('numeric', { precision: 10, scale: 2, nullable: true })
  price_per_night: number;

  @Column('numeric', { precision: 10, scale: 2, nullable: true })
  original_price_per_night: number;

  @Column('int', { default: 0 })
  discount_percent: number;

  @Column({ length: 100, nullable: true })
  badge_text: string;

  @Column({ length: 100, nullable: true })
  distance_text: string;

  @Column({ default: true })
  free_breakfast: boolean;

  @Column({ default: true })
  free_wifi: boolean;

  @Column({ default: true })
  free_cancellation: boolean;

  @Column('text', { nullable: true })
  image_url: string;

  @Column({ type: 'jsonb', nullable: true, default: [] })
  gallery_images: string[];

  @Column({ type: 'jsonb', nullable: true, default: [] })
  amenities: any[];

  @Column({ type: 'jsonb', nullable: true, default: [] })
  nearby_places: any[];

  @Column({ type: 'jsonb', nullable: true, default: [] })
  features: any[];

  @Column({ type: 'jsonb', nullable: true, default: [] })
  house_rules: any[];

  @Column({ type: 'jsonb', nullable: true })
  rating_breakdown: any;

  @Column('text', { nullable: true })
  description: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: false })
  is_trending: boolean;

  @Column({ default: false })
  is_hourly: boolean;

  @OneToMany(() => RoomType, (roomType) => roomType.hotel, { cascade: true })
  roomTypes: RoomType[];

  @OneToMany(() => Review, (review) => review.hotel, { cascade: true })
  reviews: Review[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
