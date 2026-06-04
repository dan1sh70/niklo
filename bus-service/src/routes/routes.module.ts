import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Route } from './entities/route.entity';
import { BoardingPoint } from './entities/boarding-point.entity';
import { DroppingPoint } from './entities/dropping-point.entity';
import { RoutesService } from './routes.service';
import { RoutesController } from './routes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Route, BoardingPoint, DroppingPoint])],
  controllers: [RoutesController],
  providers: [RoutesService],
  exports: [RoutesService],
})
export class RoutesModule {}
