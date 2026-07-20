import { IsEnum } from 'class-validator';
import { CampaignMemberRole } from '../../database/entities/campaign-member.entity';

export class UpdateCampaignMemberDto {
  @IsEnum(CampaignMemberRole)
  role: CampaignMemberRole;
}
