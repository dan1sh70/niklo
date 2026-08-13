import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('driver_bank_details')
export class DriverBankDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  driver_id: string;

  @Column({ type: 'varchar', length: 100 })
  account_holder_name: string;

  @Column({ type: 'varchar', length: 100 })
  bank_name: string;

  @Column({ type: 'varchar', length: 50 })
  account_number: string;

  @Column({ type: 'varchar', length: 20 })
  ifsc_code: string;

  @Column({ type: 'varchar', length: 50 })
  account_type: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
