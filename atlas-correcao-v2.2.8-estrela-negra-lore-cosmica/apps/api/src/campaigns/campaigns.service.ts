import { ConflictException, ForbiddenException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CampaignEvent } from '../database/entities/campaign-event.entity';
import { CampaignMember, CampaignMemberRole } from '../database/entities/campaign-member.entity';
import { Campaign } from '../database/entities/campaign.entity';
import { Hex } from '../database/entities/hex.entity';
import { User } from '../database/entities/user.entity';
import { generateHexGrid } from '../hexes/generation/hex-generator';
import { AddCampaignMemberDto } from './dto/add-campaign-member.dto';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignMemberDto } from './dto/update-campaign-member.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { CampaignBible, generateCampaignBible, redactCampaignBibleForPlayer } from './generation/campaign-bible-generator';

export interface CampaignAccess {
  campaign: Campaign;
  accessRole: CampaignMemberRole;
  isOwner: boolean;
}

export interface CampaignLiveState {
  id: string;
  version: number;
  currentDay: number;
  currentPeriod: Campaign['currentPeriod'];
  currentQ: number;
  currentR: number;
  updatedAt: Date;
}

@Injectable()
export class CampaignsService implements OnModuleInit {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignsRepository: Repository<Campaign>,
    @InjectRepository(CampaignMember)
    private readonly membersRepository: Repository<CampaignMember>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly dataSource: DataSource
  ) {}

  async onModuleInit() {
    const campaigns = await this.campaignsRepository.find();
    if (campaigns.length === 0) return;
    await this.membersRepository.upsert(
      campaigns.map((campaign) => ({
        campaignId: campaign.id,
        userId: campaign.ownerId,
        role: CampaignMemberRole.MASTER
      })),
      ['campaignId', 'userId']
    );

    const missingBible = campaigns.filter((campaign) => !this.readBible(campaign));
    if (missingBible.length > 0) {
      for (const campaign of missingBible) {
        campaign.simulationState = {
          ...campaign.simulationState,
          worldBible: generateCampaignBible(campaign.seed),
          worldBibleVersion: 1
        };
      }
      await this.campaignsRepository.save(missingBible, { chunk: 50 });
    }
  }

  async create(ownerId: string, dto: CreateCampaignDto) {
    return this.dataSource.transaction(async (manager) => {
      const bible = generateCampaignBible(dto.seed.trim());
      const campaign = manager.create(Campaign, {
        ownerId,
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        seed: dto.seed.trim(),
        radius: dto.radius,
        currentQ: 0,
        currentR: 0,
        simulationState: {
          worldBible: bible,
          worldBibleVersion: 1,
          solarDecayStage: 1
        }
      });

      const savedCampaign = await manager.save(campaign);
      await manager.save(manager.create(CampaignMember, {
        campaignId: savedCampaign.id,
        userId: ownerId,
        role: CampaignMemberRole.MASTER
      }));

      const generatedHexes = generateHexGrid(savedCampaign.seed, savedCampaign.radius, bible);
      const hexes = generatedHexes.map((generatedHex) => manager.create(Hex, {
        ...generatedHex,
        campaignId: savedCampaign.id
      }));

      await manager.save(Hex, hexes, { chunk: 250 });
      await manager.save(manager.create(CampaignEvent, {
        campaignId: savedCampaign.id,
        type: 'CAMPAIGN_CREATED',
        day: savedCampaign.currentDay,
        period: savedCampaign.currentPeriod,
        payload: {
          radius: savedCampaign.radius,
          generatedHexes: hexes.length,
          generatedLore: hexes.length,
          seed: savedCampaign.seed
        }
      }));

      return this.serializeCampaign(savedCampaign, CampaignMemberRole.MASTER, true, {
        hexCount: hexes.length,
        memberCount: 1
      });
    });
  }

  async findAll(userId: string) {
    const memberships = await this.membersRepository.find({
      where: { userId },
      relations: { campaign: true },
      order: { campaign: { updatedAt: 'DESC' } }
    });

    if (memberships.length === 0) return [];

    const campaignIds = memberships.map((membership) => membership.campaignId);

    const [hexCountsRaw, knownHexCountsRaw, memberCountsRaw] = await Promise.all([
      this.dataSource
        .getRepository(Hex)
        .createQueryBuilder('hex')
        .select('hex.campaignId', 'campaignId')
        .addSelect('COUNT(hex.id)', 'count')
        .where('hex.campaignId IN (:...campaignIds)', { campaignIds })
        .groupBy('hex.campaignId')
        .getRawMany<{ campaignId: string; count: string }>(),
      this.dataSource
        .getRepository(Hex)
        .createQueryBuilder('hex')
        .select('hex.campaignId', 'campaignId')
        .addSelect('COUNT(hex.id)', 'count')
        .where('hex.campaignId IN (:...campaignIds)', { campaignIds })
        .andWhere('hex.discoveryStatus != :unknownStatus', { unknownStatus: 'DESCONHECIDO' })
        .groupBy('hex.campaignId')
        .getRawMany<{ campaignId: string; count: string }>(),
      this.membersRepository
        .createQueryBuilder('member')
        .select('member.campaignId', 'campaignId')
        .addSelect('COUNT(member.id)', 'count')
        .where('member.campaignId IN (:...campaignIds)', { campaignIds })
        .groupBy('member.campaignId')
        .getRawMany<{ campaignId: string; count: string }>()
    ]);

    const hexCounts = new Map(hexCountsRaw.map((item) => [item.campaignId, Number(item.count)]));
    const knownHexCounts = new Map(knownHexCountsRaw.map((item) => [item.campaignId, Number(item.count)]));
    const memberCounts = new Map(memberCountsRaw.map((item) => [item.campaignId, Number(item.count)]));

    return memberships.map((membership) => {
      const playerView = membership.role === CampaignMemberRole.PLAYER;
      return this.serializeCampaign(membership.campaign, membership.role, membership.campaign.ownerId === userId, {
        hexCount: playerView
          ? knownHexCounts.get(membership.campaignId) ?? 0
          : hexCounts.get(membership.campaignId) ?? 0,
        memberCount: memberCounts.get(membership.campaignId) ?? 0
      });
    });
  }

  async findOne(userId: string, campaignId: string) {
    const access = await this.ensureAccess(userId, campaignId);
    const playerView = access.accessRole === CampaignMemberRole.PLAYER;
    const hexCountQuery = this.dataSource
      .getRepository(Hex)
      .createQueryBuilder('hex')
      .where('hex.campaignId = :campaignId', { campaignId });

    if (playerView) {
      hexCountQuery.andWhere('hex.discoveryStatus != :unknownStatus', { unknownStatus: 'DESCONHECIDO' });
    }

    const [hexCount, memberCount] = await Promise.all([
      hexCountQuery.getCount(),
      this.membersRepository.count({ where: { campaignId } })
    ]);

    return this.serializeCampaign(access.campaign, access.accessRole, access.isOwner, {
      hexCount,
      memberCount
    });
  }

  async getLiveState(userId: string, campaignId: string): Promise<CampaignLiveState> {
    const access = await this.ensureAccess(userId, campaignId);
    return {
      id: access.campaign.id,
      version: access.campaign.version,
      currentDay: access.campaign.currentDay,
      currentPeriod: access.campaign.currentPeriod,
      currentQ: access.campaign.currentQ,
      currentR: access.campaign.currentR,
      updatedAt: access.campaign.updatedAt
    };
  }

  async update(userId: string, campaignId: string, dto: UpdateCampaignDto) {
    const access = await this.ensureMaster(userId, campaignId);
    if (dto.name !== undefined) access.campaign.name = dto.name.trim();
    if (dto.description !== undefined) access.campaign.description = dto.description.trim() || null;
    access.campaign.version += 1;
    return this.campaignsRepository.save(access.campaign);
  }

  async remove(userId: string, campaignId: string) {
    const access = await this.ensureAccess(userId, campaignId);
    if (!access.isOwner) throw new ForbiddenException('Somente o proprietário pode excluir a campanha.');
    await this.campaignsRepository.remove(access.campaign);
    return { deleted: true, id: campaignId };
  }

  async listMembers(userId: string, campaignId: string) {
    await this.ensureAccess(userId, campaignId);
    const members = await this.membersRepository.find({
      where: { campaignId },
      relations: { user: true },
      order: { createdAt: 'ASC' }
    });

    return members.map((member) => ({
      id: member.id,
      campaignId: member.campaignId,
      userId: member.userId,
      role: member.role,
      displayName: member.user.displayName,
      email: member.user.email,
      createdAt: member.createdAt
    }));
  }

  async addMember(userId: string, campaignId: string, dto: AddCampaignMemberDto) {
    await this.ensureMaster(userId, campaignId);
    const targetUser = await this.usersRepository.findOne({ where: { email: dto.email.trim().toLowerCase(), isActive: true } });
    if (!targetUser) throw new NotFoundException('Usuário não encontrado. Ele precisa criar uma conta antes.');

    const existing = await this.membersRepository.findOne({ where: { campaignId, userId: targetUser.id } });
    if (existing) throw new ConflictException('Este usuário já participa da campanha.');

    const member = await this.membersRepository.save(this.membersRepository.create({
      campaignId,
      userId: targetUser.id,
      role: dto.role
    }));

    return {
      ...member,
      displayName: targetUser.displayName,
      email: targetUser.email
    };
  }

  async updateMember(userId: string, campaignId: string, memberId: string, dto: UpdateCampaignMemberDto) {
    const access = await this.ensureMaster(userId, campaignId);
    const member = await this.membersRepository.findOne({ where: { id: memberId, campaignId }, relations: { user: true } });
    if (!member) throw new NotFoundException('Membro não encontrado.');
    if (member.userId === access.campaign.ownerId) throw new ForbiddenException('O proprietário sempre permanece como mestre.');
    member.role = dto.role;
    const saved = await this.membersRepository.save(member);
    return { ...saved, displayName: member.user.displayName, email: member.user.email };
  }

  async removeMember(userId: string, campaignId: string, memberId: string) {
    const access = await this.ensureMaster(userId, campaignId);
    const member = await this.membersRepository.findOne({ where: { id: memberId, campaignId } });
    if (!member) throw new NotFoundException('Membro não encontrado.');
    if (member.userId === access.campaign.ownerId) throw new ForbiddenException('O proprietário não pode ser removido.');
    await this.membersRepository.remove(member);
    return { deleted: true, id: memberId };
  }

  private readBible(campaign: Campaign): CampaignBible | undefined {
    const bible = campaign.simulationState?.worldBible;
    if (!bible || typeof bible !== 'object') return undefined;
    return bible as CampaignBible;
  }

  private serializeCampaign(
    campaign: Campaign,
    accessRole: CampaignMemberRole,
    isOwner: boolean,
    counts: { hexCount: number; memberCount: number }
  ) {
    const { simulationState: _simulationState, ...safeCampaign } = campaign;
    const playerView = accessRole === CampaignMemberRole.PLAYER;
    const bible = this.readBible(campaign) ?? generateCampaignBible(campaign.seed);
    return {
      ...safeCampaign,
      seed: playerView ? '' : campaign.seed,
      radius: playerView ? 0 : campaign.radius,
      worldBible: playerView ? redactCampaignBibleForPlayer(bible) : bible,
      solarDecayStage: Number(campaign.simulationState?.solarDecayStage ?? 1),
      hexCount: counts.hexCount,
      memberCount: counts.memberCount,
      accessRole,
      isOwner
    };
  }

  async ensureAccess(userId: string, campaignId: string): Promise<CampaignAccess> {
    const campaign = await this.campaignsRepository.findOne({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campanha não encontrada.');

    if (campaign.ownerId === userId) {
      return { campaign, accessRole: CampaignMemberRole.MASTER, isOwner: true };
    }

    const membership = await this.membersRepository.findOne({ where: { campaignId, userId } });
    if (!membership) throw new NotFoundException('Campanha não encontrada ou sem acesso.');
    return { campaign, accessRole: membership.role, isOwner: false };
  }

  async ensureMaster(userId: string, campaignId: string) {
    const access = await this.ensureAccess(userId, campaignId);
    if (access.accessRole !== CampaignMemberRole.MASTER) {
      throw new ForbiddenException('Apenas mestres podem alterar esta parte da campanha.');
    }
    return access;
  }
}
