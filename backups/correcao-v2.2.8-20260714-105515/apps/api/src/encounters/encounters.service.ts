import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { CampaignsService } from '../campaigns/campaigns.service';
import { CampaignEvent } from '../database/entities/campaign-event.entity';
import { CreaturesService } from '../creatures/creatures.service';
import { Campaign } from '../database/entities/campaign.entity';
import { Hex } from '../database/entities/hex.entity';
import {
  EncounterCategory,
  EncounterCombatPreference,
  EncounterIntensity,
  EncounterLoreRelation,
  EncounterStatus,
  RandomEncounter
} from '../database/entities/random-encounter.entity';
import { HexLore } from '../hexes/generation/lore-generator';
import { EncounterCreatureMode, GenerateEncounterDto } from './dto/generate-encounter.dto';
import { ListEncountersQueryDto } from './dto/list-encounters-query.dto';
import { UpdateEncounterStatusDto } from './dto/update-encounter-status.dto';
import { UpdateEncounterDto } from './dto/update-encounter.dto';
import { generateEncounter } from './generation/encounter-generator';

@Injectable()
export class EncountersService {
  constructor(
    @InjectRepository(RandomEncounter)
    private readonly encountersRepository: Repository<RandomEncounter>,
    @InjectRepository(Hex)
    private readonly hexesRepository: Repository<Hex>,
    @InjectRepository(CampaignEvent)
    private readonly eventsRepository: Repository<CampaignEvent>,
    private readonly campaignsService: CampaignsService,
    private readonly creaturesService: CreaturesService
  ) {}

  async generate(userId: string, campaignId: string, dto: GenerateEncounterDto) {
    const access = await this.campaignsService.ensureMaster(userId, campaignId);
    const hex = await this.hexesRepository.findOne({ where: { campaignId, q: dto.q, r: dto.r } });
    if (!hex) throw new NotFoundException('Hexágono não encontrado.');

    const lore = hex.state?.lore as HexLore | undefined;
    if (!lore) throw new NotFoundException('Este hexágono ainda não possui lore.');

    const generationSeed = `${access.campaign.seed}:${hex.q}:${hex.r}:${access.campaign.currentDay}:${access.campaign.currentPeriod}:${randomUUID()}`;
    const requestedCategory = dto.generateCosmicCreature && (!dto.category || dto.category === EncounterCategory.ALEATORIO)
      ? EncounterCategory.HORROR
      : dto.category ?? EncounterCategory.ALEATORIO;
    const shouldGenerateCreatures = requestedCategory === EncounterCategory.ALEATORIO
      || [EncounterCategory.MONSTRO, EncounterCategory.CRIATURA, EncounterCategory.HORROR, EncounterCategory.VESTIGIO].includes(requestedCategory)
      || Boolean(dto.creatureTemplateId)
      || (dto.creatureMode !== undefined && dto.creatureMode !== EncounterCreatureMode.ANY);
    const creatureMode = dto.generateCosmicCreature
      ? EncounterCreatureMode.COSMIC
      : requestedCategory === EncounterCategory.HORROR && !dto.creatureMode
        ? EncounterCreatureMode.COSMIC
        : dto.creatureMode ?? EncounterCreatureMode.ANY;
    const targetCr = dto.targetCr ?? dto.monsterLevel ?? this.recommendedCr(dto.averageLevel ?? 3, dto.partySize ?? 4, dto.intensity);
    const creatureBlocks = shouldGenerateCreatures
      ? await this.creaturesService.selectForEncounter({
          campaignId,
          templateId: dto.creatureTemplateId,
          mode: creatureMode,
          targetCr,
          amount: dto.creatureCount ?? 1,
          seed: generationSeed,
          hex,
          cosmicArchetype: dto.cosmicArchetype,
          cosmicOrigin: dto.cosmicOrigin,
          monsterLevel: dto.monsterLevel
        })
      : [];
    if (dto.saveGeneratedCreature && creatureMode === EncounterCreatureMode.COSMIC) {
      await this.creaturesService.saveGeneratedCosmicCreatures(campaignId, creatureBlocks);
    }
    const generated = generateEncounter(generationSeed, hex, lore, { ...dto, category: requestedCategory }, creatureBlocks);

    const encounter = await this.encountersRepository.save(this.encountersRepository.create({
      campaignId,
      hexId: hex.id,
      q: hex.q,
      r: hex.r,
      day: access.campaign.currentDay,
      period: access.campaign.currentPeriod,
      status: EncounterStatus.RASCUNHO,
      category: generated.category,
      intensity: generated.intensity,
      combatPreference: generated.combatPreference,
      loreRelation: generated.loreRelation,
      title: generated.title,
      publicNarration: generated.publicNarration,
      masterSummary: generated.masterSummary,
      generationSeed,
      generatorOptions: {
        requestedCategory,
        requestedIntensity: dto.intensity ?? EncounterIntensity.QUALQUER,
        requestedCombatPreference: dto.combatPreference ?? EncounterCombatPreference.QUALQUER,
        requestedLoreRelation: dto.loreRelation ?? EncounterLoreRelation.LORE_EXISTENTE,
        partySize: dto.partySize ?? 4,
        averageLevel: dto.averageLevel ?? 3,
        notes: dto.notes?.trim() || null,
        creatureMode,
        creatureTemplateId: dto.creatureTemplateId ?? null,
        creatureCount: dto.creatureCount ?? 1,
        targetCr,
        monsterLevel: dto.monsterLevel ?? null,
        generateCosmicCreature: dto.generateCosmicCreature ?? false,
        saveGeneratedCreature: dto.saveGeneratedCreature ?? false,
        cosmicArchetype: dto.cosmicArchetype ?? 'RANDOM',
        cosmicOrigin: dto.cosmicOrigin ?? 'RANDOM'
      },
      content: generated.content,
      resolutionNotes: null,
      createdById: userId,
      startedAt: null,
      resolvedAt: null
    }));

    await this.eventsRepository.save(this.eventsRepository.create({
      campaignId,
      type: 'SECRET_ENCOUNTER_GENERATED',
      day: access.campaign.currentDay,
      period: access.campaign.currentPeriod,
      payload: {
        encounterId: encounter.id,
        q: hex.q,
        r: hex.r,
        category: encounter.category,
        intensity: encounter.intensity,
        status: encounter.status
      }
    }));

    return encounter;
  }

