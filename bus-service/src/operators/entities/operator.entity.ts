import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Bus } from '../../buses/entities/bus.entity';
import { Schedule } from '../../schedules/entities/schedule.entity';

@Entity('operators')
export class Operator {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Auth user who owns this operator account. Set from the JWT when the
   * operator profile is created; without it there is no way to prove a caller
   * is allowed to see a trip's passenger manifest. Nullable because operators
   * seeded or created before this column existed have no owner.
   */
  @Index()
  @Column({ type: 'uuid', nullable: true })
  user_id: string | null;

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

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @OneToMany(() => Bus, (bus) => bus.operator)
  buses: Bus[];

  @OneToMany(() => Schedule, (schedule) => schedule.operator)
  schedules: Schedule[];
}
