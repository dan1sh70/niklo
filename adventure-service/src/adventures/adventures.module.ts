import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdventuresService } from './adventures.service';
import { AdventuresController } from './adventures.controller';
import { TravelAdventure } from './entities/adventure.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TravelAdventure])],
  controllers: [AdventuresController],
  providers: [AdventuresService],
})
export class AdventuresModule {}
