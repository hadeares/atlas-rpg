import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CampaignsModule } from '../campaigns/campaigns.module';
import { TimeController } from './time.controller';
import { TimeService } from './time.service';

@Module({
  imports: [AuthModule, CampaignsModule],
  controllers: [TimeController],
  providers: [TimeService]
})
export class TimeModule {}
