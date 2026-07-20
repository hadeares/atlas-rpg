import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { CreatureSource, CreatureTheme } from '../../database/entities/creature-template.entity';

export class ListCreaturesQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(CreatureSource)
  source?: CreatureSource;

  @IsOptional()
  @IsEnum(CreatureTheme)
  theme?: CreatureTheme;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minCr?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Max(30)
  maxCr?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;
}
