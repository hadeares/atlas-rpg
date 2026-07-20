import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsString, IsUUID, Length, Max, Min } from 'class-validator';
import {
  EncounterCategory,
  EncounterCombatPreference,
  EncounterIntensity,
  EncounterLoreRelation
} from '../../database/entities/random-encounter.entity';

export enum EncounterCreatureMode {
  ANY = 'ANY',
  SRD = 'SRD',
  ORIGINAL = 'ORIGINAL',
  COSMIC = 'COSMIC',
  INFECTED = 'INFECTED',
  CUSTOM = 'CUSTOM'
}

export enum CosmicCreatureArchetype {
  RANDOM = 'RANDOM',
  STALKER = 'STALKER',
  BRUTE = 'BRUTE',
  CONTROLLER = 'CONTROLLER',
  ARTILLERY = 'ARTILLERY',
  SWARM = 'SWARM',
  BOSS = 'BOSS'
}

export enum CosmicCreatureOrigin {
  RANDOM = 'RANDOM',
  FERIDA = 'FERIDA',
  VAZIO = 'VAZIO',
  SONHO = 'SONHO',
  CRISTAL = 'CRISTAL',
  TEMPO = 'TEMPO',
  PARASITA = 'PARASITA',
  ABISMO = 'ABISMO'
}

export class GenerateEncounterDto {
  @Type(() => Number)
  @IsInt()
  q: number;

  @Type(() => Number)
  @IsInt()
  r: number;

  @IsOptional()
  @IsEnum(EncounterCategory)
  category?: EncounterCategory;

  @IsOptional()
  @IsEnum(EncounterIntensity)
  intensity?: EncounterIntensity;

  @IsOptional()
  @IsEnum(EncounterCombatPreference)
  combatPreference?: EncounterCombatPreference;

  @IsOptional()
  @IsEnum(EncounterLoreRelation)
  loreRelation?: EncounterLoreRelation;

  @IsOptional()
  @IsEnum(EncounterCreatureMode)
  creatureMode?: EncounterCreatureMode;

  @IsOptional()
  @IsUUID()
  creatureTemplateId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  creatureCount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.125)
  @Max(30)
  targetCr?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  monsterLevel?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  partySize?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  averageLevel?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  generateCosmicCreature?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  saveGeneratedCreature?: boolean;

  @IsOptional()
  @IsEnum(CosmicCreatureArchetype)
  cosmicArchetype?: CosmicCreatureArchetype;

  @IsOptional()
  @IsEnum(CosmicCreatureOrigin)
  cosmicOrigin?: CosmicCreatureOrigin;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  notes?: string;
}
