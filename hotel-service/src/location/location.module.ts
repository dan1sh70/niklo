import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';
import { Hotel } from '../hotels/entities/hotel.entity';

@Module({
  // Suggestions are matched against real properties, so this module reads the
  // hotel table directly rather than serving a fixed list.
  imports: [TypeOrmModule.forFeature([Hotel])],
  controllers: [LocationController],
  providers: [LocationService],
})
export class LocationModule {}
