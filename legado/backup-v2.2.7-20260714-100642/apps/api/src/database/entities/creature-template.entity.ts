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

export enum CreatureSource {
  SRD = 'SRD',
  ORIGINAL = 'ORIGINAL',
  CUSTOM = 'CUSTOM'
}

export enum CreatureTheme {
  STANDARD = 'STANDARD',
  RANDOM = 'RANDOM',
  COSMIC = 'COSMIC',
  INFECTED = 'INFECTED'
}

export interface CreatureAbilityScores {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export interface CreatureTrait {
  name: string;
  description: string;
}

export interface CreatureAction {
  name: string;
  description: string;
  attackBonus?: number;
  damage?: string;
  damageType?: string;
  recharge?: string;
}

export interface CreatureSpeed {
  walk?: string;
  fly?: string;
  swim?: string;
  burrow?: string;
  climb?: string;
}

export interface CreatureStatBlock {
  id?: string;
  name: string;
  baseName?: string;
  source: CreatureSource;
  theme: CreatureTheme;
  size: string;
  type: string;
  alignment: string;
  armorClass: number;
  armorDescription?: string;
  hitPoints: number;
  hitDice: string;
  speed: CreatureSpeed;
  abilities: CreatureAbilityScores;
  savingThrows: Record<string, number>;
  skills: Record<string, number>;
  damageVulnerabilities: string[];
  damageResistances: string[];
  damageImmunities: string[];
  conditionImmunities: string[];
  senses: string[];
  languages: string[];
  challengeRating: number;
  challengeLabel: string;
  experiencePoints: number;
  proficiencyBonus: number;
  traits: CreatureTrait[];
  actions: CreatureAction[];
  bonusActions: CreatureAction[];
  reactions: CreatureAction[];
  legendaryActions: CreatureAction[];
  description: string;
  narration: string;
  signs: string[];
  behavior: string;
  tactics: string;
  weakness: string;
  rewards: string[];
  license?: string;
  externalUrl?: string;
}

@Entity('creature_templates')
@Index('IDX_creature_source_name', ['source', 'name'])
@Index('IDX_creature_campaign', ['campaignId'])
@Index('UQ_creature_external', ['source', 'externalIndex'], { unique: true, where: '"externalIndex" IS NOT NULL' })
export class CreatureTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  campaignId: string | null;

  @ManyToOne(() => Campaign, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'campaignId' })
  campaign: Campaign | null;

  @Column({ type: 'enum', enum: CreatureSource, enumName: 'creature_source_enum' })
  source: CreatureSource;

  @Column({ type: 'enum', enum: CreatureTheme, enumName: 'creature_theme_enum', default: CreatureTheme.STANDARD })
  theme: CreatureTheme;

  @Column({ length: 180 })
  name: string;

  @Column({ type: 'varchar', length: 180, nullable: true })
  externalIndex: string | null;

  @Column({ type: 'double precision', default: 0 })
  challengeRating: number;

  @Column({ length: 80 })
  creatureType: string;

  @Column({ type: 'jsonb' })
  statBlock: CreatureStatBlock;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
