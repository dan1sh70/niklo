import { IsString, IsNotEmpty, IsNumber, IsOptional, IsObject, IsArray, IsBoolean } from 'class-validator';

export class LocationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;
}

export class PreferencesDto {
  @IsOptional()
  @IsNumber()
  max_transfers?: number;

  @IsOptional()
  @IsArray()
  preferred_modes?: string[];

  @IsOptional()
  @IsString()
  sort_by?: string;
}

export class PlanJourneyDto {
  @IsObject()
  @IsNotEmpty()
  source_location: LocationDto;

  @IsObject()
  @IsNotEmpty()
  destination_location: LocationDto;

  @IsString()
  @IsNotEmpty()
  travel_date: string;

  @IsNumber()
  @IsNotEmpty()
  passengers_count: number;

  @IsOptional()
  @IsObject()
  preferences?: PreferencesDto;
}

export class BookMultiModalDto {
  @IsString()
  @IsNotEmpty()
  search_id: string;

  @IsString()
  @IsNotEmpty()
  journey_id: string;

  @IsArray()
  @IsNotEmpty()
  passengers: any[];

  @IsArray()
  @IsOptional()
  selected_bus_seats?: string[];

  @IsString()
  @IsOptional()
  contact_email?: string;

  @IsString()
  @IsOptional()
  contact_phone?: string;
}

export class SaveJourneyDto {
  @IsString()
  @IsNotEmpty()
  search_id: string;

  @IsString()
  @IsNotEmpty()
  journey_id: string;
}

export class UpdateAlertsDto {
  @IsBoolean()
  @IsOptional()
  departure_reminder?: boolean;

  @IsBoolean()
  @IsOptional()
  price_drop_alert?: boolean;

  @IsBoolean()
  @IsOptional()
  delay_notification?: boolean;

  @IsBoolean()
  @IsOptional()
  boarding_gate_update?: boolean;
}

export class OptimizeScheduleDto {
  @IsString()
  @IsNotEmpty()
  origin: string;

  @IsString()
  @IsNotEmpty()
  destination: string;

  @IsString()
  @IsNotEmpty()
  scheduled_departure: string;
}
