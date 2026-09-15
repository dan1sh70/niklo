import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('payouts')
export class Payout {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  vendor_id: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column()
  payment_method: string; // 'UPI', 'BANK_TRANSFER'

  @Column('jsonb', { nullable: true })
  payment_details: any; // { upi_id: '...' } or { account_number: '...', ifsc: '...' }

  @Column({ default: 'PENDING' })
  status: string; // 'PENDING', 'APPROVED', 'REJECTED', 'PAID'

  @Column({ nullable: true })
  transaction_ref: string; // If paid

  @Column({ type: 'text', nullable: true })
  rejection_reason: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
