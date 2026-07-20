import { IsString, Length } from 'class-validator';

export class JoinCampaignDto {
  @IsString()
  @Length(4, 12)
  inviteCode: string;
}
