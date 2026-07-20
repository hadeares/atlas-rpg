import { ArrayMaxSize, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateCustomCreatureDto } from './create-custom-creature.dto';

export class ImportCustomCreaturesDto {
  @IsArray()
  @ArrayMaxSize(1000)
  @ValidateNested({ each: true })
  @Type(() => CreateCustomCreatureDto)
  creatures: CreateCustomCreatureDto[];
}
