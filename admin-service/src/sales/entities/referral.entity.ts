import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('referrals')
export class Referral {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  sales_executive_id: string;

  @Column()
  referral_code: string;

  @Column('uuid')
  referred_user_id: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  total_revenue_generated: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  commission_earned: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
