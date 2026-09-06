import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('faq_articles')
export class FaqArticle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  category: string;

  @Column()
  question: string;

  @Column('text')
  answer: string;

  @Column({ type: 'int', default: 0 })
  sort_order: number;

  @Column({ default: true })
  is_active: boolean;
}
