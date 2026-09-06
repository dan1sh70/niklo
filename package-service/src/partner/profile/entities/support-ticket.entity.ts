import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('support_tickets')
export class SupportTicket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  ticket_ref: string;

  @Column()
  partner_id: string;

  @Column()
  category: string;

  @Column()
  subject: string;

  @Column('text')
  description: string;

  @Column({ default: 'MEDIUM' })
  priority: string;

  @Column({ default: 'OPEN' })
  status: string;

  @Column('text', { array: true, default: [] })
  attachment_urls: string[];

  @Column({ nullable: true })
  assigned_agent_id: string;

  @Column({ type: 'text', nullable: true })
  resolution_notes: string;

  @Column({ type: 'timestamptz', nullable: true })
  resolved_at: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
