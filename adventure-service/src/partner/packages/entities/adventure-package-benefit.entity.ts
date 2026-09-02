import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { AdventurePackageTier } from './adventure-package-tier.entity';

@Entity('adventure_package_benefits')
export class AdventurePackageBenefit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  package_tier_id: string;

  @Column({ type: 'varchar', length: 255 })
  benefit_text: string;

  @Column({ type: 'int', default: 0 })
  display_order: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @ManyToOne(() => AdventurePackageTier, (t) => t.benefits, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'package_tier_id' })
  package_tier: AdventurePackageTier;
}
