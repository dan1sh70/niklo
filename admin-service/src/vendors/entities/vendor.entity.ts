import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('vendors')
export class Vendor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  company_name: string;

  @Column()
  owner_name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  gst_number: string;

  @Column({ default: 'Pending' })
  status: string; // Active, Pending, Suspended

  @Column({ nullable: true })
  plan: string; // Starter, Pro, Enterprise

  @Column({ nullable: true })
  logo_url: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
