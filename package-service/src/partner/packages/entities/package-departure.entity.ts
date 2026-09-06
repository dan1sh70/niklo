import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('package_departures')
export class PackageDeparture {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  package_id: string;

  @Column({ type: 'date' })
  departure_date: string;

  @Column({ type: 'date' })
  return_date: string;

  @Column({ type: 'int' })
  total_seats: number;

  @Column({ type: 'int', default: 0 })
  booked_seats: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  price_override: number;

  @Column({ default: 'AVAILABLE' })
  status: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
