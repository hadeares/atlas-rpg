import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, IsNull, Repository } from 'typeorm';
import { CampaignsService } from '../campaigns/campaigns.service';
import {
  CreatureAction,
  CreatureSource,
  CreatureStatBlock,
  CreatureTemplate,
  CreatureTheme
} from '../database/entities/creature-template.entity';
import { Hex } from '../database/entities/hex.entity';
import { CreateCustomCreatureDto } from './dto/create-custom-creature.dto';
import { ListCreaturesQueryDto } from './dto/list-creatures-query.dto';
import { generateOriginalCreature } from './generation/original-creature-generator';

interface SrdListResponse {
  count?: number;
  results?: Array<{ index: string; name: string; url: string }>;
}

interface SrdMonsterResponse {
  index: string;
  name: string;
  size?: string;
  type?: string;
  alignment?: string;
  armor_class?: number | Array<{ value?: number; type?: string; desc?: string }>;
  hit_points?: number;
  hit_dice?: string;
  speed?: Record<string, string>;
  strength?: number;
  dexterity?: number;
  constitution?: number;
  intelligence?: number;
  wisdom?: number;
  charisma?: number;
  proficiencies?: Array<{ value?: number; proficiency?: { name?: string } }>;
  damage_vulnerabilities?: string[];
  damage_resistances?: string[];
  damage_immunities?: string[];
  condition_immunities?: Array<{ name?: string }>;
  senses?: Record<string, string | number>;
  languages?: string;
  challenge_rating?: number;
  xp?: number;
  proficiency_bonus?: number;
  special_abilities?: Array<{ name?: string; desc?: string }>;
  actions?: Array<{ name?: string; desc?: string; attack_bonus?: number; damage?: Array<{ damage_dice?: string; damage_type?: { name?: string } }>; usage?: { type?: string; dice?: string; min_value?: number } }>;
  bonus_actions?: Array<{ name?: string; desc?: string; attack_bonus?: number }>;
  reactions?: Array<{ name?: string; desc?: string }>;
  legendary_actions?: Array<{ name?: string; desc?: string }>;
  url?: string;
}

export interface CreatureSyncStatus {
  running: boolean;
  startedAt: string | null;
  finishedAt: string | null;
  imported: number;
  total: number;
  failed: number;
  lastError: string | null;
}

@Injectable()
export class CreaturesService implements OnModuleInit {
  private readonly logger = new Logger(CreaturesService.name);
  private syncStatus: CreatureSyncStatus = {
    running: false,
    startedAt: null,
    finishedAt: null,
    imported: 0,
    total: 0,
    failed: 0,
    lastError: null
  };

  constructor(
    @InjectRepository(CreatureTemplate)
    private readonly creaturesRepository: Repository<CreatureTemplate>,
    private readonly campaignsService: CampaignsService,
    private readonly config: ConfigService
  ) {}

  onModuleInit() {
    void this.ensureFallbackCatalog().then(() => {
      if (this.config.get<string>('SRD_SYNC_ON_START', 'true') === 'true') {
        void this.startSrdSyncInternal();
      }
    }).catch((error: unknown) => {
      this.logger.error('Não foi possível preparar o catálogo de criaturas.', error instanceof Error ? error.stack : String(error));
    });
  }

  async list(userId: string, campaignId: string, query: ListCreaturesQueryDto) {
    await this.campaignsService.ensureMaster(userId, campaignId);
    const builder = this.creaturesRepository.createQueryBuilder('creature')
      .where('creature.isActive = true')
      .andWhere(new Brackets((where) => {
        where.where('creature.campaignId IS NULL').orWhere('creature.campaignId = :campaignId', { campaignId });
      }))
      .orderBy('creature.challengeRating', 'ASC')
      .addOrderBy('creature.name', 'ASC')
      .take(query.limit ?? 500);

    if (query.search?.trim()) {
      builder.andWhere('(LOWER(creature.name) LIKE LOWER(:search) OR LOWER(creature.creatureType) LIKE LOWER(:search))', {
        search: `%${query.search.trim()}%`
      });
    }
    if (query.source) builder.andWhere('creature.source = :source', { source: query.source });
    if (query.theme) builder.andWhere('creature.theme = :theme', { theme: query.theme });
    if (query.minCr !== undefined) builder.andWhere('creature.challengeRating >= :minCr', { minCr: query.minCr });
    if (query.maxCr !== undefined) builder.andWhere('creature.challengeRating <= :maxCr', { maxCr: query.maxCr });

    return builder.getMany();
  }

