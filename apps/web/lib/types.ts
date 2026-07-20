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


export interface CampaignRegion {
  id: string;
  name: string;
  epithet: string;
  theme: string;
  publicDescription: string;
  secret?: string;
  dominantFaction: string;
  signatureCreature: string;
  rareResource: string;
  centralMystery: string;
  blackStarManifestation: string;
  solarDecaySign: string;
}

export interface CampaignBible {
  schemaVersion: number;
  title: string;
  subtitle: string;
  publicPremise: string;
  openingNarration: string;
  tone: string[];
  themes: string[];
  playerKnowledge: string[];
  centralQuestion?: string;
  blackStar: {
    publicDescription: string;
    commonNames: string[];
    signs: string[];
    falseBeliefs?: string[];
    secretNature?: string;
  };
  catastrophe: {
    name: string;
    wizardName: string;
    wizardTitle: string;
    experimentName: string;
    siteName: string;
    intention: string;
    failure?: string;
    immediateConsequences: string[];
    survivingEvidence?: string[];
  };
  portal: {
    name: string;
    publicLore: string;
    secretMechanism?: string;
    anchors?: Array<{ name: string; purpose: string; currentState: string; clue: string }>;
    closingRequirements?: string[];
    closingRisks?: string[];
  };
  sunEater: {
    name: string;
    epithets: string[];
    publicSigns: string[];
    truth?: string;
    impossibleBattle?: string;
    stages: Array<{ stage: number; name: string; visibleEffect: string; worldEffect: string }>;
  };
  factions: Array<{ name: string; publicGoal: string; secretGoal?: string; method: string; relationToPortal?: string }>;
  relics: Array<{ name: string; appearance: string; publicLegend: string; truePurpose?: string; cost?: string }>;
  worldTruths?: string[];
  campaignActs: Array<{ act: number; title: string; objective: string; revelations?: string[]; failurePressure?: string }>;
  masterTimeline?: Array<{ era: string; event: string }>;
  regions: CampaignRegion[];
  narrativeDirection?: {
    horror: number; survival: number; ruins: number; politics: number; mutation: number; magicRarity: number; guidance: string[];
  };
}

export interface CampaignWeather {
  condition: string;
  visibility: 'BOA' | 'MEDIA' | 'BAIXA';
  trend: 'ESTAVEL' | 'MELHORA' | 'PIORA';
  startedAt: { day: number; period: string };
  expiresAfterPeriods: number;
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
  worldBible?: CampaignBible;
  solarDecayStage?: number;
  currentWeather?: CampaignWeather | null;
  inviteCode?: string;
}

export interface CampaignEventData {
  id: string;
  campaignId: string;
  type: string;
  day: number;
  period: DayPeriod;
  payload: Record<string, unknown>;
  createdAt: string;
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
    camp?: string;
    dawn?: string;
    badWeather?: string;
    aftermath?: string;
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
  terrainChallenges?: Array<{
    name: string;
    description: string;
    check?: string;
    failure?: string;
    alternative?: string;
  }>;
  discoveries?: Array<{
    name: string;
    description: string;
    requirement: string;
    reward?: string;
    secret?: string;
  }>;
  localCulture?: {
    custom: string;
    taboo?: string;
    trade: string;
    conflict?: string;
  };
  storyHooks?: Array<{
    title: string;
    hook: string;
    escalation?: string;
    resolution?: string;
  }>;
  cosmicPatterns?: Array<{
    manifestation: string;
    trigger?: string;
    effect: string;
    clue: string;
  }>;
  historyLayers?: {
    beforeCatastrophe: string;
    duringExperiment: string;
    afterOpening: string;
    currentState: string;
  };
  region?: CampaignRegion;
  revelationLayers?: {
    sensed: string;
    observed: string;
    investigated: string;
    confirmed: string;
    understood: string;
  };
  campaignConnections?: {
    blackStarSign: string;
    portalEcho: string;
    solarDecaySign: string;
    linkedFaction: string;
    linkedRelic: string;
    objectiveClue: string;
    linkedHexHints: string[];
  };
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
export type CosmicCreatureArchetype = 'RANDOM' | 'STALKER' | 'BRUTE' | 'CONTROLLER' | 'ARTILLERY' | 'SWARM' | 'BOSS' | 'ORACLE' | 'LEECH' | 'SHAPER' | 'HERALD';
export type CosmicCreatureOrigin = 'RANDOM' | 'FERIDA' | 'VAZIO' | 'SONHO' | 'CRISTAL' | 'TEMPO' | 'PARASITA' | 'ABISMO' | 'ESTRELA_NEGRA' | 'ECLIPSE' | 'CINZA_SOLAR' | 'ESPELHO' | 'FOME';
export type CosmicCreatureMutation = 'RANDOM' | 'FRACTAL' | 'MULTIMEMBROS' | 'CORO' | 'OCO' | 'ESPELHO' | 'CICATRIZ_SOLAR' | 'PARASITARIA' | 'GEOMETRICA' | 'FLUTUANTE';
export type CosmicCreatureTemperament = 'RANDOM' | 'CURIOSO' | 'PREDATORIO' | 'RITUALISTICO' | 'PROTETOR' | 'COLETOR' | 'EMISSARIO' | 'FAMINTO' | 'DORMENTE';

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
  appearanceProfile?: {
    silhouette: string;
    anatomy: string;
    surface: string;
    movement: string;
    face: string;
    aura: string;
    voice: string;
    odor: string;
  };
  originStory?: string;
  cosmicConcept?: string;
  cosmicMutation?: string;
  cosmicTemperament?: string;
  portalConnection?: string;
  combatPhases?: Array<{
    name: string;
    trigger: string;
    effect: string;
  }>;
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

export interface CombatParticipant {
  id: string;
  name: string;
  initiative: number;
  isPlayerCharacter: boolean;
  hitPoints?: number;
  maxHitPoints?: number;
  notes?: string;
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
  initiativeOrder: CombatParticipant[];
  combatRound: number;
  currentTurnIndex: number;
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
