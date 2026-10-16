import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Bus } from '../../buses/entities/bus.entity';
import { Schedule } from '../../schedules/entities/schedule.entity';

@Entity('operators')
export class Operator {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  logo_url: string;

  @Column({ type: 'varchar', length: 15, nullable: true })
  contact_phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  contact_email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  gst_number: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'numeric', precision: 3, scale: 2, default: 4.5 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  ratings_count: number;

  @Column({ type: 'text', nullable: true })
  business_address: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  pan_number: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  license_number: string;

  @Column({ type: 'varchar', length: 30, default: 'APPROVED' })
  verification_status: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  bank_name: string;

  @Column({ type: 'text', nullable: true })
  account_number_encrypted: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  ifsc_code: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  account_holder_name: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @OneToMany(() => Bus, (bus) => bus.operator)
  buses: Bus[];

  @OneToMany(() => Schedule, (schedule) => schedule.operator)
  schedules: Schedule[];
}
