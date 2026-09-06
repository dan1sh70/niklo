import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('package_withdrawal_requests')
export class PackageWithdrawalRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  request_ref: string;

  @Column()
  partner_id: string;

  @Column()
  bank_account_id: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ default: 'REQUESTED' })
  status: string;

  @Column({ nullable: true })
  utr_number: string;

  @CreateDateColumn({ type: 'timestamptz' })
  requested_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  processed_at: Date;
}
