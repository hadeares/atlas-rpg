import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateHexLoreDto {
  @IsOptional()
  @IsString()
  @Length(3, 160)
  title?: string;

  @IsOptional()
  @IsString()
  @Length(0, 5000)
  overview?: string;

  @IsOptional()
  @IsString()
  @Length(0, 5000)
  history?: string;

  @IsOptional()
  @IsString()
  @Length(0, 5000)
  playerSummary?: string;

  @IsOptional()
  @IsString()
  @Length(0, 5000)
  secrets?: string;
}
