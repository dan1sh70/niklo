import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { PackagePartner } from './package_partner.entity';

@Entity('package_partner_categories')
@Unique(['partner_id', 'category_id'])
export class PackagePartnerCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  partner_id: string;

  @Column({ type: 'varchar', length: 50 })
  category_id: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @ManyToOne(() => PackagePartner, (p) => p.categories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'partner_id' })
  partner: PackagePartner;
}
