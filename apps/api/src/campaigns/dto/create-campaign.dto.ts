import { IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export class CreateCampaignDto {
  @IsString()
  @Length(3, 160)
  name: string;

  @IsOptional()
  @IsString()
  @Length(0, 2000)
  description?: string;

  @IsString()
  @Length(3, 120)
  seed: string;

  @IsInt()
  @Min(3)
  @Max(40)
  radius: number;
}
