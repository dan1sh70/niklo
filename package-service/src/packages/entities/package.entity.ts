import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('travel_packages')
export class TravelPackage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'int' })
  duration_days: number;

  @Column({ type: 'int' })
  duration_nights: number;

  @Column({ type: 'jsonb', default: [] })
  destinations: string[];

  @Column({ type: 'jsonb', default: [] })
  inclusions: string[];

  /**
   * What the customer app groups packages by on its browse screen.
   *
   * Nullable, because every package that already exists predates the column
   * and has nothing sensible to backfill with — `GET /categories` skips those
   * rather than reporting an empty category.
   */
  @Column({ type: 'varchar', length: 64, nullable: true })
  category: string | null;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
