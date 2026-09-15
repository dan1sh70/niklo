import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeoController } from './seo.controller';
import { SeoService } from './seo.service';
import { SeoBlog } from './entities/seo-blog.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SeoBlog])],
  controllers: [SeoController],
  providers: [SeoService],
  exports: [SeoService],
})
export class SeoModule {}
