import {
  IsArray,
  IsString,
  IsOptional,
  IsUUID,
  ArrayNotEmpty,
  ValidateNested,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SeatAssignmentDto {
  @IsString()
  seat_number: string;

  @IsOptional()
  @IsIn(['M', 'F', 'O'])
  gender?: string;
}

export class BookSeatsDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => SeatAssignmentDto)
  seats: SeatAssignmentDto[];

  @IsOptional()
  @IsUUID('all')
  booking_id?: string;

  @IsOptional()
  @IsUUID('all')
  user_id?: string;
}

export class ReleaseSeatsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  seat_numbers: string[];

  @IsOptional()
  @IsUUID('all')
  booking_id?: string;
}
