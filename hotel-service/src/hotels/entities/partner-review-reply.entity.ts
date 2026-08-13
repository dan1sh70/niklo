import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Review } from './review.entity';

@Entity('partner_review_replies')
export class PartnerReviewReply {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  review_id: string;

  @Column({ type: 'uuid' })
  partner_id: string;

  @Column({ type: 'text' })
  reply_text: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Review)
  @JoinColumn({ name: 'review_id' })
  review: Review;
}
