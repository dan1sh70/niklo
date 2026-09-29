import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Operator } from './entities/operator.entity';
import { OperatorReview } from './entities/operator-review.entity';
import { OperatorsService } from './operators.service';
import { OperatorsController } from './operators.controller';

import { Bus } from '../buses/entities/bus.entity';
import { Schedule } from '../schedules/entities/schedule.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Operator, OperatorReview, Bus, Schedule])],
  controllers: [OperatorsController],
  providers: [OperatorsService],
  exports: [OperatorsService],
})
export class OperatorsModule {}
