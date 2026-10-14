import { PartialType } from '@nestjs/swagger';
import { CreateBusDto } from './create-bus.dto';
import { IsOptional, IsBoolean, IsUUID } from 'class-validator';

export class UpdateBusDto extends PartialType(CreateBusDto) {
  @IsOptional()
  @IsUUID('all')
  operator_id?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

