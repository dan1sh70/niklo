import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PackagesService } from './packages.service';
import { PackagesController } from './packages.controller';
import { TravelPackage } from './entities/package.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TravelPackage])],
  controllers: [PackagesController],
  providers: [PackagesService],
})
export class PackagesModule {}
