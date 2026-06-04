import { PartialType } from '@nestjs/swagger';
import { CreateRouteDto } from './create-route.dto';
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateRouteDto extends PartialType(CreateRouteDto) {
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
