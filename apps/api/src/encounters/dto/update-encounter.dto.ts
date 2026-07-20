import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateEncounterDto {
  @IsOptional()
  @IsString()
  @Length(3, 180)
  title?: string;

  @IsOptional()
  @IsString()
  @Length(10, 10000)
  publicNarration?: string;

  @IsOptional()
  @IsString()
  @Length(10, 10000)
  masterSummary?: string;

  @IsOptional()
  @IsString()
  @Length(0, 5000)
  resolutionNotes?: string;
}
