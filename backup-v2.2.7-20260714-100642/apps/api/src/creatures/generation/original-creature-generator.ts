import { BiomeType, Hex } from '../../database/entities/hex.entity';
import {
  CreatureAction,
  CreatureSource,
  CreatureStatBlock,
  CreatureTheme,
  CreatureTrait
} from '../../database/entities/creature-template.entity';

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function random(seed: string) {
  let value = hashString(seed) + 0x6d2b79f5;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(items: readonly T[], next: () => number): T {
  return items[Math.floor(next() * items.length) % items.length];
}

const prefixes = ['Oco', 'Velado', 'Cinzento', 'Sussurrante', 'Pálido', 'Quebrado', 'Sem-Rosto', 'Ferrugem', 'Sepulcral'];
const cosmicNouns = ['Observador', 'Pastor de Estrelas', 'Devorador de Ecos', 'Filho da Fenda', 'Arauto do Subsolo', 'Nascido da Ferida'];
const infectedNouns = ['Lobo', 'Cervo', 'Peregrino', 'Guardião', 'Caçador', 'Mineiro', 'Corvo', 'Javali'];
const randomNouns = ['Rastejante', 'Predador', 'Errante', 'Sentinela', 'Catador', 'Emboscador', 'Parasita'];

const biomeDescriptors: Partial<Record<BiomeType, string[]>> = {
  [BiomeType.CAMPOS_CINZENTOS]: ['coberto por cinza fina', 'com capim morto preso às articulações'],
  [BiomeType.BOSQUE_MORTO]: ['envolto em casca ressecada', 'com galhos crescendo sob a pele'],
  [BiomeType.MATA_PALIDA]: ['de pele branca e translúcida', 'marcado por veios semelhantes a raízes'],
  [BiomeType.TERRAS_ALTAS]: ['com placas de pedra nas costas', 'adaptado aos ventos cortantes'],
  [BiomeType.PICOS_NEGROS]: ['com olhos que refletem o céu', 'coberto por gelo escuro'],
  [BiomeType.BREJO_SILENCIOSO]: ['encharcado e coberto de fungos', 'com membros longos para atravessar a lama'],
  [BiomeType.AGUAS_MORTAS]: ['com membranas pálidas', 'exalando cheiro de água parada'],
  [BiomeType.CICATRIZ_ANTIGA]: ['marcado por inscrições naturais', 'com partes que parecem pedra trabalhada'],
  [BiomeType.ERMO_DE_CINZAS]: ['desidratado e leve demais', 'deixando rastros de pó negro'],
  [BiomeType.ZONA_DA_FERIDA]: ['com anatomia impossível', 'mudando de forma quando não é observado']
};

const crXp: Array<[number, number]> = [
  [0, 10], [0.125, 25], [0.25, 50], [0.5, 100], [1, 200], [2, 450], [3, 700], [4, 1100], [5, 1800],
  [6, 2300], [7, 2900], [8, 3900], [9, 5000], [10, 5900], [11, 7200], [12, 8400], [13, 10000],
  [14, 11500], [15, 13000], [16, 15000], [17, 18000], [18, 20000], [19, 22000], [20, 25000]
];

function proficiencyForCr(cr: number) {
  if (cr < 5) return 2;
  if (cr < 9) return 3;
  if (cr < 13) return 4;
  if (cr < 17) return 5;
  return 6;
}

function xpForCr(cr: number) {
  return crXp.reduce((best, item) => Math.abs(item[0] - cr) < Math.abs(best[0] - cr) ? item : best, crXp[0])[1];
}

function challengeLabel(cr: number) {
  if (cr === 0.125) return '1/8';
  if (cr === 0.25) return '1/4';
  if (cr === 0.5) return '1/2';
  return String(cr);
}

function abilityModifier(score: number) {
  return Math.floor((score - 10) / 2);
}

function commonActions(name: string, cr: number, theme: CreatureTheme, next: () => number): CreatureAction[] {
  const proficiency = proficiencyForCr(cr);
  const attackBonus = Math.max(3, proficiency + 3 + Math.floor(cr / 6));
  const dieCount = Math.max(1, Math.ceil(cr / 3));
  const primaryDamage = `${dieCount}d8 + ${Math.max(2, 2 + Math.floor(cr / 3))}`;
  const actions: CreatureAction[] = [{
    name: pick(['Garras', 'Mordida', 'Golpe deformado', 'Lâmina óssea'], next),
    description: `${name} realiza um ataque corpo a corpo. Em um acerto, causa ${primaryDamage} de dano e empurra o alvo 1,5 m se ele falhar em um teste de resistência de Força.`,
    attackBonus,
    damage: primaryDamage,
    damageType: theme === CreatureTheme.COSMIC ? 'psíquico ou cortante' : theme === CreatureTheme.INFECTED ? 'perfurante e necrótico' : 'cortante'
  }];

  if (cr >= 3) {
    actions.push({
      name: theme === CreatureTheme.COSMIC ? 'Pulso da Ferida' : theme === CreatureTheme.INFECTED ? 'Esporos da Infecção' : 'Investida brutal',
      description: theme === CreatureTheme.COSMIC
        ? 'Criaturas em um raio de 4,5 m fazem um teste de resistência de Sabedoria. Em uma falha, sofrem dano psíquico e não podem realizar reações até o próximo turno.'
        : theme === CreatureTheme.INFECTED
          ? 'Uma nuvem de partículas cobre uma área próxima. Criaturas na área fazem um teste de Constituição; em falha, ficam Envenenadas até o fim do próximo turno.'
          : 'A criatura avança até seu deslocamento e ataca. Se acertar após mover pelo menos 6 m, causa dano adicional.',
      recharge: 'Recarga 5–6'
    });
  }
  return actions;
}

function thematicTraits(theme: CreatureTheme, cr: number): CreatureTrait[] {
  const traits: CreatureTrait[] = [];
  if (theme === CreatureTheme.COSMIC) {
    traits.push({ name: 'Geometria Impossível', description: 'Ataques de oportunidade contra a criatura são feitos com desvantagem, pois sua posição parece mudar entre instantes.' });
    if (cr >= 5) traits.push({ name: 'Presença Incompreensível', description: 'Uma criatura que inicia o turno próxima deve superar um teste de Sabedoria ou sofrer uma breve distorção sensorial.' });
  } else if (theme === CreatureTheme.INFECTED) {
    traits.push({ name: 'Carne Contaminada', description: 'Quando sofre dano corpo a corpo, a criatura pode liberar fluidos ou esporos; o atacante deve superar um teste de Constituição ou não pode recuperar pontos de vida até o início do próximo turno.' });
    if (cr >= 5) traits.push({ name: 'Não Sente Dor', description: 'A primeira vez que seria reduzida a 0 pontos de vida, fica com 1 ponto de vida, salvo se tiver sofrido dano radiante desde o último turno.' });
  } else {
    traits.push({ name: 'Predador do Ermo', description: 'A criatura tem vantagem em testes para rastrear criaturas feridas ou isoladas em seu ambiente.' });
  }
  return traits;
}

export function generateOriginalCreature(
  seed: string,
  theme: CreatureTheme,
  targetCr: number,
  hex?: Pick<Hex, 'biome' | 'dangerLevel' | 'cosmicInfluence'>,
  base?: CreatureStatBlock
): CreatureStatBlock {
  const next = random(seed);
  const cr = Math.max(0.125, Math.min(20, targetCr || 1));
  const resolvedTheme = theme === CreatureTheme.RANDOM
    ? pick([CreatureTheme.STANDARD, CreatureTheme.COSMIC, CreatureTheme.INFECTED], next)
    : theme;
  const noun = base?.name ?? (resolvedTheme === CreatureTheme.COSMIC
    ? pick(cosmicNouns, next)
    : resolvedTheme === CreatureTheme.INFECTED
      ? pick(infectedNouns, next)
      : pick(randomNouns, next));
  const name = base
    ? `${base.name} ${resolvedTheme === CreatureTheme.COSMIC ? 'da Ferida' : resolvedTheme === CreatureTheme.INFECTED ? 'Infectado' : 'Alterado'}`
    : `${pick(prefixes, next)} ${noun}`;
  const descriptor = pick(biomeDescriptors[hex?.biome ?? BiomeType.ERMO_DE_CINZAS] ?? ['adaptado ao ermo'], next);
  const size = base?.size ?? (cr < 1 ? 'Pequeno' : cr < 5 ? 'Médio' : cr < 12 ? 'Grande' : 'Enorme');
  const armorClass = Math.max(base?.armorClass ?? 0, 11 + Math.min(7, Math.floor(cr / 2)) + (next() > 0.6 ? 1 : 0));
  const hitPoints = Math.round((base?.hitPoints ?? (18 + cr * 15)) * (resolvedTheme === CreatureTheme.INFECTED ? 1.12 : 1));
  const hitDice = base?.hitDice ?? `${Math.max(2, Math.ceil(hitPoints / 8))}d8 + ${Math.max(0, Math.floor(cr * 2))}`;
  const proficiencyBonus = proficiencyForCr(cr);
  const abilities = base?.abilities ?? {
    str: 12 + Math.min(10, Math.floor(cr / 2)),
    dex: 11 + Math.floor(next() * 5),
    con: 13 + Math.min(9, Math.floor(cr / 2)),
    int: resolvedTheme === CreatureTheme.COSMIC ? 10 + Math.floor(cr / 3) : 5 + Math.floor(next() * 6),
    wis: 11 + Math.floor(next() * 5),
    cha: resolvedTheme === CreatureTheme.COSMIC ? 12 + Math.floor(cr / 3) : 6 + Math.floor(next() * 6)
  };
  const narration = resolvedTheme === CreatureTheme.COSMIC
    ? `A criatura não entra no campo de visão de uma vez. Primeiro surge a sombra, depois membros em ângulos que não acompanham o corpo. ${name} é ${descriptor}, e o ar ao redor pulsa como uma respiração contida.`
    : resolvedTheme === CreatureTheme.INFECTED
      ? `Um ruído úmido precede a aparição. ${name} avança com movimentos interrompidos, ${descriptor}; partes de seu corpo parecem continuar reagindo mesmo quando o restante fica imóvel.`
      : `Entre a vegetação e as cinzas surge ${name}, ${descriptor}. Ele observa o grupo em silêncio antes de escolher entre recuar, seguir ou atacar.`;

  const traits = [...(base?.traits ?? []), ...thematicTraits(resolvedTheme, cr)];
  const actions = [...(base?.actions ?? commonActions(name, cr, resolvedTheme, next))];

  return {
    name,
    baseName: base?.name,
    source: CreatureSource.ORIGINAL,
    theme: resolvedTheme,
    size,
    type: resolvedTheme === CreatureTheme.COSMIC ? 'Aberração' : resolvedTheme === CreatureTheme.INFECTED ? 'Monstruosidade infectada' : base?.type ?? 'Monstruosidade',
    alignment: base?.alignment ?? 'Sem alinhamento',
    armorClass,
    armorDescription: base?.armorDescription ?? 'armadura natural',
    hitPoints,
    hitDice,
    speed: base?.speed ?? { walk: '9 m' },
    abilities,
    savingThrows: base?.savingThrows ?? { con: abilityModifier(abilities.con) + proficiencyBonus, wis: abilityModifier(abilities.wis) + proficiencyBonus },
    skills: base?.skills ?? { perception: abilityModifier(abilities.wis) + proficiencyBonus, stealth: abilityModifier(abilities.dex) + proficiencyBonus },
    damageVulnerabilities: base?.damageVulnerabilities ?? (resolvedTheme === CreatureTheme.INFECTED ? ['radiante'] : []),
    damageResistances: [...new Set([...(base?.damageResistances ?? []), ...(resolvedTheme === CreatureTheme.COSMIC ? ['psíquico'] : resolvedTheme === CreatureTheme.INFECTED ? ['necrótico'] : [])])],
    damageImmunities: base?.damageImmunities ?? [],
    conditionImmunities: [...new Set([...(base?.conditionImmunities ?? []), ...(resolvedTheme === CreatureTheme.COSMIC ? ['Amedrontado'] : [])])],
    senses: [...new Set([...(base?.senses ?? []), resolvedTheme === CreatureTheme.COSMIC ? 'visão no escuro 36 m' : 'visão no escuro 18 m', `Percepção passiva ${10 + abilityModifier(abilities.wis) + proficiencyBonus}`])],
    languages: base?.languages?.length ? base.languages : resolvedTheme === CreatureTheme.COSMIC ? ['compreende idiomas, telepatia 18 m'] : ['—'],
    challengeRating: cr,
    challengeLabel: challengeLabel(cr),
    experiencePoints: xpForCr(cr),
    proficiencyBonus,
    traits,
    actions,
    bonusActions: base?.bonusActions ?? [],
    reactions: base?.reactions ?? [],
    legendaryActions: cr >= 10 ? [{ name: 'Movimento antinatural', description: 'A criatura se move até metade do deslocamento sem provocar ataques de oportunidade.' }] : base?.legendaryActions ?? [],
    description: `${name} é uma criatura original do Atlas das Cinzas, ${descriptor}. Seu comportamento é moldado pelo terreno e pela influência sobrenatural da região.`,
    narration,
    signs: resolvedTheme === CreatureTheme.COSMIC
      ? ['sombras apontando para direções diferentes', 'objetos vibrando sem vento', 'lembranças breves que não pertencem aos personagens']
      : resolvedTheme === CreatureTheme.INFECTED
        ? ['odor adocicado de decomposição', 'pelos, penas ou pele com cristais negros', 'animais menores fugindo em silêncio']
        : ['rastros recentes', 'restos de alimento', 'marcas de território'],
    behavior: resolvedTheme === CreatureTheme.COSMIC ? 'Testa a percepção das presas antes de se aproximar.' : resolvedTheme === CreatureTheme.INFECTED ? 'Ataca por impulsos e protege focos de contaminação.' : 'Age como predador territorial e evita riscos desnecessários.',
    tactics: resolvedTheme === CreatureTheme.COSMIC ? 'Isola alvos, altera posições e explora baixa visibilidade.' : resolvedTheme === CreatureTheme.INFECTED ? 'Avança sem recuar, espalha condições e prende alvos.' : 'Embosca, busca terreno favorável e foge quando gravemente ferida.',
    weakness: resolvedTheme === CreatureTheme.COSMIC ? 'Padrões repetitivos, luz intensa ou interrupção do foco que a ancora no local.' : resolvedTheme === CreatureTheme.INFECTED ? 'Dano radiante, fogo controlado ou remoção do foco de contaminação.' : 'Pode ser distraída por alimento, território ou ameaça maior.',
    rewards: ['componentes incomuns', 'pista sobre a origem da criatura', 'materiais úteis para a fortaleza'],
    license: 'Conteúdo original do Atlas das Cinzas.'
  };
}
