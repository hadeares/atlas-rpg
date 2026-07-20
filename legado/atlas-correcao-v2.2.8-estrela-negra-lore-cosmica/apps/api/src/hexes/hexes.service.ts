import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CampaignsService } from '../campaigns/campaigns.service';
import { CampaignBible, generateCampaignBible } from '../campaigns/generation/campaign-bible-generator';
import { CampaignEvent } from '../database/entities/campaign-event.entity';
import { Campaign } from '../database/entities/campaign.entity';
import { CampaignMemberRole } from '../database/entities/campaign-member.entity';
import { DiscoveryStatus, Hex } from '../database/entities/hex.entity';
import { UpdateHexLoreDto } from './dto/update-hex-lore.dto';
import { UpdateHexDto } from './dto/update-hex.dto';
import { generateHexLore, HexLore } from './generation/lore-generator';

@Injectable()
export class HexesService implements OnModuleInit {
  private readonly logger = new Logger(HexesService.name);

  constructor(
    @InjectRepository(Hex)
    private readonly hexesRepository: Repository<Hex>,
    @InjectRepository(CampaignEvent)
    private readonly eventsRepository: Repository<CampaignEvent>,
    private readonly campaignsService: CampaignsService,
    private readonly dataSource: DataSource
  ) {}

  onModuleInit() {
    void this.initializeHexData().catch((error: unknown) => {
      this.logger.error('Falha ao preparar os hexágonos.', error instanceof Error ? error.stack : String(error));
    });
  }

  private async initializeHexData() {
    await this.normalizeFogOfWar();
    await this.enrichOutdatedLore();
  }

  private async normalizeFogOfWar() {
    const result = await this.hexesRepository
      .createQueryBuilder()
      .update(Hex)
      .set({ discoveryStatus: DiscoveryStatus.DESCONHECIDO })
      .where('\"discoveryStatus\" = :status', { status: DiscoveryStatus.AVISTADO })
      .andWhere("COALESCE((\"state\"->>'visitCount')::integer, 0) = 0")
      .execute();

    if ((result.affected ?? 0) > 0) {
      this.logger.log(`${result.affected} hexágonos avistados automaticamente voltaram para a névoa de guerra.`);
    }
  }

  private async enrichOutdatedLore() {
    const campaigns = await this.dataSource.getRepository(Campaign).find();
    const campaignData = new Map(campaigns.map((campaign) => [campaign.id, campaign]));
    let migrated = 0;

    while (true) {
      const outdated = await this.hexesRepository
        .createQueryBuilder('hex')
        .where("COALESCE((hex.state->'lore'->>'schemaVersion')::integer, 0) < 5")
        .take(50)
        .getMany();

      if (outdated.length === 0) break;

      for (const hex of outdated) {
        const campaign = campaignData.get(hex.campaignId);
        if (!campaign) continue;
        this.applyGeneratedLore(hex, campaign.seed, this.readBible(campaign));
      }

      await this.hexesRepository.save(outdated, { chunk: 50 });
      migrated += outdated.length;
      await new Promise((resolve) => setTimeout(resolve, 5));
    }

    if (migrated > 0) this.logger.log(`${migrated} hexágonos antigos foram conectados à Bíblia da Estrela Negra e enriquecidos para a lore v5.`);
  }

  private applyGeneratedLore(hex: Hex, seed: string, worldBible?: CampaignBible) {
    const previous = (hex.state?.lore ?? {}) as Partial<HexLore>;
    const generated = generateHexLore(seed, hex.q, hex.r, hex.terrain, hex.biome, hex.dangerLevel, hex.cosmicInfluence, worldBible);
    const lore: HexLore = {
      ...generated,
      title: previous.title || generated.title,
      overview: previous.overview || generated.overview,
      history: previous.history || generated.history,
      playerSummary: previous.playerSummary || generated.playerSummary,
      secrets: previous.secrets || generated.secrets
    };
    hex.state = {
      ...hex.state,
      visitCount: Number(hex.state?.visitCount ?? 0),
      lore
    };
    return hex;
  }

