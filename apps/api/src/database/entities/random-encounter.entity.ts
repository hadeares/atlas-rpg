import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { Campaign } from './campaign.entity';
import { DayPeriod } from './day-period.enum';
import { Hex } from './hex.entity';
import { User } from './user.entity';
import type { CreatureStatBlock } from './creature-template.entity';

export enum EncounterStatus {
  RASCUNHO = 'RASCUNHO',
  PREPARADO = 'PREPARADO',
  ATIVO = 'ATIVO',
  CONCLUIDO = 'CONCLUIDO',
  IGNORADO = 'IGNORADO',
  CANCELADO = 'CANCELADO'
}

export enum EncounterCategory {
  ALEATORIO = 'ALEATORIO',
  CRIATURA = 'CRIATURA',
  MONSTRO = 'MONSTRO',
  HORROR = 'HORROR',
  SOCIAL = 'SOCIAL',
  VIAJANTE = 'VIAJANTE',
  FACCAO = 'FACCAO',
  DESCOBERTA = 'DESCOBERTA',
  VESTIGIO = 'VESTIGIO',
  PERIGO_NATURAL = 'PERIGO_NATURAL',
  CLIMA = 'CLIMA',
  RECURSO = 'RECURSO',
  RUINA = 'RUINA',
  RUMOR = 'RUMOR',
  CONSEQUENCIA = 'CONSEQUENCIA'
}

export enum EncounterIntensity {
  QUALQUER = 'QUALQUER',
  TRANQUILA = 'TRANQUILA',
  CURIOSA = 'CURIOSA',
  PREOCUPANTE = 'PREOCUPANTE',
  PERIGOSA = 'PERIGOSA',
  MORTAL = 'MORTAL'
}

export enum EncounterCombatPreference {
  QUALQUER = 'QUALQUER',
  SEM_COMBATE = 'SEM_COMBATE',
  COMBATE_POSSIVEL = 'COMBATE_POSSIVEL',
  COMBATE_PROVAVEL = 'COMBATE_PROVAVEL',
  APENAS_SINAIS = 'APENAS_SINAIS'
}

export enum EncounterLoreRelation {
  LORE_EXISTENTE = 'LORE_EXISTENTE',
  NOVO_COMPATIVEL = 'NOVO_COMPATIVEL',
  RUMOR = 'RUMOR',
  MONSTRO_LOCAL = 'MONSTRO_LOCAL',
  HORROR_LOCAL = 'HORROR_LOCAL',
  FACCAO = 'FACCAO'
}

export interface EncounterCheck {
  skill: string;
  dc: number;
  success: string;
  failure: string;
}

export interface EncounterParticipant {
  name: string;
  type: string;
  count: string;
  role: string;
}

export interface EncounterContent {
  categoryLabel: string;
  intensityLabel: string;
  combatLikelihood: string;
  truth: string;
  objective: string;
  behavior: string;
  signs: string[];
  clues: string[];
  checks: EncounterCheck[];
  complications: string[];
  peacefulSolutions: string[];
  consequences: string[];
  rewards: string[];
  loreConnection: string;
  dangerAssessment: string;
  statBlockSuggestion: string;
  participants: EncounterParticipant[];
  revealableFragments: string[];
  masterQuestions: string[];
  creatures: CreatureStatBlock[];
  creatureNarration?: string;
}

@Entity('random_encounters')
@Index('IDX_encounter_campaign_created', ['campaignId', 'createdAt'])
@Index('IDX_encounter_campaign_hex_status', ['campaignId', 'q', 'r', 'status'])
export class RandomEncounter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  campaignId: string;

  @ManyToOne(() => Campaign, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaignId' })
  campaign: Campaign;

  @Column({ type: 'uuid' })
  hexId: string;

  @ManyToOne(() => Hex, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'hexId' })
  hex: Hex;

  @Column({ type: 'integer' })
  q: number;

  @Column({ type: 'integer' })
  r: number;

  @Column({ type: 'integer' })
  day: number;

  @Column({ type: 'enum', enum: DayPeriod, enumName: 'day_period_enum' })
  period: DayPeriod;

  @Column({ type: 'enum', enum: EncounterStatus, enumName: 'random_encounter_status_enum', default: EncounterStatus.RASCUNHO })
  status: EncounterStatus;

  @Column({ type: 'enum', enum: EncounterCategory, enumName: 'random_encounter_category_enum' })
  category: EncounterCategory;

  @Column({ type: 'enum', enum: EncounterIntensity, enumName: 'random_encounter_intensity_enum' })
  intensity: EncounterIntensity;

  @Column({ type: 'enum', enum: EncounterCombatPreference, enumName: 'random_encounter_combat_enum' })
  combatPreference: EncounterCombatPreference;

  @Column({ type: 'enum', enum: EncounterLoreRelation, enumName: 'random_encounter_relation_enum' })
  loreRelation: EncounterLoreRelation;

  @Column({ length: 180 })
  title: string;

  @Column({ type: 'text' })
  publicNarration: string;

  @Column({ type: 'text' })
  masterSummary: string;

  @Column({ length: 160 })
  generationSeed: string;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  generatorOptions: Record<string, unknown>;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  content: EncounterContent;

  @Column({ type: 'text', nullable: true })
  resolutionNotes: string | null;

  @Column({ type: 'uuid' })
  createdById: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column({ type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  resolvedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
