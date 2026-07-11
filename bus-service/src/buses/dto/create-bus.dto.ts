import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsInt,
  IsOptional,
  IsObject,
  IsUUID,
} from 'class-validator';
import { BusType } from '../entities/bus.entity';

export class CreateBusDto {
  @IsUUID('all')
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
