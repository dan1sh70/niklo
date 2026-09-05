import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { PackagePartner } from './package_partner.entity';

@Entity('package_partner_banks')
export class PackagePartnerBank {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  partner_id: string;

  @OneToOne(() => PackagePartner, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'partner_id' })
  partner: PackagePartner;

  @Column({ type: 'varchar', length: 150 })
  account_holder_name: string;

  @Column({ type: 'varchar', length: 30 })
  account_number: string;

  @Column({ type: 'varchar', length: 20 })
  ifsc_code: string;

  @Column({ type: 'varchar', length: 100 })
  bank_name: string;

  @Column({ type: 'boolean', default: false })
  is_verified: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  verification_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
