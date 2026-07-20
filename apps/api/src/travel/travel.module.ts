import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CampaignsModule } from '../campaigns/campaigns.module';
import { TravelController } from './travel.controller';
import { TravelService } from './travel.service';

@Module({
  imports: [AuthModule, CampaignsModule],
  controllers: [TravelController],
  providers: [TravelService]
})
export class TravelModule {}
