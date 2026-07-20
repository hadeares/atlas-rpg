import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CampaignsModule } from '../campaigns/campaigns.module';
import { CreatureTemplate } from '../database/entities/creature-template.entity';
import { CreaturesController } from './creatures.controller';
import { CreaturesService } from './creatures.service';

@Module({
  imports: [TypeOrmModule.forFeature([CreatureTemplate]), CampaignsModule],
  controllers: [CreaturesController],
  providers: [CreaturesService],
  exports: [CreaturesService]
})
export class CreaturesModule {}
