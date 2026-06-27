import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Hotel } from './hotel.entity';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Hotel, (hotel) => hotel.reviews, { onDelete: 'CASCADE' })
  hotel: Hotel;

  @Column()
  title: string;

  @Column()
  reviewerName: string;

  @Column()
  date: string;

  @Column('float')
  rating: number;

  @Column('text')
  comment: string;

  @Column({ default: false })
  hasPropertyReply: boolean;

  @Column('text', { nullable: true })
  propertyReply: string;

  @CreateDateColumn()
  createdAt: Date;
}
