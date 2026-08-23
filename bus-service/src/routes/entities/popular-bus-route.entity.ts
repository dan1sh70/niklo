import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  Index,
} from 'typeorm';

@Entity('popular_bus_routes')
@Unique(['source', 'destination'])
export class PopularBusRoute {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  source: string;

  @Column({ length: 100 })
  destination: string;

  @Column({ length: 50 })
  duration: string;

  @Column('decimal', { precision: 10, scale: 2, name: 'start_price' })
  start_price: number;

  @Column({ length: 50, default: '🔥 Popular' })
  tag: string;

  @Column({ type: 'int', default: 0 })
  @Index()
  priority: number;

  @Column({ type: 'boolean', default: true })
  @Index()
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
