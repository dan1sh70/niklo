import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsInt,
  IsOptional,
  IsObject,
  IsUUID,
  Matches,
} from 'class-validator';
import { BusType } from '../entities/bus.entity';

export class CreateBusDto {
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
    message: 'operator_id must be a UUID',
  })
  @IsNotEmpty()
  operator_id: string;

  @IsString()
  @IsNotEmpty()
  registration_number: string;

  @IsEnum(BusType)
  bus_type: BusType;

  @IsInt()
  total_seats: number;

  @IsOptional()
  @IsObject()
  amenities?: Record<string, boolean>;
}
