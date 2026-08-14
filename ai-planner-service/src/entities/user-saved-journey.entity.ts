import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Unique } from 'typeorm';

@Entity('user_saved_journeys')
@Unique(['user_id', 'journey_id'])
export class UserSavedJourney {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'varchar', length: 100 })
  journey_id: string;

  @Column({ type: 'varchar', length: 100 })
  search_id: string;

  @Column({ type: 'varchar', length: 255 })
  source_name: string;

  @Column({ type: 'varchar', length: 255 })
  destination_name: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 50 })
  category: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  total_fare: number;

  @Column({ type: 'varchar', length: 50 })
  total_duration: string;

  @Column({ type: 'int', default: 0 })
  total_transfers: number;

  @Column({ type: 'jsonb' })
  journey_payload: any;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
