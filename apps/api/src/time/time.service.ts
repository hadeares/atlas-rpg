import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CampaignsService } from '../campaigns/campaigns.service';
import { CampaignEvent } from '../database/entities/campaign-event.entity';
import { Campaign } from '../database/entities/campaign.entity';
import { Hex } from '../database/entities/hex.entity';
import { DayPeriod } from '../database/entities/day-period.enum';
import { HexLore } from '../hexes/generation/lore-generator';
import { transitionLocalSimulation } from './local-simulation';

const periodOrder = [DayPeriod.MANHA, DayPeriod.TARDE, DayPeriod.ANOITECER, DayPeriod.NOITE];

@Injectable()
export class TimeService {
  constructor(
    private readonly campaignsService: CampaignsService,
    private readonly dataSource: DataSource
  ) {}

  async advance(userId: string, campaignId: string, steps = 1) {
    await this.campaignsService.ensureMaster(userId, campaignId);

    return this.dataSource.transaction(async (manager) => {
      const campaign = await manager
        .getRepository(Campaign)
        .createQueryBuilder('campaign')
        .setLock('pessimistic_write')
        .where('campaign.id = :campaignId', { campaignId })
        .getOneOrFail();

      const previousDay = campaign.currentDay;
      const previousPeriod = campaign.currentPeriod;

      for (let index = 0; index < steps; index += 1) {
        const currentIndex = periodOrder.indexOf(campaign.currentPeriod);
        if (currentIndex === periodOrder.length - 1) {
          campaign.currentPeriod = DayPeriod.MANHA;
          campaign.currentDay += 1;
        } else {
          campaign.currentPeriod = periodOrder[currentIndex + 1];
        }
      }

      const currentHex = await manager.findOne(Hex, {
        where: { campaignId, q: campaign.currentQ, r: campaign.currentR }
      });
      const lore = currentHex?.state?.lore as HexLore | undefined;
      campaign.simulationState = transitionLocalSimulation(campaign, lore, previousDay, previousPeriod);
      campaign.version += 1;
      const savedCampaign = await manager.save(campaign);
      await manager.save(manager.create(CampaignEvent, {
        campaignId,
        type: 'TIME_ADVANCED',
        day: savedCampaign.currentDay,
        period: savedCampaign.currentPeriod,
        payload: {
          steps,
          from: { day: previousDay, period: previousPeriod },
          to: { day: savedCampaign.currentDay, period: savedCampaign.currentPeriod },
          localWeather: (savedCampaign.simulationState as Record<string, unknown>).currentWeather,
          automaticEncounterGenerated: false
        }
      }));
      return savedCampaign;
    });
  }
}
