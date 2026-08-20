import {
  Entity,
  PrimaryGeneratedColumn,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('travel_packages')
export class TravelPackage {
  @PrimaryColumn({ type: 'varchar', length: 100 })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string;

  @Column({ type: 'varchar', length: 100 })
  destination: string;

  @Column({ type: 'varchar', length: 100, default: 'Kolkata', nullable: true })
  start_city: string;

  @Column({ type: 'numeric', precision: 3, scale: 2, default: 4.8 })
  rating: number;

  @Column({ type: 'int', default: 85 })
  reviews_count: number;

  @Column({ type: 'varchar', length: 255 })
  location_text: string;

  @Column({ type: 'text' })
  snippet: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 50 })
  duration: string;

  @Column({ type: 'int', default: 4 })
  duration_days: number;

  @Column({ type: 'int', default: 3 })
  duration_nights: number;

  @Column({ type: 'varchar', length: 50, default: '2-6 Travelers', nullable: true })
  group_size: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  original_price: number;

  @Column({ type: 'int', default: 0 })
  discount_percent: number;

  @Column({ type: 'text' })
  image_url: string;

  @Column({ type: 'jsonb', default: [], nullable: true })
  gallery_images: string[];

  @Column({ type: 'jsonb', default: [], nullable: true })
  itinerary: any[];

  @Column({ type: 'jsonb', default: [], nullable: true })
  inclusions: string[];

  @Column({ type: 'jsonb', default: [], nullable: true })
  exclusions: string[];

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
