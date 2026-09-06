import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('package_booking_travelers')
export class PackageBookingTraveler {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  booking_id: string;

  @Column()
  full_name: string;

  @Column({ type: 'int' })
  age: number;

  @Column()
  gender: string;

  @Column({ default: false })
  is_primary: boolean;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  id_proof_type: string;

  @Column({ nullable: true })
  id_proof_number: string;
}
