import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { PackagePartner } from './package_partner.entity';

@Entity('package_partner_bank_accounts')
export class PackagePartnerBank {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  partner_id: string;

  @ManyToOne(() => PackagePartner, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'partner_id' })
  partner: PackagePartner;

  @Column({ type: 'varchar', length: 100 })
  bank_name: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  branch_name: string;

  @Column({ type: 'varchar', length: 120 })
  account_holder_name: string;

  @Column({ type: 'text' })
  account_number_encrypted: string;

  @Column({ type: 'varchar', length: 20 })
  account_number_mask: string;

  @Column({ type: 'varchar', length: 11 })
  ifsc_code: string;

  @Column({ type: 'varchar', length: 20, default: 'CURRENT' })
  account_type: string;

  @Column({ type: 'varchar', length: 30, default: 'PENDING' })
  penny_drop_status: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  penny_drop_ref: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  penny_drop_beneficiary_name: string;

  @Column({ type: 'boolean', default: true })
  is_primary: boolean;

  @Column({ type: 'boolean', default: false })
  is_verified: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