  async findAll(userId: string, campaignId: string) {
    const access = await this.campaignsService.ensureAccess(userId, campaignId);
    const isMaster = access.accessRole === CampaignMemberRole.MASTER;
    const query = this.hexesRepository
      .createQueryBuilder('hex')
      .select('hex.id', 'id')
      .addSelect('hex.campaignId', 'campaignId')
      .addSelect('hex.q', 'q')
      .addSelect('hex.r', 'r')
      .addSelect('hex.terrain', 'terrain')
      .addSelect('hex.biome', 'biome')
      .addSelect('hex.elevation', 'elevation')
      .addSelect('hex.moisture', 'moisture')
      .addSelect('hex.temperature', 'temperature')
      .addSelect('hex.dangerLevel', 'dangerLevel')
      .addSelect('hex.cosmicInfluence', 'cosmicInfluence')
      .addSelect('hex.discoveryStatus', 'discoveryStatus')
      .addSelect('hex.publicName', 'publicName')
      .addSelect("CASE WHEN hex.state->'lore' IS NOT NULL THEN true ELSE false END", 'hasLore')
      .addSelect("COALESCE((hex.state->>'visitCount')::integer, 0)", 'visitCount')
      .addSelect("hex.state->'lastVisit'", 'lastVisit')
      .where('hex.campaignId = :campaignId', { campaignId });

    if (!isMaster) {
      query.andWhere('hex.discoveryStatus != :unknownStatus', {
        unknownStatus: DiscoveryStatus.DESCONHECIDO
      });
    }

    const rows = await query
      .orderBy('hex.r', 'ASC')
      .addOrderBy('hex.q', 'ASC')
      .getRawMany<{
        id: string;
        campaignId: string;
        q: number | string;
        r: number | string;
        terrain: string;
        biome: string;
        elevation: number | string;
        moisture: number | string;
        temperature: number | string;
        dangerLevel: number | string;
        cosmicInfluence: number | string;
        discoveryStatus: DiscoveryStatus;
        publicName: string | null;
        hasLore: boolean | string;
        visitCount: number | string;
        lastVisit: Record<string, unknown> | null;
      }>();

    return rows.map((row) => {
      const unknownToPlayer = !isMaster && row.discoveryStatus === DiscoveryStatus.DESCONHECIDO;
      return {
        id: row.id,
        campaignId: row.campaignId,
        q: Number(row.q),
        r: Number(row.r),
        terrain: unknownToPlayer ? 'DESCONHECIDO' : row.terrain,
        biome: unknownToPlayer ? 'DESCONHECIDO' : row.biome,
        elevation: unknownToPlayer ? 0 : Number(row.elevation),
        moisture: unknownToPlayer ? 0 : Number(row.moisture),
        temperature: unknownToPlayer ? 0 : Number(row.temperature),
        dangerLevel: isMaster || [DiscoveryStatus.EXPLORADO, DiscoveryStatus.MAPEADO].includes(row.discoveryStatus)
          ? Number(row.dangerLevel)
          : 0,
        cosmicInfluence: isMaster ? Number(row.cosmicInfluence) : 0,
        discoveryStatus: row.discoveryStatus,
        publicName: unknownToPlayer ? null : row.publicName,
        masterNotes: null,
        state: {
          hasLore: unknownToPlayer ? false : row.hasLore === true || row.hasLore === 'true',
          visitCount: Number(row.visitCount ?? 0),
          lastVisit: unknownToPlayer ? undefined : row.lastVisit ?? undefined
        }
      };
    });
  }

  async findOne(userId: string, campaignId: string, q: number, r: number) {
    const access = await this.campaignsService.ensureAccess(userId, campaignId);
    let hex = await this.hexesRepository.findOne({ where: { campaignId, q, r } });
    if (!hex) throw new NotFoundException('Hexágono não encontrado.');
    const lore = hex.state?.lore as Partial<HexLore> | undefined;
    if (access.accessRole === CampaignMemberRole.PLAYER && hex.discoveryStatus === DiscoveryStatus.DESCONHECIDO) {
      throw new NotFoundException('Hexágono ainda não conhecido pelo grupo.');
    }
    if (Number(lore?.schemaVersion ?? 0) < 5) {
      hex = await this.hexesRepository.save(this.applyGeneratedLore(hex, access.campaign.seed, this.readBible(access.campaign)));
    }
    return access.accessRole === CampaignMemberRole.MASTER ? hex : this.redactForPlayer(hex);
  }

