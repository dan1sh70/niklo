import { PartialType } from '@nestjs/mapped-types';
import { CreateAdventureDto } from './create-adventure.dto';

export class UpdateAdventureDto extends PartialType(CreateAdventureDto) {}
