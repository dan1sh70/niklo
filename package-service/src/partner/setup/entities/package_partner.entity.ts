import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  OneToMany, OneToOne,
} from 'typeorm';
import { PackagePartnerCategory } from './package_partner-category.entity';
import { PackagePartnerLocation } from './package_partner-location.entity';
import { PackagePartnerDocument } from './package_partner-document.entity';

export enum VerificationStatus {
  DRAFT = 'DRAFT',
  UNDER_VERIFICATION = 'UNDER_VERIFICATION',
  ACTION_REQUIRED = 'ACTION_REQUIRED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity('package_partners')
export class PackagePartner {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  user_id: string;

  @Column({ type: 'varchar', length: 30, unique: true, nullable: true })
  application_ref: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  business_name: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  trade_name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  business_type: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  registration_number: string;

  @Column({ type: 'int', default: 0 })
  years_in_business: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address_line1: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  city: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  state: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  pincode: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  pan_number: string;

  @Column({ type: 'varchar', length: 15, nullable: true })
  gstin: string;

  @Column({ type: 'text', array: true, default: [] })
  primary_regions: string[];

  @Column({ type: 'text', array: true, default: [] })
  tour_categories: string[];

  @Column({ type: 'varchar', length: 30, nullable: true })
  average_group_size: string;

  @Column({ type: 'varchar', length: 30, default: 'BUSINESS_DETAILS' })
  onboarding_step: string;

  @Column({ type: 'varchar', length: 30, default: VerificationStatus.DRAFT })
  verification_status: string;

  @Column({ type: 'text', nullable: true })
  rejection_reason: string;

  @Column({ type: 'timestamptz', nullable: true })
  verified_at: Date;

  @Column({ type: 'uuid', nullable: true })
  verified_by: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @OneToMany(() => PackagePartnerCategory, (c) => c.partner, { cascade: true })
  categories: PackagePartnerCategory[];

  @OneToOne(() => PackagePartnerLocation, (l) => l.partner, { cascade: true })
  location: PackagePartnerLocation;

  @OneToMany(() => PackagePartnerDocument, (d) => d.partner, { cascade: true })
  documents: PackagePartnerDocument[];
}
