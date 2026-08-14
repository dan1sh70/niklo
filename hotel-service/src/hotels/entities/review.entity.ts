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

  @Column({ length: 255 })
  user_name: string;

  @Column('text', { nullable: true })
  user_avatar: string;

  @Column('numeric', { precision: 3, scale: 2 })
  rating: number;

  @Column('text')
  comment: string;

  @CreateDateColumn()
  created_at: Date;
}