  async createCustom(userId: string, campaignId: string, dto: CreateCustomCreatureDto) {
    await this.campaignsService.ensureMaster(userId, campaignId);
    const block = this.normalizeCustomBlock(dto.name, dto.statBlock);
    return this.creaturesRepository.save(this.creaturesRepository.create({
      campaignId,
      source: CreatureSource.CUSTOM,
      theme: block.theme ?? CreatureTheme.STANDARD,
      name: dto.name.trim(),
      externalIndex: null,
      challengeRating: block.challengeRating,
      creatureType: block.type,
      statBlock: block,
      isActive: true
    }));
  }

  async importCustom(userId: string, campaignId: string, creatures: CreateCustomCreatureDto[]) {
    await this.campaignsService.ensureMaster(userId, campaignId);
    if (creatures.length === 0) throw new BadRequestException('O catálogo importado está vazio.');
    const entities = creatures.map((dto) => {
      const block = this.normalizeCustomBlock(dto.name, dto.statBlock);
      return this.creaturesRepository.create({
        campaignId,
        source: CreatureSource.CUSTOM,
        theme: block.theme ?? CreatureTheme.STANDARD,
        name: dto.name.trim(),
        externalIndex: null,
        challengeRating: block.challengeRating,
        creatureType: block.type,
        statBlock: block,
        isActive: true
      });
    });
    const saved = await this.creaturesRepository.save(entities, { chunk: 100 });
    return { imported: saved.length, creatures: saved };
  }

  async removeCustom(userId: string, campaignId: string, creatureId: string) {
    await this.campaignsService.ensureMaster(userId, campaignId);
    const creature = await this.creaturesRepository.findOne({ where: { id: creatureId, campaignId, source: CreatureSource.CUSTOM } });
    if (!creature) throw new NotFoundException('Criatura personalizada não encontrada.');
    await this.creaturesRepository.remove(creature);
    return { deleted: true, id: creatureId };
  }

  async requestSrdSync(userId: string, campaignId: string) {
    await this.campaignsService.ensureMaster(userId, campaignId);
    if (!this.syncStatus.running) void this.startSrdSyncInternal();
    return this.syncStatus;
  }

  async getSyncStatus(userId: string, campaignId: string) {
    await this.campaignsService.ensureMaster(userId, campaignId);
    return {
      ...this.syncStatus,
      catalogCount: await this.creaturesRepository.count({ where: { source: CreatureSource.SRD, campaignId: IsNull() } })
    };
  }

  async selectForEncounter(options: {
    campaignId: string;
    templateId?: string;
    mode: 'ANY' | 'SRD' | 'ORIGINAL' | 'COSMIC' | 'INFECTED' | 'CUSTOM';
    targetCr: number;
    amount: number;
    seed: string;
    hex: Hex;
  }): Promise<CreatureStatBlock[]> {
    const amount = Math.max(1, Math.min(12, options.amount));
    let base: CreatureStatBlock | undefined;

    if (options.templateId) {
      const template = await this.creaturesRepository.findOne({
        where: [
          { id: options.templateId, campaignId: options.campaignId },
          { id: options.templateId, campaignId: IsNull() }
        ]
      });
      if (!template) throw new NotFoundException('Criatura selecionada não encontrada.');
      base = template.statBlock;
    } else if (['SRD', 'CUSTOM', 'ANY'].includes(options.mode)) {
      const source = options.mode === 'SRD' ? CreatureSource.SRD : options.mode === 'CUSTOM' ? CreatureSource.CUSTOM : undefined;
      const builder = this.creaturesRepository.createQueryBuilder('creature')
        .where('creature.isActive = true')
        .andWhere(new Brackets((where) => {
          where.where('creature.campaignId IS NULL').orWhere('creature.campaignId = :campaignId', { campaignId: options.campaignId });
        }))
        .andWhere('creature.challengeRating BETWEEN :minCr AND :maxCr', {
          minCr: Math.max(0, options.targetCr - 2.5),
          maxCr: Math.min(30, options.targetCr + 2.5)
        });
      if (source) builder.andWhere('creature.source = :source', { source });
      const candidates = await builder.take(250).getMany();
      if (candidates.length > 0) {
        const index = this.seedIndex(options.seed, candidates.length);
        base = candidates[index].statBlock;
      }
    }

    let theme = CreatureTheme.STANDARD;
    if (options.mode === 'COSMIC') theme = CreatureTheme.COSMIC;
    if (options.mode === 'INFECTED') theme = CreatureTheme.INFECTED;
    if (options.mode === 'ORIGINAL') theme = CreatureTheme.RANDOM;

    if (options.mode === 'SRD' || options.mode === 'CUSTOM' || (options.mode === 'ANY' && base)) {
      const block = base ?? generateOriginalCreature(`${options.seed}:fallback`, CreatureTheme.STANDARD, options.targetCr, options.hex);
      return Array.from({ length: amount }, () => ({ ...block }));
    }

    return Array.from({ length: amount }, (_, index) => generateOriginalCreature(
      `${options.seed}:original:${index}`,
      theme,
      options.targetCr,
      options.hex,
      base
    ));
  }

