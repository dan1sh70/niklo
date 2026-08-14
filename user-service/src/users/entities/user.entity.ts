import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum KycStatus {
  NOT_SUBMITTED = 'NOT_SUBMITTED',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export enum UserRole {
  PASSENGER = 'Passenger',
  DRIVER = 'Car Driver',
  BUS_OPERATOR = 'Bus Operator',
  HOTEL_PARTNER = 'Hotel Partner',
  ADMIN = 'Admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  phone: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  avatar_url: string;

  @Column({ type: 'varchar', length: 50, default: KycStatus.NOT_SUBMITTED })
  kyc_status: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  wallet_balance: number;

  @Column({ type: 'varchar', length: 10, default: 'en' })
  preferred_language: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.PASSENGER })
  role: UserRole;
}
