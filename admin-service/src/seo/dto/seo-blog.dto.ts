import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsArray, IsInt } from 'class-validator';

export class CreateSeoBlogDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  source_city?: string;

  @IsString()
  @IsOptional()
  destination_city?: string;

  @IsString()
  @IsNotEmpty()
  meta_title: string;

  @IsString()
  @IsNotEmpty()
  meta_description: string;

  @IsArray()
  keywords: string[];

  @IsString()
  @IsOptional()
  cover_image_url?: string;

  @IsBoolean()
  @IsOptional()
  is_published?: boolean;

  @IsInt()
  @IsOptional()
  seo_score?: number;
}

export class UpdateSeoBlogDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  source_city?: string;

  @IsString()
  @IsOptional()
  destination_city?: string;

  @IsString()
  @IsOptional()
  meta_title?: string;

  @IsString()
  @IsOptional()
  meta_description?: string;

  @IsArray()
  @IsOptional()
  keywords?: string[];

  @IsString()
  @IsOptional()
  cover_image_url?: string;

  @IsBoolean()
  @IsOptional()
  is_published?: boolean;

  @IsInt()
  @IsOptional()
  seo_score?: number;
}
