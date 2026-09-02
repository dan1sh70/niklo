import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { AdventurePartner } from '../../setup/entities/adventure-partner.entity';

@Entity('adventure_partner_bank_accounts')
export class AdventureBankAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  partner_id: string;

  @Column({ type: 'varchar', length: 255 })
  account_holder_name: string;

  @Column({ type: 'text' })
  account_number_enc: string;

  @Column({ type: 'varchar', length: 30 })
  account_number_mask: string;

  @Column({ type: 'varchar', length: 100 })
  bank_name: string;

  @Column({ type: 'varchar', length: 20 })
  ifsc_code: string;

  @Column({ type: 'boolean', default: true })
  is_primary: boolean;

  @Column({ type: 'boolean', default: false })
  is_verified: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @ManyToOne(() => AdventurePartner, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'partner_id' })
  partner: AdventurePartner;
}
