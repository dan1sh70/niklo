import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('travel_adventures')
export class TravelAdventure {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  original_price: number;

  @Column({ type: 'int', default: 0 })
  discount_percent: number;

  @Column({ type: 'int' })
  duration_hours: number;

  @Column({ type: 'varchar', length: 255 })
  location: string;

  @Column({ type: 'varchar', length: 100, default: 'Goa', nullable: true })
  city: string;

  @Column({ type: 'varchar', length: 100, default: 'Adventure', nullable: true })
  category: string;

  @Column({ type: 'text', default: 'Activity Headquarters', nullable: true })
  meeting_point: string;

  @Column({ type: 'numeric', precision: 10, scale: 6, nullable: true })
  latitude: number;

  @Column({ type: 'numeric', precision: 10, scale: 6, nullable: true })
  longitude: number;

  @Column({ type: 'numeric', precision: 3, scale: 2, default: 4.8 })
  rating: number;

  @Column({ type: 'int', default: 120 })
  reviews_count: number;

  @Column({ type: 'varchar', length: 50, default: 'Moderate', nullable: true })
  difficulty: string;

  @Column({ type: 'varchar', length: 100, default: 'Up to 10 People', nullable: true })
  group_size: string;

  @Column({ type: 'text', nullable: true })
  image_url: string;

  @Column({ type: 'jsonb', default: [], nullable: true })
  gallery_images: string[];

  @Column({ type: 'jsonb', default: [], nullable: true })
  highlights: string[];

  @Column({ type: 'jsonb', default: [], nullable: true })
  whats_included: string[];

  @Column({ type: 'jsonb', default: [], nullable: true })
  what_to_bring: string[];

  @Column({ type: 'text', default: 'Free cancellation 24h prior', nullable: true })
  cancellation_policy: string;

  @Column({ type: 'text', default: 'Follow pilot/guide instructions strictly', nullable: true })
  safety_guidelines: string;

  @Column({ type: 'int', default: 10 })
  min_age: number;

  @Column({ type: 'int', default: 15 })
  max_participants: number;

  @Column({ type: 'boolean', default: false })
  is_trending: boolean;

  @Column({ type: 'boolean', default: false })
  is_featured: boolean;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
