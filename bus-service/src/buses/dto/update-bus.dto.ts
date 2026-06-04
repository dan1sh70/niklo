import { PartialType } from '@nestjs/swagger';
import { CreateBusDto } from './create-bus.dto';
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateBusDto extends PartialType(CreateBusDto) {
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
