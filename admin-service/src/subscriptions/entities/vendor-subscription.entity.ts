import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { SubscriptionPlan } from './subscription-plan.entity';

@Entity('vendor_subscriptions')
export class VendorSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  vendor_id: string;

  @Column('uuid')
  plan_id: string;

  @ManyToOne(() => SubscriptionPlan)
  @JoinColumn({ name: 'plan_id' })
  plan: SubscriptionPlan;

  @Column('timestamp')
  start_date: Date;

  @Column('timestamp')
  end_date: Date;

  @Column({ default: 'active' })
  status: string; // active, expired, cancelled, trial

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
