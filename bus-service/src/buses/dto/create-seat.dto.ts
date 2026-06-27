import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  IsBoolean,
} from 'class-validator';
import { Deck, SeatType } from '../entities/seat-layout.entity';
import { Type } from 'class-transformer';
import { ValidateNested, IsArray } from 'class-validator';

export class CreateSeatDto {
  @IsString()
  @IsNotEmpty()
  seat_number: string;

  @IsEnum(Deck)
  deck: Deck;

  @IsInt()
  row: number;

  @IsInt()
  column: number;

  @IsEnum(SeatType)
  seat_type: SeatType;

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
