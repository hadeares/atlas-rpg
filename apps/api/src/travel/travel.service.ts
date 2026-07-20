import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CampaignsService } from '../campaigns/campaigns.service';
import { CampaignEvent } from '../database/entities/campaign-event.entity';
import { Campaign } from '../database/entities/campaign.entity';
import { DayPeriod } from '../database/entities/day-period.enum';
import { DiscoveryStatus, Hex } from '../database/entities/hex.entity';
import { generateVisitState, HexLore } from '../hexes/generation/lore-generator';
import { CampaignsGateway } from '../realtime/campaigns.gateway';
import { setTravelWeather } from '../time/local-simulation';
import { MovePartyDto } from './dto/move-party.dto';

const periods = [DayPeriod.MANHA, DayPeriod.TARDE, DayPeriod.ANOITECER, DayPeriod.NOITE];
const discoveryRank: Record<DiscoveryStatus, number> = {
  [DiscoveryStatus.DESCONHECIDO]: 0,
  [DiscoveryStatus.AVISTADO]: 1,
  [DiscoveryStatus.ATRAVESSADO]: 2,
  [DiscoveryStatus.EXPLORADO]: 3,
  [DiscoveryStatus.MAPEADO]: 4
};

@Injectable()
export class TravelService {
  constructor(
    private readonly campaignsService: CampaignsService,
    private readonly dataSource: DataSource,
    private readonly gateway: CampaignsGateway
  ) {}

  async move(userId: string, campaignId: string, dto: MovePartyDto) {
    await this.campaignsService.ensureMaster(userId, campaignId);

    const result = await this.dataSource.transaction(async (manager) => {
      const campaign = await manager.getRepository(Campaign)
        .createQueryBuilder('campaign')
        .setLock('pessimistic_write')
        .where('campaign.id = :campaignId', { campaignId })
        .getOneOrFail();

      if (hexDistance(campaign.currentQ, campaign.currentR, dto.q, dto.r) !== 1) {
        throw new BadRequestException('O grupo só pode avançar para um hexágono adjacente.');
      }

      const destination = await manager.findOne(Hex, { where: { campaignId, q: dto.q, r: dto.r } });
      if (!destination) throw new NotFoundException('Hexágono de destino não encontrado.');

      const previousPosition = { q: campaign.currentQ, r: campaign.currentR };
      campaign.currentQ = dto.q;
      campaign.currentR = dto.r;
      advancePeriod(campaign);
      campaign.version += 1;

      if (discoveryRank[destination.discoveryStatus] < discoveryRank[DiscoveryStatus.ATRAVESSADO]) {
        destination.discoveryStatus = DiscoveryStatus.ATRAVESSADO;
      }

      const visitCount = Number(destination.state.visitCount ?? 0) + 1;
      const lore = destination.state.lore as HexLore;
      const lastVisit = generateVisitState(campaign.seed, destination.q, destination.r, campaign.currentDay, campaign.currentPeriod, lore, visitCount);
      destination.state = { ...destination.state, visitCount, lastVisit };
      campaign.simulationState = setTravelWeather(campaign, lastVisit.weather, lastVisit.visibility);
      if (!destination.publicName) destination.publicName = lore.title;

      await manager.save(campaign);
      await manager.save(destination);
      await manager.save(manager.create(CampaignEvent, {
        campaignId,
        type: 'PARTY_MOVED',
        day: campaign.currentDay,
        period: campaign.currentPeriod,
        payload: {
          from: previousPosition,
          to: { q: destination.q, r: destination.r },
          weather: lastVisit.weather,
          environmentalSign: lastVisit.environmentalSign
        }
      }));

      return { campaign, destination, changedHexes: [destination], visit: lastVisit };
    });
    this.gateway.emitCampaignChanged(campaignId, 'PARTY_MOVED');
    return result;
  }

  async explore(userId: string, campaignId: string) {
    await this.campaignsService.ensureMaster(userId, campaignId);

    const result = await this.dataSource.transaction(async (manager) => {
      const campaign = await manager.getRepository(Campaign)
        .createQueryBuilder('campaign')
        .setLock('pessimistic_write')
        .where('campaign.id = :campaignId', { campaignId })
        .getOneOrFail();
      const hex = await manager.findOne(Hex, { where: { campaignId, q: campaign.currentQ, r: campaign.currentR } });
      if (!hex) throw new NotFoundException('Hexágono atual não encontrado.');

      if (discoveryRank[hex.discoveryStatus] < discoveryRank[DiscoveryStatus.EXPLORADO]) {
        hex.discoveryStatus = DiscoveryStatus.EXPLORADO;
      }
      advancePeriod(campaign);
      campaign.version += 1;
      const lore = hex.state.lore as HexLore;
      const discovery = {
        landmark: lore.landmark,
        legend: lore.legends[Number(hex.state.visitCount ?? 0) % lore.legends.length],
        rumor: lore.rumors[Number(hex.state.visitCount ?? 0) % lore.rumors.length],
        threat: lore.monsters[0]
      };
      hex.state = { ...hex.state, lastDiscovery: discovery };
      await manager.save(campaign);
      await manager.save(hex);
      await manager.save(manager.create(CampaignEvent, {
        campaignId,
        type: 'HEX_EXPLORED',
        day: campaign.currentDay,
        period: campaign.currentPeriod,
        payload: { q: hex.q, r: hex.r, discovery }
      }));
      return { campaign, hex, discovery };
    });
    this.gateway.emitCampaignChanged(campaignId, 'HEX_EXPLORED');
    return result;
  }
}

function advancePeriod(campaign: Campaign) {
  const index = periods.indexOf(campaign.currentPeriod);
  if (index === periods.length - 1) {
    campaign.currentPeriod = DayPeriod.MANHA;
    campaign.currentDay += 1;
  } else {
    campaign.currentPeriod = periods[index + 1];
  }
}

function hexDistance(aq: number, ar: number, bq: number, br: number) {
  const as = -aq - ar;
  const bs = -bq - br;
  return Math.max(Math.abs(aq - bq), Math.abs(ar - br), Math.abs(as - bs));
}
