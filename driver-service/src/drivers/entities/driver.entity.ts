import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum DriverStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('drivers')
export class Driver {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  user_id: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  vehicle_type: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  vehicle_number: string;

  @Column({
    type: 'enum',
    enum: DriverStatus,
    default: DriverStatus.PENDING,
  })
  status: DriverStatus;

  @Column({ type: 'boolean', default: false })
  is_online: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
