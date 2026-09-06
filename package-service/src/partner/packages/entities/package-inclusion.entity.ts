import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('package_inclusions')
export class PackageInclusion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  package_id: string;

  @Column()
  item_title: string;

  @Column({ default: true })
  is_included: boolean;

  @Column({ default: 'GENERAL' })
  category: string;
}
