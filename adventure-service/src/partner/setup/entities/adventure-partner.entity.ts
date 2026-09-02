import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  OneToMany, OneToOne,
} from 'typeorm';
import { AdventurePartnerCategory } from './adventure-partner-category.entity';
import { AdventurePartnerLocation } from './adventure-partner-location.entity';
import { AdventurePartnerDocument } from './adventure-partner-document.entity';

export enum VerificationStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  ACTION_REQUIRED = 'ACTION_REQUIRED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}

@Entity('adventure_partners')
export class AdventurePartner {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  user_id: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  partner_type: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  business_name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  owner_name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  state: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  pincode: string;

  @Column({ type: 'int', default: 1 })
  onboarding_step: number;

  @Column({ type: 'varchar', length: 30, default: VerificationStatus.DRAFT })
  verification_status: string;

  @Column({ type: 'text', nullable: true })
  rejection_reason: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  total_reviews: number;

  @Column({ type: 'text', nullable: true })
  logo_url: string;

  @Column({ type: 'timestamptz', nullable: true })
  verified_at: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @OneToMany(() => AdventurePartnerCategory, (c) => c.partner, { cascade: true })
  categories: AdventurePartnerCategory[];

  @OneToOne(() => AdventurePartnerLocation, (l) => l.partner, { cascade: true })
  location: AdventurePartnerLocation;

  @OneToMany(() => AdventurePartnerDocument, (d) => d.partner, { cascade: true })
  documents: AdventurePartnerDocument[];
}