  async update(userId: string, campaignId: string, q: number, r: number, dto: UpdateHexDto) {
    const access = await this.campaignsService.ensureMaster(userId, campaignId);
    const hex = await this.hexesRepository.findOne({ where: { campaignId, q, r } });
    if (!hex) throw new NotFoundException('Hexágono não encontrado.');

    const previousStatus = hex.discoveryStatus;
    if (dto.discoveryStatus !== undefined) hex.discoveryStatus = dto.discoveryStatus;
    if (dto.publicName !== undefined) hex.publicName = dto.publicName.trim() || null;
    if (dto.masterNotes !== undefined) hex.masterNotes = dto.masterNotes.trim() || null;

    const savedHex = await this.hexesRepository.save(hex);
    await this.eventsRepository.save(this.eventsRepository.create({
      campaignId,
      type: 'HEX_UPDATED',
      day: access.campaign.currentDay,
      period: access.campaign.currentPeriod,
      payload: { q, r, previousStatus, currentStatus: savedHex.discoveryStatus, publicName: savedHex.publicName }
    }));
    await this.touchCampaign(campaignId);
    return savedHex;
  }

  async updateLore(userId: string, campaignId: string, q: number, r: number, dto: UpdateHexLoreDto) {
    await this.campaignsService.ensureMaster(userId, campaignId);
    const hex = await this.hexesRepository.findOne({ where: { campaignId, q, r } });
    if (!hex) throw new NotFoundException('Hexágono não encontrado.');

    const lore = { ...(hex.state.lore as HexLore) };
    if (dto.title !== undefined) lore.title = dto.title.trim();
    if (dto.overview !== undefined) lore.overview = dto.overview.trim();
    if (dto.history !== undefined) lore.history = dto.history.trim();
    if (dto.playerSummary !== undefined) lore.playerSummary = dto.playerSummary.trim();
    if (dto.secrets !== undefined) {
      lore.secrets = dto.secrets.trim();
      lore.masterGuide = { ...lore.masterGuide, hiddenTruth: dto.secrets.trim() };
    }
    hex.state = { ...hex.state, lore };
    if (!hex.publicName) hex.publicName = lore.title;
    const savedHex = await this.hexesRepository.save(hex);
    await this.touchCampaign(campaignId);
    return savedHex;
  }

  async regenerateLore(userId: string, campaignId: string, q: number, r: number) {
    const access = await this.campaignsService.ensureMaster(userId, campaignId);
    const hex = await this.hexesRepository.findOne({ where: { campaignId, q, r } });
    if (!hex) throw new NotFoundException('Hexágono não encontrado.');

    const loreVersion = Number(hex.state.loreVersion ?? 1) + 1;
    const lore = generateHexLore(`${access.campaign.seed}:v${loreVersion}`, q, r, hex.terrain, hex.biome, hex.dangerLevel, hex.cosmicInfluence, this.readBible(access.campaign));
    hex.state = { ...hex.state, lore, loreVersion };
    hex.publicName = lore.title;
    const savedHex = await this.hexesRepository.save(hex);
    await this.touchCampaign(campaignId);
    return savedHex;
  }

  private readBible(campaign: Campaign): CampaignBible {
    const stored = campaign.simulationState?.worldBible;
    return stored && typeof stored === 'object'
      ? stored as CampaignBible
      : generateCampaignBible(campaign.seed);
  }

  private async touchCampaign(campaignId: string) {
    await this.dataSource.getRepository(Campaign).increment({ id: campaignId }, 'version', 1);
  }

  private toMapSummary(hex: Hex, isMaster: boolean) {
    if (!isMaster && hex.discoveryStatus === DiscoveryStatus.DESCONHECIDO) {
      return {
        id: hex.id,
        campaignId: hex.campaignId,
        q: hex.q,
        r: hex.r,
        terrain: 'DESCONHECIDO',
        biome: 'DESCONHECIDO',
        elevation: 0,
        moisture: 0,
        temperature: 0,
        dangerLevel: 0,
        cosmicInfluence: 0,
        discoveryStatus: hex.discoveryStatus,
        publicName: null,
        masterNotes: null,
        state: { hasLore: false }
      };
    }

    const lore = hex.state?.lore as HexLore | undefined;
    return {
      id: hex.id,
      campaignId: hex.campaignId,
      q: hex.q,
      r: hex.r,
      terrain: hex.terrain,
      biome: hex.biome,
      elevation: hex.elevation,
      moisture: hex.moisture,
      temperature: hex.temperature,
      dangerLevel: isMaster || [DiscoveryStatus.EXPLORADO, DiscoveryStatus.MAPEADO].includes(hex.discoveryStatus) ? hex.dangerLevel : 0,
      cosmicInfluence: isMaster ? hex.cosmicInfluence : 0,
      discoveryStatus: hex.discoveryStatus,
      publicName: hex.publicName || (hex.discoveryStatus !== DiscoveryStatus.DESCONHECIDO ? lore?.title ?? null : null),
      masterNotes: null,
      state: {
        hasLore: Boolean(lore),
        visitCount: hex.state?.visitCount,
        lastVisit: hex.state?.lastVisit
      }
    };
  }

