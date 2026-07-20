import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CampaignMember } from '../database/entities/campaign-member.entity';
import { Campaign } from '../database/entities/campaign.entity';
import { User } from '../database/entities/user.entity';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';

@Module({
  imports: [TypeOrmModule.forFeature([Campaign, CampaignMember, User]), AuthModule],
  controllers: [CampaignsController],
  providers: [CampaignsService],
  exports: [CampaignsService]
})
export class CampaignsModule {}
