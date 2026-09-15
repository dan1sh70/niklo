import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SeoBlog } from './entities/seo-blog.entity';
import { CreateSeoBlogDto, UpdateSeoBlogDto } from './dto/seo-blog.dto';

@Injectable()
export class SeoService {
  constructor(
    @InjectRepository(SeoBlog)
    private readonly blogRepo: Repository<SeoBlog>,
  ) {}

  async findAll(): Promise<SeoBlog[]> {
    return this.blogRepo.find({ order: { created_at: 'DESC' } });
  }

  async findOne(id: string): Promise<SeoBlog> {
    const blog = await this.blogRepo.findOneBy({ id });
    if (!blog) throw new NotFoundException(`Blog ${id} not found`);
    return blog;
  }

  async create(dto: CreateSeoBlogDto): Promise<SeoBlog> {
    const blog = this.blogRepo.create(dto);
    return this.blogRepo.save(blog);
  }

  async update(id: string, dto: UpdateSeoBlogDto): Promise<SeoBlog> {
    const blog = await this.findOne(id);
    Object.assign(blog, dto);
    return this.blogRepo.save(blog);
  }

  async remove(id: string): Promise<void> {
    const blog = await this.findOne(id);
    await this.blogRepo.remove(blog);
  }
}
