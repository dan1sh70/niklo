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

  @Column({ type: 'int' })
  duration_hours: number;

  @Column({ type: 'varchar', length: 255 })
  location: string;

  @Column({ type: 'jsonb', default: [] })
  requirements: string[];

  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  meeting_point: string;

  @Column({ type: 'float', nullable: true })
  latitude: number;

  @Column({ type: 'float', nullable: true })
  longitude: number;

  @Column({ type: 'float', nullable: true })
  rating: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  difficulty: string;

  @Column({ type: 'jsonb', default: [] })
  gallery_images: string[];

  @Column({ type: 'jsonb', default: [] })
  highlights: string[];

  @Column({ type: 'jsonb', default: [] })
  whats_included: string[];

  @Column({ type: 'jsonb', default: [] })
  what_to_bring: string[];

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
