import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('journey_alerts')
export class JourneyAlert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  user_id: string;

  @Column({ type: 'boolean', default: true })
  departure_reminder: boolean;

  @Column({ type: 'boolean', default: true })
  price_drop_alert: boolean;

  @Column({ type: 'boolean', default: true })
  delay_notification: boolean;

  @Column({ type: 'boolean', default: false })
  boarding_gate_update: boolean;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