  private async ensureFallbackCatalog() {
    const count = await this.creaturesRepository.count({ where: { source: CreatureSource.ORIGINAL, campaignId: IsNull() } });
    if (count > 0) return;
    const fallback = [
      ['Lobo do Ermo', 0.25, CreatureTheme.STANDARD],
      ['Rastejante de Cinzas', 0.5, CreatureTheme.STANDARD],
      ['Cervo Infectado', 1, CreatureTheme.INFECTED],
      ['Mineiro Cristalizado', 2, CreatureTheme.INFECTED],
      ['Observador da Ferida', 3, CreatureTheme.COSMIC],
      ['Devorador de Ecos', 5, CreatureTheme.COSMIC],
      ['Guardião Oco', 7, CreatureTheme.INFECTED],
      ['Arauto do Subsolo', 10, CreatureTheme.COSMIC]
    ] as const;
    const entities = fallback.map(([name, cr, theme], index) => {
      const statBlock = generateOriginalCreature(`fallback:${index}:${name}`, theme, cr);
      statBlock.name = name;
      return this.creaturesRepository.create({
        campaignId: null,
        source: CreatureSource.ORIGINAL,
        theme,
        name,
        externalIndex: `atlas-${index}-${name.toLowerCase().replace(/\s+/g, '-')}`,
        challengeRating: cr,
        creatureType: statBlock.type,
        statBlock,
        isActive: true
      });
    });
    await this.creaturesRepository.save(entities);
  }

