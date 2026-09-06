import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('support_ticket_messages')
export class SupportTicketMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  ticket_id: string;

  @Column()
  sender_type: string;

  @Column()
  sender_id: string;

  @Column('text')
  message: string;

  @Column({ nullable: true })
  attachment_url: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
