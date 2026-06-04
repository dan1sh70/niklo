import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Operator } from './entities/operator.entity';
import { OperatorsService } from './operators.service';
import { OperatorsController } from './operators.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Operator])],
  controllers: [OperatorsController],
  providers: [OperatorsService],
  exports: [OperatorsService],
})
export class OperatorsModule {}
