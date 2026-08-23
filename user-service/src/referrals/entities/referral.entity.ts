import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('referrals')
export class Referral {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index('idx_referrals_referrer')
  referrer_id: string;

  @Column({ type: 'uuid', unique: true })
  referee_id: string;

  @Column({ type: 'varchar', length: 50 })
  referral_code: string;

  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  status: string; // 'PENDING' | 'COMPLETED'

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 100.0 })
  reward_amount: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completed_at: Date;

  // Relation to load referee user details (name, avatar)
  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'referee_id' })
  referee: User;
}
