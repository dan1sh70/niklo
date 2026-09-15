import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('seo_blogs')
export class SeoBlog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  content: string;

  @Column({ nullable: true })
  source_city: string;

  @Column({ nullable: true })
  destination_city: string;

  @Column()
  meta_title: string;

  @Column('text')
  meta_description: string;

  @Column('simple-array')
  keywords: string[];

  @Column({ nullable: true })
  cover_image_url: string;

  @Column({ default: false })
  is_published: boolean;

  @Column({ default: 0 })
  views: number;

  @Column('int')
  seo_score: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