  async findAll(userId: string, campaignId: string, query: ListEncountersQueryDto) {
    await this.campaignsService.ensureMaster(userId, campaignId);
    const where: Record<string, unknown> = { campaignId };
    if (query.q !== undefined) where.q = query.q;
    if (query.r !== undefined) where.r = query.r;
    if (query.status !== undefined) where.status = query.status;
    return this.encountersRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: 200
    });
  }

  async findOne(userId: string, campaignId: string, encounterId: string) {
    await this.campaignsService.ensureMaster(userId, campaignId);
    const encounter = await this.encountersRepository.findOne({ where: { id: encounterId, campaignId } });
    if (!encounter) throw new NotFoundException('Encontro não encontrado.');
    return encounter;
  }

  async update(userId: string, campaignId: string, encounterId: string, dto: UpdateEncounterDto) {
    const encounter = await this.findOne(userId, campaignId, encounterId);
    if (dto.title !== undefined) encounter.title = dto.title.trim();
    if (dto.publicNarration !== undefined) encounter.publicNarration = dto.publicNarration.trim();
    if (dto.masterSummary !== undefined) encounter.masterSummary = dto.masterSummary.trim();
    if (dto.resolutionNotes !== undefined) encounter.resolutionNotes = dto.resolutionNotes.trim() || null;
    return this.encountersRepository.save(encounter);
  }

  async updateStatus(userId: string, campaignId: string, encounterId: string, dto: UpdateEncounterStatusDto) {
    const access = await this.campaignsService.ensureMaster(userId, campaignId);
    const encounter = await this.encountersRepository.findOne({ where: { id: encounterId, campaignId } });
    if (!encounter) throw new NotFoundException('Encontro não encontrado.');

    encounter.status = dto.status;
    if (dto.resolutionNotes !== undefined) encounter.resolutionNotes = dto.resolutionNotes.trim() || null;
    if (dto.status === EncounterStatus.ATIVO && !encounter.startedAt) encounter.startedAt = new Date();
    if ([EncounterStatus.CONCLUIDO, EncounterStatus.IGNORADO, EncounterStatus.CANCELADO].includes(dto.status)) {
      encounter.resolvedAt = new Date();
    } else {
      encounter.resolvedAt = null;
    }

    const saved = await this.encountersRepository.save(encounter);
    await this.eventsRepository.save(this.eventsRepository.create({
      campaignId,
      type: 'SECRET_ENCOUNTER_STATUS_CHANGED',
      day: access.campaign.currentDay,
      period: access.campaign.currentPeriod,
      payload: {
        encounterId: encounter.id,
        q: encounter.q,
        r: encounter.r,
        status: encounter.status
      }
    }));
    return saved;
  }

  private recommendedCr(averageLevel: number, partySize: number, intensity?: EncounterIntensity) {
    const intensityModifier: Record<EncounterIntensity, number> = {
      [EncounterIntensity.QUALQUER]: 0,
      [EncounterIntensity.TRANQUILA]: -2,
      [EncounterIntensity.CURIOSA]: -1,
      [EncounterIntensity.PREOCUPANTE]: 0,
      [EncounterIntensity.PERIGOSA]: 2,
      [EncounterIntensity.MORTAL]: 4
    };
    return Math.max(0.125, Math.min(20, averageLevel + Math.max(0, partySize - 4) * 0.5 + intensityModifier[intensity ?? EncounterIntensity.QUALQUER]));
  }

  async remove(userId: string, campaignId: string, encounterId: string) {
    const encounter = await this.findOne(userId, campaignId, encounterId);
    if (encounter.status === EncounterStatus.ATIVO) {
      throw new ForbiddenException('Conclua ou cancele o encontro ativo antes de excluí-lo.');
    }
    await this.encountersRepository.remove(encounter);
    return { deleted: true, id: encounterId };
  }
}
