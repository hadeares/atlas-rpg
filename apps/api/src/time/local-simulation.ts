import { Campaign } from '../database/entities/campaign.entity';
import { HexLore } from '../hexes/generation/lore-generator';

export interface LocalWeatherState {
  condition: string;
  visibility: 'BOA' | 'MEDIA' | 'BAIXA';
  trend: 'ESTAVEL' | 'MELHORA' | 'PIORA';
  startedAt: {
    day: number;
    period: string;
  };
  expiresAfterPeriods: number;
}

export interface CampaignSimulationState extends Record<string, unknown> {
  currentWeather?: LocalWeatherState;
  lastTimeAdvance?: {
    from: { day: number; period: string };
    to: { day: number; period: string };
    processedTemporaryEffects: number;
  };
  temporaryEffects?: Array<{
    id: string;
    name: string;
    remainingPeriods: number;
    notes?: string;
  }>;
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function randomValue(seed: string) {
  let value = hashString(seed) + 0x6d2b79f5;
  value += 0x6d2b79f5;
  let result = value;
  result = Math.imul(result ^ (result >>> 15), result | 1);
  result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
  return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
}

function visibilityFor(condition: string): LocalWeatherState['visibility'] {
  const normalized = condition.toLowerCase();
  if (normalized.includes('neblina') || normalized.includes('tempestade') || normalized.includes('cinza')) return 'BAIXA';
  if (normalized.includes('chuva') || normalized.includes('garoa') || normalized.includes('vento')) return 'MEDIA';
  return 'BOA';
}

export function transitionLocalSimulation(
  campaign: Campaign,
  lore: HexLore | undefined,
  previousDay: number,
  previousPeriod: string
): CampaignSimulationState {
  const current = (campaign.simulationState ?? {}) as CampaignSimulationState;
  const common = lore?.weatherProfile?.common?.length ? lore.weatherProfile.common : ['céu encoberto', 'vento fraco', 'chuva irregular'];
  const roll = randomValue(`${campaign.seed}:${campaign.currentQ}:${campaign.currentR}:${campaign.currentDay}:${campaign.currentPeriod}:${campaign.version}:weather`);
  const previousWeather = current.currentWeather;
  let condition = previousWeather?.condition ?? common[0];
  let trend: LocalWeatherState['trend'] = 'ESTAVEL';

  if (!previousWeather || previousWeather.expiresAfterPeriods <= 1 || roll > 0.68) {
    const index = Math.floor(roll * common.length) % common.length;
    condition = common[index];
    trend = previousWeather && previousWeather.condition !== condition
      ? roll > 0.84 ? 'PIORA' : 'MELHORA'
      : 'ESTAVEL';
  }

  const temporaryEffects = (current.temporaryEffects ?? [])
    .map((effect) => ({ ...effect, remainingPeriods: effect.remainingPeriods - 1 }))
    .filter((effect) => effect.remainingPeriods > 0);

  return {
    ...current,
    currentWeather: {
      condition,
      visibility: visibilityFor(condition),
      trend,
      startedAt: previousWeather?.condition === condition
        ? previousWeather.startedAt
        : { day: campaign.currentDay, period: campaign.currentPeriod },
      expiresAfterPeriods: previousWeather?.condition === condition
        ? Math.max(1, previousWeather.expiresAfterPeriods - 1)
        : 1 + Math.floor(roll * 3)
    },
    temporaryEffects,
    lastTimeAdvance: {
      from: { day: previousDay, period: previousPeriod },
      to: { day: campaign.currentDay, period: campaign.currentPeriod },
      processedTemporaryEffects: (current.temporaryEffects ?? []).length - temporaryEffects.length
    }
  };
}

export function setTravelWeather(campaign: Campaign, weather: string, visibility: string): CampaignSimulationState {
  const current = (campaign.simulationState ?? {}) as CampaignSimulationState;
  return {
    ...current,
    currentWeather: {
      condition: weather,
      visibility: visibility === 'BAIXA' ? 'BAIXA' : visibility === 'MEDIA' ? 'MEDIA' : 'BOA',
      trend: 'ESTAVEL',
      startedAt: { day: campaign.currentDay, period: campaign.currentPeriod },
      expiresAfterPeriods: 1
    }
  };
}
