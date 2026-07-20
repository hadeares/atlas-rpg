import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateCampaignDto {
  @IsOptional()
  @IsString()
  @Length(3, 160)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(0, 2000)
  description?: string;
}
