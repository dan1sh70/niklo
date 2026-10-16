import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('hotel_bank_details')
export class HotelBankDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  partner_id: string;

  @Column({ type: 'uuid', nullable: true })
  hotel_id: string;

  @Column({ type: 'varchar', length: 150 })
  account_holder_name: string;

  @Column({ type: 'varchar', length: 100 })
  bank_name: string;

  @Column({ type: 'varchar', length: 50 })
  account_number: string;

  @Column({ type: 'varchar', length: 20 })
  ifsc_code: string;

  @Column({ type: 'varchar', length: 30, default: 'Current' })
  account_type: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  gst_number: string;

  @Column({ type: 'boolean', default: false })
  is_verified: boolean;

  @Column({ type: 'boolean', default: true })
  is_primary: boolean;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;
}
