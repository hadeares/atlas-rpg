import { IsEmail, IsEnum } from 'class-validator';
import { CampaignMemberRole } from '../../database/entities/campaign-member.entity';

export class AddCampaignMemberDto {
  @IsEmail()
  email: string;

  @IsEnum(CampaignMemberRole)
  role: CampaignMemberRole;
}