  private async startSrdSyncInternal() {
    if (this.syncStatus.running) return;
    this.syncStatus = {
      running: true,
      startedAt: new Date().toISOString(),
      finishedAt: null,
      imported: 0,
      total: 0,
      failed: 0,
      lastError: null
    };

    try {
      const baseUrl = this.config.get<string>('SRD_API_BASE_URL', 'https://www.dnd5eapi.co');
      const listResponse = await this.fetchJson<SrdListResponse>(`${baseUrl}/api/2014/monsters`);
      const results = listResponse.results ?? [];
      this.syncStatus.total = results.length;
      const concurrency = 8;
      for (let start = 0; start < results.length; start += concurrency) {
        const slice = results.slice(start, start + concurrency);
        await Promise.all(slice.map(async (item) => {
          try {
            const detail = await this.fetchJson<SrdMonsterResponse>(`${baseUrl}${item.url}`);
            await this.upsertSrd(detail, baseUrl);
            this.syncStatus.imported += 1;
          } catch (error) {
            this.syncStatus.failed += 1;
            this.logger.warn(`Falha ao sincronizar ${item.name}: ${error instanceof Error ? error.message : String(error)}`);
          }
        }));
      }
    } catch (error) {
      this.syncStatus.lastError = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Sincronização SRD indisponível: ${this.syncStatus.lastError}`);
    } finally {
      this.syncStatus.running = false;
      this.syncStatus.finishedAt = new Date().toISOString();
    }
  }

  private async upsertSrd(detail: SrdMonsterResponse, baseUrl: string) {
    const statBlock = this.mapSrdMonster(detail, baseUrl);
    let entity = await this.creaturesRepository.findOne({
      where: { source: CreatureSource.SRD, externalIndex: detail.index }
    });
    if (!entity) {
      entity = this.creaturesRepository.create({
        campaignId: null,
        source: CreatureSource.SRD,
        theme: CreatureTheme.STANDARD,
        name: detail.name,
        externalIndex: detail.index,
        challengeRating: statBlock.challengeRating,
        creatureType: statBlock.type,
        statBlock,
        isActive: true
      });
    } else {
      entity.name = detail.name;
      entity.challengeRating = statBlock.challengeRating;
      entity.creatureType = statBlock.type;
      entity.statBlock = statBlock;
      entity.isActive = true;
    }
    await this.creaturesRepository.save(entity);
  }

  private mapSrdMonster(detail: SrdMonsterResponse, baseUrl: string): CreatureStatBlock {
    const armorEntry = Array.isArray(detail.armor_class) ? detail.armor_class[0] : undefined;
    const armorClass = typeof detail.armor_class === 'number' ? detail.armor_class : Number(armorEntry?.value ?? 10);
    const proficiencies = detail.proficiencies ?? [];
    const savingThrows: Record<string, number> = {};
    const skills: Record<string, number> = {};
    for (const item of proficiencies) {
      const name = item.proficiency?.name ?? '';
      const key = name.split(':').pop()?.trim().toLowerCase().replace(/\s+/g, '_') ?? '';
      if (name.startsWith('Saving Throw:')) savingThrows[key] = Number(item.value ?? 0);
      if (name.startsWith('Skill:')) skills[key] = Number(item.value ?? 0);
    }
    const actions = this.mapActions(detail.actions ?? []);
    const cr = Number(detail.challenge_rating ?? 0);
    const senses = Object.entries(detail.senses ?? {}).map(([name, value]) => `${this.humanize(name)} ${value}`);
    const narration = `A presença de ${detail.name} é percebida antes do confronto: o terreno mostra sinais compatíveis com uma criatura do tipo ${detail.type ?? 'desconhecido'}. Quando finalmente aparece, sua postura e seus movimentos deixam claro que ela já escolheu como reagir ao grupo.`;
    return {
      name: detail.name,
      source: CreatureSource.SRD,
      theme: CreatureTheme.STANDARD,
      size: detail.size ?? 'Médio',
      type: detail.type ?? 'Criatura',
      alignment: detail.alignment ?? 'Sem alinhamento',
      armorClass,
      armorDescription: armorEntry?.desc ?? armorEntry?.type,
      hitPoints: Number(detail.hit_points ?? 1),
      hitDice: detail.hit_dice ?? '1d8',
      speed: {
        walk: detail.speed?.walk,
        fly: detail.speed?.fly,
        swim: detail.speed?.swim,
        burrow: detail.speed?.burrow,
        climb: detail.speed?.climb
      },
      abilities: {
        str: Number(detail.strength ?? 10),
        dex: Number(detail.dexterity ?? 10),
        con: Number(detail.constitution ?? 10),
        int: Number(detail.intelligence ?? 10),
        wis: Number(detail.wisdom ?? 10),
        cha: Number(detail.charisma ?? 10)
      },
      savingThrows,
      skills,
      damageVulnerabilities: detail.damage_vulnerabilities ?? [],
      damageResistances: detail.damage_resistances ?? [],
      damageImmunities: detail.damage_immunities ?? [],
      conditionImmunities: (detail.condition_immunities ?? []).map((item) => item.name ?? '').filter(Boolean),
      senses,
      languages: detail.languages ? detail.languages.split(',').map((item) => item.trim()) : ['—'],
      challengeRating: cr,
      challengeLabel: this.challengeLabel(cr),
      experiencePoints: Number(detail.xp ?? 0),
      proficiencyBonus: Number(detail.proficiency_bonus ?? this.proficiencyForCr(cr)),
      traits: (detail.special_abilities ?? []).map((item) => ({ name: item.name ?? 'Habilidade', description: item.desc ?? '' })),
      actions,
      bonusActions: this.mapActions(detail.bonus_actions ?? []),
      reactions: this.mapActions(detail.reactions ?? []),
      legendaryActions: this.mapActions(detail.legendary_actions ?? []),
      description: `${detail.name} é uma criatura do SRD 5.1, importada para uso mecânico no gerador de encontros.`,
      narration,
      signs: [`rastros e marcas compatíveis com ${detail.name}`, `mudanças no comportamento da fauna próxima`, `vestígios de alimentação ou território`],
      behavior: 'Use o alinhamento, a inteligência e as habilidades da ficha para definir se a criatura observa, negocia, protege território ou ataca.',
      tactics: actions.length > 0 ? `Prioriza ${actions[0].name} e usa o terreno antes de se expor.` : 'Usa o terreno e tenta obter vantagem antes de atacar.',
      weakness: 'A fraqueza não é revelada automaticamente; o mestre pode defini-la pela lore, ambiente ou investigação dos personagens.',
      rewards: ['componentes naturais', 'equipamentos ou restos de vítimas', 'informação sobre o território'],
      license: 'Dungeons & Dragons SRD 5.1, CC BY 4.0. Dados sincronizados por dnd5eapi.co.',
      externalUrl: detail.url ? `${baseUrl}${detail.url}` : undefined
    };
  }

  private mapActions(items: Array<{ name?: string; desc?: string; attack_bonus?: number; damage?: Array<{ damage_dice?: string; damage_type?: { name?: string } }>; usage?: { type?: string; dice?: string; min_value?: number } }>): CreatureAction[] {
    return items.map((item) => ({
      name: item.name ?? 'Ação',
      description: item.desc ?? '',
      attackBonus: item.attack_bonus,
      damage: item.damage?.map((damage) => damage.damage_dice).filter(Boolean).join(' + ') || undefined,
      damageType: item.damage?.map((damage) => damage.damage_type?.name).filter(Boolean).join(', ') || undefined,
      recharge: item.usage ? [item.usage.type, item.usage.dice, item.usage.min_value].filter((value) => value !== undefined).join(' ') : undefined
    }));
  }

  private normalizeCustomBlock(name: string, input: CreatureStatBlock): CreatureStatBlock {
    if (!input || typeof input !== 'object') throw new BadRequestException('A ficha da criatura é obrigatória.');
    const cr = Number(input.challengeRating ?? 1);
    return {
      ...input,
      name: name.trim(),
      source: CreatureSource.CUSTOM,
      theme: input.theme ?? CreatureTheme.STANDARD,
      challengeRating: cr,
      challengeLabel: input.challengeLabel ?? this.challengeLabel(cr),
      proficiencyBonus: Number(input.proficiencyBonus ?? this.proficiencyForCr(cr)),
      experiencePoints: Number(input.experiencePoints ?? 0),
      traits: input.traits ?? [],
      actions: input.actions ?? [],
      bonusActions: input.bonusActions ?? [],
      reactions: input.reactions ?? [],
      legendaryActions: input.legendaryActions ?? [],
      damageVulnerabilities: input.damageVulnerabilities ?? [],
      damageResistances: input.damageResistances ?? [],
      damageImmunities: input.damageImmunities ?? [],
      conditionImmunities: input.conditionImmunities ?? [],
      savingThrows: input.savingThrows ?? {},
      skills: input.skills ?? {},
      senses: input.senses ?? [],
      languages: input.languages ?? ['—'],
      signs: input.signs ?? [],
      rewards: input.rewards ?? [],
      license: input.license ?? 'Criatura personalizada do usuário.'
    };
  }

  private async fetchJson<T>(url: string): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`HTTP ${response.status} em ${url}`);
      return await response.json() as T;
    } finally {
      clearTimeout(timeout);
    }
  }

  private seedIndex(seed: string, length: number) {
    let hash = 0;
    for (let index = 0; index < seed.length; index += 1) hash = ((hash << 5) - hash + seed.charCodeAt(index)) | 0;
    return Math.abs(hash) % length;
  }

  private humanize(value: string) {
    return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  private proficiencyForCr(cr: number) {
    if (cr < 5) return 2;
    if (cr < 9) return 3;
    if (cr < 13) return 4;
    if (cr < 17) return 5;
    if (cr < 21) return 6;
    if (cr < 25) return 7;
    if (cr < 29) return 8;
    return 9;
  }

  private challengeLabel(cr: number) {
    if (cr === 0.125) return '1/8';
    if (cr === 0.25) return '1/4';
    if (cr === 0.5) return '1/2';
    return String(cr);
  }
}
