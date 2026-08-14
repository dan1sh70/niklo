import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('ai_journey_plans')
export class AiJourneyPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  user_id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  search_id: string;

  @Column({ type: 'varchar', length: 255 })
  source_name: string;

  @Column({ type: 'numeric', precision: 10, scale: 6 })
  source_lat: number;

  @Column({ type: 'numeric', precision: 10, scale: 6 })
  source_lng: number;

  @Column({ type: 'varchar', length: 255 })
  destination_name: string;

  @Column({ type: 'numeric', precision: 10, scale: 6 })
  destination_lat: number;

  @Column({ type: 'numeric', precision: 10, scale: 6 })
  destination_lng: number;

  @Column({ type: 'date' })
  travel_date: string;

  @Column({ type: 'int', default: 1 })
  passengers_count: number;

  @Column({ type: 'jsonb', default: [] })
  options_json: any;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @Column({ type: 'timestamptz', default: () => "NOW() + INTERVAL '24 hours'" })
  expires_at: Date;
}
