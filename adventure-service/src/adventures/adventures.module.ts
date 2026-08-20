import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdventuresService } from './adventures.service';
import { AdventuresController } from './adventures.controller';
import { TravelAdventure } from './entities/adventure.entity';
import { AdventureReview } from './entities/adventure-review.entity';
import { AdventureSlot } from './entities/adventure-slot.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TravelAdventure, AdventureReview, AdventureSlot])],
  controllers: [AdventuresController],
  providers: [AdventuresService],
})
export class AdventuresModule {}
