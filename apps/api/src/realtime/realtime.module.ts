import { Global, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CampaignsModule } from '../campaigns/campaigns.module';
import { CampaignsGateway } from './campaigns.gateway';

@Global()
@Module({
  imports: [AuthModule, CampaignsModule],
  providers: [CampaignsGateway],
  exports: [CampaignsGateway]
})
export class RealtimeModule {}
