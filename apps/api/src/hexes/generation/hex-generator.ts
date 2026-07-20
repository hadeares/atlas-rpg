import { CampaignBible, generateCampaignBible, resolveCampaignRegion } from '../../campaigns/generation/campaign-bible-generator';
import { BiomeType, DiscoveryStatus, TerrainType } from '../../database/entities/hex.entity';
import { generateHexLore, RegionNameTracker } from './lore-generator';

export interface GeneratedHexData {
  q: number;
  r: number;
  terrain: TerrainType;
  biome: BiomeType;
  elevation: number;
  moisture: number;
  temperature: number;
  dangerLevel: number;
  cosmicInfluence: number;
  discoveryStatus: DiscoveryStatus;
  publicName: string | null;
  masterNotes: string | null;
  state: Record<string, unknown>;
}

function clamp(value: number, minimum = 0, maximum = 1) {
  return Math.min(maximum, Math.max(minimum, value));
}

function hashString(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function randomFrom(seed: string, q: number, r: number, channel: string) {
  let value = hashString(`${seed}:${q}:${r}:${channel}`);
  value += 0x6d2b79f5;
  let result = value;
  result = Math.imul(result ^ (result >>> 15), result | 1);
  result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
  return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
}

function rounded(value: number) {
  return Number(value.toFixed(4));
}

function getTerrain(elevation: number, moisture: number, cosmicInfluence: number, ruinChance: number) {
  if (cosmicInfluence >= 82) return TerrainType.REGIAO_CONTAMINADA;
  if (ruinChance > 0.965) return TerrainType.RUINAS;
  if (elevation >= 0.78) return TerrainType.MONTANHA;
  if (elevation >= 0.64) return TerrainType.COLINA;
  if (moisture >= 0.8 && elevation < 0.42) return TerrainType.REGIAO_ALAGADA;
  if (moisture >= 0.68 && elevation < 0.5) return TerrainType.PANTANO;
  if (moisture >= 0.62) return TerrainType.FLORESTA_DENSA;
  if (moisture >= 0.46) return TerrainType.FLORESTA;
  if (moisture <= 0.23) return TerrainType.CAMPO_DEVASTADO;
  return TerrainType.PLANICIE;
}

// Cada terreno tem um bioma predominante e, para variar a paisagem entre
// hexágonos do mesmo terreno, um bioma alternativo mais raro e tematicamente
// vizinho. O sorteio é determinístico (mesma seed/q/r sempre dá o mesmo bioma).
const biomeVariants: Record<TerrainType, readonly [BiomeType, BiomeType, number]> = {
  [TerrainType.PLANICIE]: [BiomeType.CAMPOS_CINZENTOS, BiomeType.ERMO_DE_CINZAS, 0.78],
  [TerrainType.FLORESTA]: [BiomeType.BOSQUE_MORTO, BiomeType.MATA_PALIDA, 0.7],
  [TerrainType.FLORESTA_DENSA]: [BiomeType.MATA_PALIDA, BiomeType.BOSQUE_MORTO, 0.75],
  [TerrainType.COLINA]: [BiomeType.TERRAS_ALTAS, BiomeType.PICOS_NEGROS, 0.75],
  [TerrainType.MONTANHA]: [BiomeType.PICOS_NEGROS, BiomeType.TERRAS_ALTAS, 0.8],
  [TerrainType.PANTANO]: [BiomeType.BREJO_SILENCIOSO, BiomeType.AGUAS_MORTAS, 0.7],
  [TerrainType.REGIAO_ALAGADA]: [BiomeType.AGUAS_MORTAS, BiomeType.BREJO_SILENCIOSO, 0.72],
  [TerrainType.RUINAS]: [BiomeType.CICATRIZ_ANTIGA, BiomeType.ERMO_DE_CINZAS, 0.75],
  [TerrainType.CAMPO_DEVASTADO]: [BiomeType.ERMO_DE_CINZAS, BiomeType.CAMPOS_CINZENTOS, 0.75],
  [TerrainType.REGIAO_CONTAMINADA]: [BiomeType.ZONA_DA_FERIDA, BiomeType.ZONA_DA_FERIDA, 1]
};

function getBiome(terrain: TerrainType, variantRoll: number) {
  const [primary, alternate, primaryChance] = biomeVariants[terrain];
  return variantRoll < primaryChance ? primary : alternate;
}

export function generateHex(
  seed: string,
  q: number,
  r: number,
  worldBible?: CampaignBible,
  usedNames?: RegionNameTracker
): GeneratedHexData {
  if (q === 0 && r === 0) {
    return {
      q,
      r,
      terrain: TerrainType.PLANICIE,
      biome: BiomeType.CAMPOS_CINZENTOS,
      elevation: 0.35,
      moisture: 0.48,
      temperature: 0.52,
      dangerLevel: 2,
      cosmicInfluence: 10,
      discoveryStatus: DiscoveryStatus.MAPEADO,
      publicName: 'Vela Cinzenta',
      masterNotes: 'Ponto inicial da campanha.',
      state: {
        settlement: true,
        startingHex: true,
        visitCount: 0,
        lore: generateHexLore(seed, q, r, TerrainType.PLANICIE, BiomeType.CAMPOS_CINZENTOS, 2, 10, worldBible)
      }
    };
  }

  const regionalElevation = (
    Math.sin((q + 3) / 3.6) +
    Math.cos((r - 2) / 4.2) +
    Math.sin((q + r) / 5.4)
  ) / 3;
  const regionalMoisture = (
    Math.cos((q - 5) / 4.8) +
    Math.sin((r + 4) / 3.9) +
    Math.cos((q - r) / 6.1)
  ) / 3;
  const regionalTemperature = (
    Math.sin((q - r) / 8) +
    Math.cos(r / 9)
  ) / 2;
  const distance = Math.max(Math.abs(q), Math.abs(r), Math.abs(-q - r));
  const elevation = clamp(0.5 + regionalElevation * 0.34 + (randomFrom(seed, q, r, 'elevation') - 0.5) * 0.18);
  const moisture = clamp(0.5 + regionalMoisture * 0.36 + (randomFrom(seed, q, r, 'moisture') - 0.5) * 0.2);
  const temperature = clamp(0.52 + regionalTemperature * 0.2 - elevation * 0.2 + (randomFrom(seed, q, r, 'temperature') - 0.5) * 0.12);
  const cosmicBase = randomFrom(seed, q, r, 'cosmic');
  const cosmicWave = clamp((Math.sin((q + r) / 3.2) + 1) / 2);
  const cosmicInfluence = Math.round(clamp(cosmicBase * 0.58 + cosmicWave * 0.28 + distance * 0.012) * 100);
  const terrain = getTerrain(elevation, moisture, cosmicInfluence, randomFrom(seed, q, r, 'ruin'));
  const biome = getBiome(terrain, randomFrom(seed, q, r, 'biome-variant'));
  const dangerLevel = Math.min(10, Math.max(1, Math.round(1 + distance * 0.42 + cosmicInfluence / 20 + randomFrom(seed, q, r, 'danger') * 2)));
  const discoveryStatus = DiscoveryStatus.DESCONHECIDO;

  return {
    q,
    r,
    terrain,
    biome,
    elevation: rounded(elevation),
    moisture: rounded(moisture),
    temperature: rounded(temperature),
    dangerLevel,
    cosmicInfluence,
    discoveryStatus,
    publicName: null,
    masterNotes: null,
    state: {
      generatedBy: 'atlas-core-v2',
      generationSeed: `${seed}:${q}:${r}`,
      visitCount: 0,
      lore: generateHexLore(seed, q, r, terrain, biome, dangerLevel, cosmicInfluence, worldBible, usedNames)
    }
  };
}

export function generateHexGrid(seed: string, radius: number, worldBible?: CampaignBible) {
  const bible = worldBible ?? generateCampaignBible(seed);
  const hexes: GeneratedHexData[] = [];
  const regionNameTrackers = new Map<string, RegionNameTracker>();

  for (let q = -radius; q <= radius; q += 1) {
    const minimumR = Math.max(-radius, -q - radius);
    const maximumR = Math.min(radius, -q + radius);

    for (let r = minimumR; r <= maximumR; r += 1) {
      const regionId = resolveCampaignRegion(bible, seed, q, r).id;
      let tracker = regionNameTrackers.get(regionId);
      if (!tracker) {
        tracker = { titles: new Set<string>(), monsters: new Set<string>() };
        regionNameTrackers.set(regionId, tracker);
      }
      hexes.push(generateHex(seed, q, r, bible, tracker));
    }
  }

  return hexes;
}
