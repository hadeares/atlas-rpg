export type DayPeriod = 'MANHA' | 'TARDE' | 'ANOITECER' | 'NOITE';
export type DiscoveryStatus = 'DESCONHECIDO' | 'AVISTADO' | 'ATRAVESSADO' | 'EXPLORADO' | 'MAPEADO';
export type CampaignRole = 'MASTER' | 'PLAYER';
export type UserRole = 'ADMIN' | 'USER';

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  isActive: boolean;
}

export interface AuthSession {
  accessToken: string;
  user: SessionUser;
}

export interface Campaign {
  id: string;
  name: string;
  description: string | null;
  seed: string;
  radius: number;
  currentDay: number;
  currentPeriod: DayPeriod;
  currentQ: number;
  currentR: number;
  version: number;
  ownerId: string;
  hexCount: number;
  memberCount: number;
  accessRole: CampaignRole;
  isOwner: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignLiveState {
  id: string;
  version: number;
  currentDay: number;
  currentPeriod: DayPeriod;
  currentQ: number;
  currentR: number;
  updatedAt: string;
}

export interface CampaignMember {
  id: string;
  campaignId: string;
  userId: string;
  role: CampaignRole;
  displayName: string;
  email: string;
  createdAt: string;
}

export interface HexLegend {
  title: string;
  text: string;
  truth?: string;
}

export interface HexRumor {
  text: string;
  reliability?: 'FALSO' | 'PARCIAL' | 'VERDADEIRO';
  source: string;
  truth?: string;
}

export interface HexFauna {
  name: string;
  abundance?: string;
  behavior: string;
  signs?: string;
  resource?: string;
}

export interface HexFlora {
  name: string;
  abundance?: string;
  appearance: string;
  use?: string;
  risk?: string;
}

export interface HexResource {
  name: string;
  category: string;
  availability?: string;
  access?: string;
  complication?: string;
}

export interface HexFeature {
  name: string;
  type: string;
  visible: boolean;
  playerDescription: string;
  masterDetails?: string;
  interaction?: string;
  suggestedCheck?: string;
}

export interface HexRoute {
  name: string;
  description: string;
  advantage?: string;
  danger?: string;
}

export interface HexMonster {
  name: string;
  threat: number;
  appearance?: string;
  signs: string;
  behavior: string;
  motive?: string;
  lair?: string;
  tactics?: string;
  weakness?: string;
  reward?: string;
  suggestedStatBlock?: string;
}

export interface HexNpc {
  name: string;
  role: string;
  appearance: string;
  manner: string;
  desire?: string;
  offer?: string;
  secret?: string;
}

export interface HexLore {
  schemaVersion?: number;
  title: string;
  overview: string;
  atmosphere: string;
  landmark: {
    name: string;
    description: string;
    hidden: boolean;
  };
  narration?: {
    approach?: string;
    arrival?: string;
    crossing?: string;
    exploration?: string;
    night?: string;
    landmarkDiscovery?: string;
  };
  sensoryDetails?: {
    sights: string[];
    sounds: string[];
    smells: string[];
    touch: string[];
  };
  features?: HexFeature[];
  routes?: HexRoute[];
  resources?: HexResource[];
  flora?: HexFlora[];
  history?: string;
  legends: HexLegend[];
  rumors: HexRumor[];
  fauna: HexFauna[];
  monsters?: HexMonster[];
  knownThreats?: HexMonster[];
  inhabitants?: HexNpc[];
  horror?: {
    name: string;
    stage: string;
    omens: string[];
    playerEffect?: string;
    effect?: string;
    truth?: string;
    escalation?: string[];
    containment?: string;
  };
  weatherProfile?: {
    common: string[];
    hazard?: string;
    clearSign?: string;
    stormSign?: string;
  };
  clues?: Array<{
    clue: string;
    reveals: string;
    location: string;
  }>;
  encounters?: Array<{
    title: string;
    type: string;
    setup: string;
    development: string;
    consequence: string;
  }>;
  masterGuide?: {
    premise: string;
    hiddenTruth: string;
    activeConflict: string;
    whatChangesIfIgnored: string;
    connections: string[];
    improvisationNotes: string[];
  };
  playerSummary?: string;
  secrets?: string;
}

export interface VisitState {
  weather: string;
  visibility: string;
  encounter?: {
    type: string;
    title: string;
    text: string;
  };
  generatedAt: {
    day: number;
    period: DayPeriod;
  };
  description: string;
  narration?: string;
  consequence?: string;
}

export interface HexState {
  lore?: HexLore;
  publicLore?: HexLore;
  lastVisit?: VisitState;
  lastDiscovery?: Record<string, unknown>;
  visitCount?: number;
  hasLore?: boolean;
  [key: string]: unknown;
}

export interface HexData {
  id: string;
  campaignId: string;
  q: number;
  r: number;
  terrain: string;
  biome: string;
  elevation: number;
  moisture: number;
  temperature: number;
  dangerLevel: number;
  cosmicInfluence: number;
  discoveryStatus: DiscoveryStatus;
  publicName: string | null;
  masterNotes: string | null;
  state: HexState;
}

export interface UserData {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MoveResult {
  campaign: Campaign;
  destination: HexData;
  changedHexes: HexData[];
  visit: VisitState;
}

export interface ExploreResult {
  campaign: Campaign;
  hex: HexData;
  discovery: Record<string, unknown>;
}

export type CreatureSource = 'SRD' | 'ORIGINAL' | 'CUSTOM';
export type CreatureTheme = 'STANDARD' | 'RANDOM' | 'COSMIC' | 'INFECTED';
export type EncounterStatus = 'RASCUNHO' | 'PREPARADO' | 'ATIVO' | 'CONCLUIDO' | 'IGNORADO' | 'CANCELADO';
export type EncounterCategory = 'ALEATORIO' | 'CRIATURA' | 'MONSTRO' | 'HORROR' | 'SOCIAL' | 'VIAJANTE' | 'FACCAO' | 'DESCOBERTA' | 'VESTIGIO' | 'PERIGO_NATURAL' | 'CLIMA' | 'RECURSO' | 'RUINA' | 'RUMOR' | 'CONSEQUENCIA';
export type EncounterIntensity = 'QUALQUER' | 'TRANQUILA' | 'CURIOSA' | 'PREOCUPANTE' | 'PERIGOSA' | 'MORTAL';
export type EncounterCombatPreference = 'QUALQUER' | 'SEM_COMBATE' | 'COMBATE_POSSIVEL' | 'COMBATE_PROVAVEL' | 'APENAS_SINAIS';
export type EncounterLoreRelation = 'LORE_EXISTENTE' | 'NOVO_COMPATIVEL' | 'RUMOR' | 'MONSTRO_LOCAL' | 'HORROR_LOCAL' | 'FACCAO';
export type EncounterCreatureMode = 'ANY' | 'SRD' | 'ORIGINAL' | 'COSMIC' | 'INFECTED' | 'CUSTOM';

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
  speed: Record<string, string | undefined>;
  abilities: { str: number; dex: number; con: number; int: number; wis: number; cha: number };
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

export interface CreatureTemplate {
  id: string;
  campaignId: string | null;
  source: CreatureSource;
  theme: CreatureTheme;
  name: string;
  externalIndex: string | null;
  challengeRating: number;
  creatureType: string;
  statBlock: CreatureStatBlock;
  isActive: boolean;
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

export interface RandomEncounter {
  id: string;
  campaignId: string;
  hexId: string;
  q: number;
  r: number;
  day: number;
  period: DayPeriod;
  status: EncounterStatus;
  category: EncounterCategory;
  intensity: EncounterIntensity;
  combatPreference: EncounterCombatPreference;
  loreRelation: EncounterLoreRelation;
  title: string;
  publicNarration: string;
  masterSummary: string;
  generationSeed: string;
  generatorOptions: Record<string, unknown>;
  content: EncounterContent;
  resolutionNotes: string | null;
  startedAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatureSyncStatus {
  running: boolean;
  startedAt: string | null;
  finishedAt: string | null;
  imported: number;
  total: number;
  failed: number;
  lastError: string | null;
  catalogCount: number;
}
