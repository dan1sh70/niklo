import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TravelAdventure } from './adventure.entity';

@Entity('adventure_reviews')
export class AdventureReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  adventure_id: string;

  @Column({ type: 'uuid', nullable: true })
  user_id: string;

  @Column({ type: 'varchar', length: 100 })
  user_name: string;

  @Column({ type: 'text', nullable: true })
  user_avatar: string;

  @Column({ type: 'numeric', precision: 3, scale: 1 })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ type: 'numeric', precision: 3, scale: 1, default: 5.0 })
  safety_rating: number;

  @Column({ type: 'numeric', precision: 3, scale: 1, default: 5.0 })
  experience_rating: number;

  @Column({ type: 'numeric', precision: 3, scale: 1, default: 5.0 })
  value_rating: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => TravelAdventure, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'adventure_id' })
  adventure: TravelAdventure;
}
