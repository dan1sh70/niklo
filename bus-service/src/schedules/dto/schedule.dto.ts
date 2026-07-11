import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsInt,
  IsUUID,
  IsOptional,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { ScheduleStatus } from '../entities/schedule.entity';

export class CreateScheduleDto {
  @IsUUID('all')
  @IsNotEmpty()
  route_id: string;

  @IsUUID('all')
  @IsNotEmpty()
  bus_id: string;

  @IsUUID('all')
  @IsNotEmpty()
  operator_id: string;

  @IsString()
  @IsNotEmpty()
  departure_time: string; // HH:MM format

  @IsString()
  @IsNotEmpty()
  arrival_time: string; // HH:MM format

  @IsDateString()
  departure_date: string; // YYYY-MM-DD

  @IsNumber()
  base_fare: number;

  @IsInt()
  available_seats: number;
}

export class UpdateScheduleDto {
  @IsOptional()
  @IsString()
  departure_time?: string;

  @IsOptional()
  @IsString()
  arrival_time?: string;

  @IsOptional()
  @IsDateString()
  departure_date?: string;

  @IsOptional()
  @IsNumber()
  base_fare?: number;

  @IsOptional()
  @IsInt()
  available_seats?: number;

  @IsOptional()
  @IsEnum(ScheduleStatus)
  status?: ScheduleStatus;
}
