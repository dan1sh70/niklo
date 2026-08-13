import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HotelsService } from './hotels.service';
import { HotelsController } from './hotels.controller';
import { Hotel } from './entities/hotel.entity';
import { RoomType } from './entities/room-type.entity';
import { Review } from './entities/review.entity';

import { PartnerOffer } from './entities/partner-offer.entity';
import { PartnerReviewReply } from './entities/partner-review-reply.entity';
import { PartnerCalendar } from './entities/partner-calendar.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Hotel, RoomType, Review, PartnerOffer, PartnerReviewReply, PartnerCalendar])],
  controllers: [HotelsController],
  providers: [HotelsService],
})
export class HotelsModule {}
