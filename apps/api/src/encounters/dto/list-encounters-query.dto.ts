import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { EncounterStatus } from '../../database/entities/random-encounter.entity';

export class ListEncountersQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  q?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  r?: number;

  @IsOptional()
  @IsEnum(EncounterStatus)
  status?: EncounterStatus;
}
