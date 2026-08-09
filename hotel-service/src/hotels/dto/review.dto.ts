import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';

export class CreateReviewDto {
  @IsString()
  @Length(2, 120)
  title: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @Length(3, 2000)
  comment: string;

  /** Display name; falls back to the token's name when omitted. */
  @IsOptional()
  @IsString()
  @Length(2, 80)
  reviewerName?: string;
}

export class ReplyToReviewDto {
  @IsString()
  @Length(2, 1000)
  reply: string;
}

/** Ops-only payload for handing an ownerless property to a partner account. */
export class TransferOwnershipDto {
  @IsString()
  @Length(1, 100)
  ownerId: string;
}

export class UpsertOfferDto {
  @IsString()
  @Length(2, 120)
  title: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;

  @IsOptional()
  @IsString()
  cta?: string;

  @IsOptional()
  @IsString()
  imagePath?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(90)
  discountPercent?: number;

  /** ISO timestamp; an offer past this point stops being served. */
  @IsOptional()
  @IsString()
  expiresAt?: string;

  /** ISO timestamp the offer starts running from. */
  @IsOptional()
  @IsString()
  startsAt?: string;

  /** How the discount is expressed: `percentage` or `flat`. */
  @IsOptional()
  @IsString()
  offerType?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/** Partial edit of a live offer — used by the partner's on/off switch. */
export class UpdateOfferDto {
  @IsOptional()
  @IsString()
  @Length(2, 120)
  title?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(90)
  discountPercent?: number;

  @IsOptional()
  @IsString()
  expiresAt?: string;

  @IsOptional()
  @IsString()
  startsAt?: string;

  @IsOptional()
  @IsString()
  offerType?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
