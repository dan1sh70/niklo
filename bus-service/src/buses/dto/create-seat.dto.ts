import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsInt,
  IsOptional,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { SeatType } from '../entities/seat-layout.entity';
import { Type } from 'class-transformer';
import { ValidateNested, IsArray } from 'class-validator';

export class CreateSeatDto {
  @IsString()
  @IsNotEmpty()
  seat_number: string;

  @IsBoolean()
  is_upper_deck: boolean;

  @IsInt()
  row_num: number;

  @IsInt()
  col_num: number;

  @IsEnum(SeatType)
  seat_type: SeatType;

  @IsNumber()
  @IsOptional()
  price_offset?: number;

  @IsOptional()
  @IsBoolean()
  is_available?: boolean;
}

export class BulkCreateSeatsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSeatDto)
  seats: CreateSeatDto[];
}
