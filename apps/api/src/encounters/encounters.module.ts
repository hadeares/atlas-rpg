import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CampaignEvent } from '../database/entities/campaign-event.entity';
import { Hex } from '../database/entities/hex.entity';
import { RandomEncounter } from '../database/entities/random-encounter.entity';
import { CampaignsModule } from '../campaigns/campaigns.module';
import { CreaturesModule } from '../creatures/creatures.module';
import { EncountersController } from './encounters.controller';
import { EncountersService } from './encounters.service';

@Module({
  imports: [TypeOrmModule.forFeature([RandomEncounter, Hex, CampaignEvent]), CampaignsModule, CreaturesModule],
  controllers: [EncountersController],
  providers: [EncountersService]
})
export class EncountersModule {}