  private redactForPlayer(hex: Hex) {
    if (hex.discoveryStatus === DiscoveryStatus.DESCONHECIDO) {
      return this.toMapSummary(hex, false);
    }

    const lore = hex.state.lore as HexLore | undefined;
    const crossed = [DiscoveryStatus.ATRAVESSADO, DiscoveryStatus.EXPLORADO, DiscoveryStatus.MAPEADO].includes(hex.discoveryStatus);
    const explored = [DiscoveryStatus.EXPLORADO, DiscoveryStatus.MAPEADO].includes(hex.discoveryStatus);
    const mapped = hex.discoveryStatus === DiscoveryStatus.MAPEADO;

    const publicLore = lore ? {
      schemaVersion: lore.schemaVersion,
      title: lore.title,
      overview: hex.discoveryStatus === DiscoveryStatus.AVISTADO ? lore.playerSummary : lore.overview,
      atmosphere: lore.atmosphere,
      playerSummary: lore.playerSummary,
      narration: {
        approach: lore.narration.approach,
        arrival: crossed ? lore.narration.arrival : undefined,
        crossing: crossed ? lore.narration.crossing : undefined,
        exploration: explored ? lore.narration.exploration : undefined,
        night: crossed ? lore.narration.night : undefined,
        landmarkDiscovery: explored ? lore.narration.landmarkDiscovery : undefined,
        camp: crossed ? lore.narration.camp : undefined,
        dawn: crossed ? lore.narration.dawn : undefined,
        badWeather: crossed ? lore.narration.badWeather : undefined,
        aftermath: explored ? lore.narration.aftermath : undefined
      },
      sensoryDetails: {
        sights: lore.sensoryDetails.sights,
        sounds: crossed ? lore.sensoryDetails.sounds : [],
        smells: crossed ? lore.sensoryDetails.smells : [],
        touch: explored ? lore.sensoryDetails.touch : []
      },
      landmark: {
        name: lore.landmark.name,
        description: lore.landmark.description,
        hidden: false
      },
      features: lore.features
        .filter((feature) => feature.visible || explored)
        .map((feature) => ({
          name: feature.name,
          type: feature.type,
          visible: true,
          playerDescription: feature.playerDescription,
          interaction: explored ? feature.interaction : undefined
        })),
      routes: crossed
        ? lore.routes.slice(0, mapped ? lore.routes.length : 1).map((route) => ({
          name: route.name,
          description: route.description,
          advantage: mapped ? route.advantage : undefined,
          danger: explored ? route.danger : undefined
        }))
        : [],
      resources: crossed
        ? lore.resources.map((resource) => ({
          name: resource.name,
          category: resource.category,
          availability: explored ? resource.availability : undefined,
          access: explored ? resource.access : undefined,
          complication: mapped ? resource.complication : undefined
        }))
        : [],
      flora: crossed ? lore.flora.map(({ name, abundance, appearance, use, risk }) => ({
        name,
        abundance: explored ? abundance : undefined,
        appearance,
        use: explored ? use : undefined,
        risk: mapped ? risk : undefined
      })) : [],
      history: explored ? lore.history : undefined,
      historyLayers: explored ? {
        beforeCatastrophe: lore.historyLayers.beforeCatastrophe,
        duringExperiment: mapped ? lore.historyLayers.duringExperiment : undefined,
        afterOpening: lore.historyLayers.afterOpening,
        currentState: lore.historyLayers.currentState
      } : undefined,
      region: {
        id: lore.region.id,
        name: lore.region.name,
        epithet: lore.region.epithet,
        theme: lore.region.theme,
        publicDescription: lore.region.publicDescription,
        dominantFaction: lore.region.dominantFaction,
        signatureCreature: explored ? lore.region.signatureCreature : undefined,
        rareResource: mapped ? lore.region.rareResource : undefined,
        centralMystery: explored ? lore.region.centralMystery : undefined
      },
      revelationLayers: {
        sensed: lore.revelationLayers.sensed,
        observed: crossed ? lore.revelationLayers.observed : undefined,
        investigated: explored ? lore.revelationLayers.investigated : undefined,
        confirmed: mapped ? lore.revelationLayers.confirmed : undefined
      },
      campaignConnections: explored ? {
        blackStarSign: lore.campaignConnections.blackStarSign,
        portalEcho: lore.campaignConnections.portalEcho,
        solarDecaySign: lore.campaignConnections.solarDecaySign,
        linkedFaction: lore.campaignConnections.linkedFaction,
        linkedRelic: mapped ? lore.campaignConnections.linkedRelic : undefined,
        objectiveClue: mapped ? lore.campaignConnections.objectiveClue : undefined,
        linkedHexHints: mapped ? lore.campaignConnections.linkedHexHints : []
      } : undefined,
      legends: mapped ? lore.legends.map(({ title, text }) => ({ title, text })) : [],
      rumors: crossed ? lore.rumors.map(({ text, source }) => ({ text, source })) : [],
      fauna: crossed ? lore.fauna.map(({ name, abundance, behavior, signs, resource }) => ({
        name,
        abundance: explored ? abundance : undefined,
        behavior,
        signs: explored ? signs : undefined,
        resource: mapped ? resource : undefined
      })) : [],
      knownThreats: explored ? lore.monsters.map(({ name, threat, appearance, signs, behavior, motive, lair }) => ({
        name,
        threat,
        appearance,
        signs,
        behavior,
        motive: mapped ? motive : undefined,
        lair: mapped ? lair : undefined
      })) : [],
      inhabitants: crossed ? lore.inhabitants.map(({ name, role, appearance, manner, desire, offer }) => ({
        name,
        role,
        appearance,
        manner,
        desire: explored ? desire : undefined,
        offer: explored ? offer : undefined
      })) : [],
      horror: {
        name: explored ? lore.horror.name : 'Presença desconhecida',
        stage: explored ? lore.horror.stage : 'PRESSAGIO',
        omens: lore.horror.omens.slice(0, explored ? lore.horror.omens.length : 2),
        playerEffect: lore.horror.playerEffect
      },
      weatherProfile: crossed ? {
        common: lore.weatherProfile.common,
        hazard: explored ? lore.weatherProfile.hazard : undefined,
        clearSign: mapped ? lore.weatherProfile.clearSign : undefined,
        stormSign: explored ? lore.weatherProfile.stormSign : undefined
      } : undefined,
      terrainChallenges: crossed ? lore.terrainChallenges.map(({ name, description, check, alternative }) => ({
        name,
        description,
        check: explored ? check : undefined,
        alternative: mapped ? alternative : undefined
      })) : [],
      discoveries: explored ? lore.discoveries.map(({ name, description, requirement, reward }) => ({
        name,
        description,
        requirement,
        reward: mapped ? reward : undefined
      })) : [],
      localCulture: crossed ? {
        custom: lore.localCulture.custom,
        taboo: explored ? lore.localCulture.taboo : undefined,
        trade: lore.localCulture.trade
      } : undefined,
      storyHooks: mapped ? lore.storyHooks.map(({ title, hook }) => ({ title, hook })) : [],
      cosmicPatterns: explored ? lore.cosmicPatterns.map(({ manifestation, trigger, effect, clue }) => ({
        manifestation,
        trigger: mapped ? trigger : undefined,
        effect,
        clue
      })) : []
    } : undefined;

    return {
      ...hex,
      publicName: hex.publicName || lore?.title || null,
      masterNotes: null,
      cosmicInfluence: explored ? hex.cosmicInfluence : 0,
      state: {
        lastVisit: hex.state.lastVisit,
        lastDiscovery: explored ? hex.state.lastDiscovery : undefined,
        publicLore
      }
    };
  }
}
