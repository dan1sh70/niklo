import { PartialType } from '@nestjs/swagger';
import { CreateOperatorDto } from './create-operator.dto';
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateOperatorDto extends PartialType(CreateOperatorDto) {
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
