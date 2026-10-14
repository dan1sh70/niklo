import { PartialType } from '@nestjs/swagger';
import { CreateBusDto } from './create-bus.dto';
import { IsOptional, IsBoolean, Matches } from 'class-validator';

export class UpdateBusDto extends PartialType(CreateBusDto) {
  @IsOptional()
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
    message: 'operator_id must be a UUID',
  })
  operator_id?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

