import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Route } from './route.entity';

@Entity('dropping_points')
export class DroppingPoint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  route_id: string;

  @ManyToOne(() => Route, (route) => route.dropping_points, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'route_id' })
  route: Route;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  landmark: string;

  @Column({ type: 'numeric', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'numeric', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ type: 'varchar', length: 15, nullable: true })
  contact_phone: string;

  @Column({ type: 'int', default: 0 })
  order_index: number;
}
