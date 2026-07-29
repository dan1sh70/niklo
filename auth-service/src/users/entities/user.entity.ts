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

  // The nullable columns are typed as such. They have always been nullable in
  // the database; declaring them `string` only hid that from the compiler.
  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string | null;

  @Column({ type: 'text', nullable: true })
  avatar_url: string | null;

  // Stored as the free-text string the client sends ("12 March 1995"), not a
  // `date`. The customer app formats the date for display before it ever
  // leaves the device, and nothing server-side computes on this yet. Turning it
  // into a real `date` column means changing what the app sends as well —
  // don't do one without the other.
  @Column({ type: 'varchar', length: 32, nullable: true })
  dob: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  gender: string | null;

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
