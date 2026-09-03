import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Hotel } from './hotel.entity';

@Entity('hotel_reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Hotel, (hotel) => hotel.reviews, { onDelete: 'CASCADE' })
  hotel: Hotel;

  @Column('uuid')
  user_id: string;

  @Column({ length: 255, nullable: true })
  user_name: string;

  @Column('text', { nullable: true })
  user_avatar: string;

  @Column('numeric', { precision: 3, scale: 2, nullable: true })
  rating: number;

  @Column('text', { nullable: true })
  comment: string;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  reviewer_name: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  property_reply: string;
}
