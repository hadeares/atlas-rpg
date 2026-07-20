import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CampaignsModule } from '../campaigns/campaigns.module';
import { CampaignEvent } from '../database/entities/campaign-event.entity';
import { Hex } from '../database/entities/hex.entity';
import { HexesController } from './hexes.controller';
import { HexesService } from './hexes.service';

@Module({
  imports: [TypeOrmModule.forFeature([Hex, CampaignEvent]), AuthModule, CampaignsModule],
  controllers: [HexesController],
  providers: [HexesService]
})
export class HexesModule {}
