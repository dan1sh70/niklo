import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('package_settlement_items')
export class PackageSettlementItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  settlement_id: string;

  @Column()
  booking_id: string;

  @Column()
  package_title: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  booking_gross: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  commission_share: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  tds_share: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  net_share: number;
}
