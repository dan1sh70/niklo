import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

export enum KycStatus {
  PENDING = 'pending',
  SUBMITTED = 'submitted',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 15, unique: true })
  phone: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  avatar_url: string;

  @Column({ type: 'enum', enum: KycStatus, default: KycStatus.PENDING })
  kyc_status: KycStatus;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  wallet_balance: number;

  @Column({ type: 'varchar', length: 10, default: 'en' })
  preferred_language: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;
}
