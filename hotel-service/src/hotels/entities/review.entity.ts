import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Hotel } from './hotel.entity';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Hotel, (hotel) => hotel.reviews, { onDelete: 'CASCADE' })
  hotel: Hotel;

  /** Author, taken from the JWT. One review per guest per property. */
  @Index()
  @Column({ nullable: true })
  userId: string | null;

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
  propertyReply: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  repliedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
