import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/// Matches the `type` values the app's address form offers. The Home/Work
/// shortcuts on the location search screen look up `type == 'home'` and
/// `type == 'work'` by name, so these strings are load-bearing.
export const ADDRESS_TYPES = ['home', 'work', 'other'] as const;

export type AddressType = (typeof ADDRESS_TYPES)[number];

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateAddressDto {
  @IsString()
  @IsIn(ADDRESS_TYPES, {
    message: `type must be one of: ${ADDRESS_TYPES.join(', ')}`,
  })
  type: AddressType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  @Transform(trim)
  label: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  @Transform(trim)
  full_address: string;

  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @IsLongitude()
  longitude?: number;

  /// Optional. The first address a user saves is made default regardless — an
  /// account with addresses and no default breaks the Home/Work shortcuts.
  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}

/// Every field optional so the edit form can save one changed line without
/// blanking the rest. `undefined` means "not sent" and is left alone.
export class UpdateAddressDto {
  @IsOptional()
  @IsString()
  @IsIn(ADDRESS_TYPES, {
    message: `type must be one of: ${ADDRESS_TYPES.join(', ')}`,
  })
  type?: AddressType;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  @Transform(trim)
  label?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  @Transform(trim)
  full_address?: string;

  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}
