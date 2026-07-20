import { BiomeType, TerrainType } from '../../database/entities/hex.entity';

export interface HexLoreFeature {
  name: string;
  type: 'MARCO' | 'RUINA' | 'ABRIGO' | 'RECURSO' | 'PERIGO' | 'CAMINHO';
  visible: boolean;
  playerDescription: string;
  masterDetails: string;
  interaction: string;
  suggestedCheck: string;
}

export interface HexLoreFlora {
  name: string;
  abundance: 'RARA' | 'INCOMUM' | 'COMUM' | 'ABUNDANTE';
  appearance: string;
  use: string;
  risk: string;
}

export interface HexLoreFauna {
  name: string;
  abundance: 'RARA' | 'INCOMUM' | 'COMUM' | 'ABUNDANTE';
  behavior: string;
  signs: string;
  resource: string;
}

export interface HexLoreResource {
  name: string;
  category: 'AGUA' | 'COMIDA' | 'MATERIAL' | 'MEDICINAL' | 'COMBUSTIVEL';
  availability: 'ESCASSA' | 'LIMITADA' | 'SUFICIENTE' | 'ABUNDANTE';
  access: string;
  complication: string;
}

export interface HexLoreMonster {
  name: string;
  threat: number;
  appearance: string;
  signs: string;
  behavior: string;
  motive: string;
  lair: string;
  tactics: string;
  weakness: string;
  reward: string;
  suggestedStatBlock: string;
}

export interface HexLoreNpc {
  name: string;
  role: string;
  appearance: string;
  manner: string;
  desire: string;
  offer: string;
  secret: string;
}

export interface HexLore {
  schemaVersion: 3;
  title: string;
  overview: string;
  atmosphere: string;
  landmark: {
    name: string;
    description: string;
    hidden: boolean;
  };
  narration: {
    approach: string;
    arrival: string;
    crossing: string;
    exploration: string;
    night: string;
    landmarkDiscovery: string;
  };
  sensoryDetails: {
    sights: string[];
    sounds: string[];
    smells: string[];
    touch: string[];
  };
  features: HexLoreFeature[];
  routes: Array<{
    name: string;
    description: string;
    advantage: string;
    danger: string;
  }>;
  resources: HexLoreResource[];
  flora: HexLoreFlora[];
  history: string;
  legends: Array<{
    title: string;
    text: string;
    truth: string;
  }>;
  rumors: Array<{
    text: string;
    reliability: 'FALSO' | 'PARCIAL' | 'VERDADEIRO';
    source: string;
    truth: string;
  }>;
  fauna: HexLoreFauna[];
  monsters: HexLoreMonster[];
  inhabitants: HexLoreNpc[];
  horror: {
    name: string;
    stage: 'PRESSAGIO' | 'VESTIGIO' | 'MANIFESTACAO' | 'CONTATO';
    omens: string[];
    playerEffect: string;
    effect: string;
    truth: string;
    escalation: string[];
    containment: string;
  };
  weatherProfile: {
    common: string[];
    hazard: string;
    clearSign: string;
    stormSign: string;
  };
  clues: Array<{
    clue: string;
    reveals: string;
    location: string;
  }>;
  encounters: Array<{
    title: string;
    type: 'SOCIAL' | 'VESTIGIO' | 'FAUNA' | 'MONSTRO' | 'HORROR' | 'DESCOBERTA';
    setup: string;
    development: string;
    consequence: string;
  }>;
  masterGuide: {
    premise: string;
    hiddenTruth: string;
    activeConflict: string;
    whatChangesIfIgnored: string;
    connections: string[];
    improvisationNotes: string[];
  };
  playerSummary: string;
  secrets: string;
}

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

function pick<T>(items: readonly T[], next: () => number) {
  return items[Math.floor(next() * items.length) % items.length];
}

function pickDifferent<T>(items: readonly T[], first: T, next: () => number) {
  const remaining = items.filter((item) => item !== first);
  return pick(remaining.length > 0 ? remaining : items, next);
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function biomeName(biome: BiomeType) {
  return biome.toLowerCase().replaceAll('_', ' ');
}

const prefixes = ['Cinza', 'Pálido', 'Negro', 'Velado', 'Partido', 'Silente', 'Afogado', 'Oco', 'Quebrado', 'Morto', 'Esquecido', 'Ferido'];
const suffixes = ['Vale', 'Bosque', 'Coro', 'Dente', 'Vigília', 'Espelho', 'Manto', 'Altar', 'Fosso', 'Caminho', 'Limiar', 'Marco'];
const givenNames = ['Alda', 'Bran', 'Cira', 'Doren', 'Elda', 'Fenn', 'Gara', 'Havel', 'Iria', 'Jorren', 'Kael', 'Lysa', 'Mara', 'Neral', 'Oren', 'Pella', 'Rurik', 'Sava', 'Torven', 'Veya'];
const surnames = ['Cinza', 'Pedra', 'Corvo', 'Ramo', 'Ferro', 'Névoa', 'Vela', 'Vale', 'Sal', 'Vidro'];

const faunaByTerrain: Record<TerrainType, readonly string[]> = {
  [TerrainType.PLANICIE]: ['lebre de cinzas', 'corvo de campina', 'antílope pálido', 'raposa de cauda branca'],
  [TerrainType.FLORESTA]: ['cervo sem manchas', 'coruja cinzenta', 'javali de casca', 'raposa musgosa'],
  [TerrainType.FLORESTA_DENSA]: ['cervo oco', 'mariposa de vidro', 'lobo pálido', 'besouro de sal'],
  [TerrainType.COLINA]: ['cabra de pedra', 'falcão ferrugem', 'texugo das fendas', 'serpente fria'],
  [TerrainType.MONTANHA]: ['bode negro', 'águia cega', 'lagarto de ardósia', 'rato de neve'],
  [TerrainType.PANTANO]: ['garça de lodo', 'sapo de olhos leitosos', 'enguia de brejo', 'mosca de cinza'],
  [TerrainType.REGIAO_ALAGADA]: ['peixe translúcido', 'lontra negra', 'garça muda', 'caranguejo de limo'],
  [TerrainType.RUINAS]: ['rato de muralha', 'corvo de telhado', 'lagarto de cal', 'gato feral'],
  [TerrainType.CAMPO_DEVASTADO]: ['abutre de poeira', 'lagarto seco', 'rato de cinzas', 'cão feral'],
  [TerrainType.REGIAO_CONTAMINADA]: ['mariposa sem sombra', 'verme mineral', 'corvo de três vozes', 'cervo cristalino']
};

const floraByTerrain: Record<TerrainType, readonly string[]> = {
  [TerrainType.PLANICIE]: ['capim de cinza', 'flor de vigília', 'urtiga vermelha', 'junco seco'],
  [TerrainType.FLORESTA]: ['musgo de ferro', 'samambaia cinzenta', 'raiz amarga', 'cogumelo-lanterna'],
  [TerrainType.FLORESTA_DENSA]: ['lírio de osso', 'trepadeira muda', 'fungo de vidro', 'hera pálida'],
  [TerrainType.COLINA]: ['tomilho de pedra', 'arbusto ferrugem', 'flor do vento', 'líquen azul'],
  [TerrainType.MONTANHA]: ['pinheiro negro', 'líquen de sangue', 'erva da geada', 'rosa de ardósia'],
  [TerrainType.PANTANO]: ['junco febril', 'lírio do lodo', 'musgo sonolento', 'cogumelo do brejo'],
  [TerrainType.REGIAO_ALAGADA]: ['alga de prata', 'flor submersa', 'junco de sino', 'musgo aquático'],
  [TerrainType.RUINAS]: ['hera de cal', 'rosa de muralha', 'fungo de porão', 'erva de telhado'],
  [TerrainType.CAMPO_DEVASTADO]: ['espinho de cinza', 'flor de carvão', 'grama cortante', 'raiz seca'],
  [TerrainType.REGIAO_CONTAMINADA]: ['orquídea ocular', 'musgo pulsante', 'erva cristalina', 'lírio sem sombra']
};

const monstersByBiome: Record<BiomeType, readonly string[]> = {
  [BiomeType.CAMPOS_CINZENTOS]: ['Ceifador de Bruma', 'Cão do Marco Partido', 'Peregrino Sem Rosto'],
  [BiomeType.BOSQUE_MORTO]: ['Pastor de Galhos', 'Lobo da Casca', 'Viúva das Folhas'],
  [BiomeType.MATA_PALIDA]: ['Cervo Oco', 'Imitador de Vozes', 'Raiz que Caminha'],
  [BiomeType.TERRAS_ALTAS]: ['Gigante Encolhido', 'Caçador de Ecos', 'Cabra do Abismo'],
  [BiomeType.PICOS_NEGROS]: ['Sentinela de Obsidiana', 'Dragão de Cinzas Menor', 'Ave do Trovão Morto'],
  [BiomeType.BREJO_SILENCIOSO]: ['Noiva do Lodo', 'Sanguessuga de Memórias', 'Homem-Sapo Pálido'],
  [BiomeType.AGUAS_MORTAS]: ['Afogado Cantante', 'Enguia do Sino', 'Reflexo Faminto'],
  [BiomeType.CICATRIZ_ANTIGA]: ['Armadura Vazia', 'Escriba Sem Rosto', 'Guardião da Porta Cega'],
  [BiomeType.ERMO_DE_CINZAS]: ['Verme de Poeira', 'Cavaleiro Queimado', 'Fome de Ossos'],
  [BiomeType.ZONA_DA_FERIDA]: ['Fragmento Sonhador', 'Anjo Invertido', 'Observador Sob a Pedra']
};

const landmarksByTerrain: Record<TerrainType, readonly string[]> = {
  [TerrainType.PLANICIE]: ['um círculo de menires inclinados', 'uma torre de vigia caída', 'um campo de estátuas sem rosto'],
  [TerrainType.FLORESTA]: ['uma capela tomada por raízes', 'uma ponte de madeira que não apodrece', 'um carvalho marcado por centenas de nomes'],
  [TerrainType.FLORESTA_DENSA]: ['um altar enterrado entre raízes', 'uma aldeia engolida pelas árvores', 'um poço onde a luz não alcança'],
  [TerrainType.COLINA]: ['uma fortificação de pedra seca', 'uma estrada escavada na colina', 'um túmulo circular'],
  [TerrainType.MONTANHA]: ['uma porta talhada na rocha', 'um observatório quebrado', 'uma ponte suspensa sobre o vazio'],
  [TerrainType.PANTANO]: ['uma torre afundada', 'um cemitério de barcos', 'uma cabana sobre pernas de pedra'],
  [TerrainType.REGIAO_ALAGADA]: ['um campanário submerso', 'uma ilha coberta de ossos', 'um cais que leva a lugar nenhum'],
  [TerrainType.RUINAS]: ['um palácio sem teto', 'uma biblioteca lacrada', 'um mercado petrificado'],
  [TerrainType.CAMPO_DEVASTADO]: ['uma caravana fossilizada', 'um altar queimado', 'uma cratera vitrificada'],
  [TerrainType.REGIAO_CONTAMINADA]: ['uma coluna que pulsa', 'uma escadaria descendo para a pedra viva', 'um arco que mostra outro céu']
};

const routeByTerrain: Record<TerrainType, readonly string[]> = {
  [TerrainType.PLANICIE]: ['uma estrada de lajes rachadas', 'um caminho marcado por postes queimados'],
  [TerrainType.FLORESTA]: ['uma trilha de caçadores', 'um corredor de árvores antigas'],
  [TerrainType.FLORESTA_DENSA]: ['uma passagem entre raízes', 'um leito de riacho seco'],
  [TerrainType.COLINA]: ['uma senda sobre a crista', 'um corte estreito entre rochas'],
  [TerrainType.MONTANHA]: ['uma trilha de cabras', 'uma galeria parcialmente desabada'],
  [TerrainType.PANTANO]: ['uma faixa de terreno firme', 'uma passarela de troncos apodrecidos'],
  [TerrainType.REGIAO_ALAGADA]: ['uma sequência de ilhotas', 'um canal navegável estreito'],
  [TerrainType.RUINAS]: ['uma avenida soterrada', 'um túnel de serviço'],
  [TerrainType.CAMPO_DEVASTADO]: ['um sulco protegido do vento', 'uma rota entre crateras'],
  [TerrainType.REGIAO_CONTAMINADA]: ['um caminho onde a pedra não pulsa', 'uma linha de obeliscos partidos']
};

const rumorSources = ['um caçador ferido', 'uma velha cartógrafa', 'um mercador da Estrada Vermelha', 'um monge do Último Sol', 'uma criança que sonha acordada', 'um desertor da Ordem', 'um sobrevivente febril'];

function makeNarration(title: string, biome: BiomeType, landmark: string, monster: string, cosmicInfluence: number, next: () => number) {
  const biomeText = biomeName(biome);
  const approachDetails = [
    `À medida que vocês se aproximam de ${title}, o terreno de ${biomeText} parece absorver os sons da viagem. Ao longe, ${landmark} interrompe a linha do horizonte, mas a distância entre vocês e o marco parece variar cada vez que desviam o olhar.`,
    `O caminho para ${title} torna-se irregular. Marcas antigas surgem no solo, cobertas por cinza fina, enquanto ${landmark} aparece entre a névoa como uma lembrança incompleta de outro tempo.`,
    `Antes mesmo de entrar em ${title}, vocês percebem que os animais evitam a região. O único ponto constante é ${landmark}, visível em intervalos entre terreno quebrado e vegetação doente.`
  ];
  const arrivalDetails = [
    `Ao cruzar o limite da região, a temperatura cai de forma repentina. O ar tem gosto de ferro, pegadas antigas acompanham a rota e nenhum pássaro se aproxima de ${landmark}.`,
    `A primeira impressão é de abandono, mas há sinais recentes: vegetação partida, pedras movidas e pequenos montes de cinza organizados como se marcassem um caminho que ninguém admite usar.`,
    `O lugar parece imóvel demais. O vento continua soprando acima das árvores e rochas, porém nada ao redor de vocês se move com ele.`
  ];
  const crossingDetails = [
    `Durante a travessia, vocês encontram rastros de fauna comum misturados a marcas maiores que terminam sem explicação. Em alguns pontos, sons de passos acompanham o grupo por alguns segundos e cessam quando alguém para para escutar.`,
    `A rota obriga o grupo a contornar terreno instável. Pequenos sinais de ocupação surgem ao longo do caminho, mas todos parecem ter sido abandonados no mesmo instante.`,
    `O avanço é marcado por mudanças discretas na paisagem: a posição das sombras, o cheiro do solo e a direção do vento nunca permanecem iguais por muito tempo.`
  ];
  const explorationDetails = [
    `Uma busca cuidadosa revela camadas que não eram visíveis durante a travessia: símbolos sob a lama, restos de fogueiras frias e marcas de ferramentas em pedras antigas. Tudo parece conduzir, direta ou indiretamente, até ${landmark}.`,
    `Explorando fora da rota principal, o grupo encontra passagens menores, vestígios de coleta e sinais de que alguém observa os caminhos sem permanecer neles.`,
    `A região guarda mais do que mostra. Entre os acidentes naturais existem estruturas deliberadas, enterradas ou disfarçadas, indicando que o local foi importante muito antes da Ferida.`
  ];
  const nightDetails = [
    `Quando a noite alcança ${title}, a escuridão parece ocupar os espaços antes da luz desaparecer por completo. Sons distantes repetem o ritmo da respiração do grupo, e algo pesado se move na direção de ${landmark}.`,
    `À noite, pontos fracos de luz surgem longe do acampamento. Eles não se aproximam, mas mudam de posição sempre que ninguém os observa diretamente.`,
    `O silêncio noturno é interrompido por uma voz que pronuncia nomes conhecidos. O som vem de direções diferentes e nunca se repete da mesma forma.`
  ];
  return {
    approach: pick(approachDetails, next),
    arrival: pick(arrivalDetails, next),
    crossing: pick(crossingDetails, next),
    exploration: pick(explorationDetails, next),
    night: pick(nightDetails, next),
    landmarkDiscovery: `Depois de seguir sinais quase apagados, vocês alcançam ${landmark}. De perto, o marco é maior e mais antigo do que parecia. Há sinais de ${monster}, mas também indícios de uso recente por mãos humanas. ${cosmicInfluence > 60 ? 'A superfície vibra em intervalos regulares, como se alguma coisa muito abaixo estivesse respirando.' : 'Símbolos gastos indicam que alguém tentou proteger ou esconder este lugar.'}`
  };
}

export function generateHexLore(
  campaignSeed: string,
  q: number,
  r: number,
  terrain: TerrainType,
  biome: BiomeType,
  dangerLevel: number,
  cosmicInfluence: number
): HexLore {
  const next = random(`${campaignSeed}:${q}:${r}:lore-v3`);
  const title = `${pick(prefixes, next)} ${pick(suffixes, next)}`;
  const landmarkDescription = pick(landmarksByTerrain[terrain], next);
  const routeOne = pick(routeByTerrain[terrain], next);
  const routeTwo = pickDifferent(routeByTerrain[terrain], routeOne, next);
  const monsterNames = monstersByBiome[biome];
  const faunaNames = faunaByTerrain[terrain];
  const floraNames = floraByTerrain[terrain];
  const monsterOne = pick(monsterNames, next);
  const monsterTwo = pickDifferent(monsterNames, monsterOne, next);
  const atmosphereOptions = [
    'O ar parece pesado e todos os sons chegam com um pequeno atraso.',
    'O vento muda de direção sem aviso e traz um cheiro metálico.',
    'Sombras se alongam na direção errada quando ninguém olha diretamente para elas.',
    'A região parece normal à distância, mas detalhes familiares estão ligeiramente deslocados.',
    'Há uma pressão constante nos ouvidos, semelhante à sensação de descer para uma caverna profunda.'
  ];
  const historyOptions = [
    'Antes da Ferida, o local fazia parte de uma rota entre dois reinos hoje esquecidos. Postos de descanso e pequenos santuários foram erguidos ao longo do caminho, mas quase todos foram desmontados depois que os viajantes começaram a desaparecer.',
    'Uma comunidade tentou reconstruir este lugar décadas atrás. Registros encontrados em outros povoados indicam que ela prosperou durante três invernos e desapareceu na mesma noite, sem deixar corpos ou sinais de luta.',
    'Os mapas antigos indicam que aqui existia uma construção muito maior do que as ruínas atuais sugerem. Partes dela podem ter afundado, sido soterradas ou nunca ter pertencido inteiramente ao mundo visível.',
    'Peregrinos utilizavam este caminho para alcançar um santuário cujo nome foi removido dos registros. A tradição foi proibida depois que vários peregrinos retornaram com lembranças de vidas que não viveram.'
  ];
  const horrorName = `${pick(['O Eco', 'A Vigília', 'O Sono', 'A Boca', 'O Reflexo', 'A Respiração'], next)} ${pick(['Subterrâneo', 'Sem Nome', 'de Pedra', 'da Última Estrela', 'do Mundo Oco', 'Entre as Raízes'], next)}`;
  const stage = cosmicInfluence > 82 ? 'CONTATO' : cosmicInfluence > 65 ? 'MANIFESTACAO' : cosmicInfluence > 40 ? 'VESTIGIO' : 'PRESSAGIO';
  const overview = `Uma extensão de ${biomeName(biome)} marcada por ${landmarkDescription}. O terreno oferece rotas possíveis, mas nenhuma é completamente confiável. O perigo aparente é ${dangerLevel <= 3 ? 'baixo' : dangerLevel <= 6 ? 'considerável' : 'extremo'}, e sinais locais indicam atividade recente de criaturas e viajantes.`;
  const hiddenTruth = `A verdadeira origem de ${title} está ligada a uma estrutura subterrânea anterior aos reinos humanos. ${landmarkDescription} funciona como um ponto de contenção imperfeito. A influência cósmica atual é ${cosmicInfluence}% e cresce quando viajantes permanecem durante a noite ou alteram símbolos antigos.`;
  const narration = makeNarration(title, biome, landmarkDescription, monsterOne, cosmicInfluence, next);
  const npcName = `${pick(givenNames, next)} ${pick(surnames, next)}`;
  const secondNpcName = `${pickDifferent(givenNames, npcName.split(' ')[0], next)} ${pick(surnames, next)}`;

  const fauna = faunaNames.slice(0, 4).map((name, index): HexLoreFauna => ({
    name: capitalize(name),
    abundance: index === 0 ? 'COMUM' : index === 1 ? 'INCOMUM' : index === 2 ? 'RARA' : 'INCOMUM',
    behavior: index === 0 ? 'Move-se principalmente durante períodos claros e foge de sons metálicos.' : index === 1 ? 'Permanece perto de água ou abrigo e fica imóvel quando percebe magia.' : 'Surge em pequenos grupos e abandona a região antes de manifestações sobrenaturais.',
    signs: index === 0 ? 'Fezes, pelos e trilhas estreitas próximas à rota.' : index === 1 ? 'Marcas de alimentação e pegadas concentradas perto de terreno protegido.' : 'Sinais esparsos que desaparecem antes de áreas contaminadas.',
    resource: index === 0 ? 'Carne, couro e indicação de áreas sem predadores imediatos.' : index === 1 ? 'Componentes, alimento limitado ou indicação de água.' : 'Material raro, ingrediente alquímico ou aviso de mudança climática.'
  }));

  const flora = floraNames.slice(0, 4).map((name, index): HexLoreFlora => ({
    name: capitalize(name),
    abundance: index === 0 ? 'COMUM' : index === 1 ? 'INCOMUM' : index === 2 ? 'RARA' : 'INCOMUM',
    appearance: index === 0 ? 'Cresce em manchas largas e possui coloração acinzentada.' : index === 1 ? 'Possui nervuras escuras e pequenas gotas claras nas folhas.' : 'Surge apenas em pontos protegidos e reage à aproximação de seres vivos.',
    use: index === 0 ? 'Pode servir como forragem, combustível ruim ou material de isolamento.' : index === 1 ? 'Pode ser preparada como remédio simples ou componente de veneno.' : 'É utilizada em rituais, antídotos raros ou preparação de tintas arcanas.',
    risk: index === 0 ? 'A fumaça causa irritação se queimada em local fechado.' : index === 1 ? 'Confundir a espécie com uma variedade venenosa é fácil.' : 'Contato prolongado pode provocar sonhos ou alteração temporária da percepção.'
  }));

  const monsters: HexLoreMonster[] = [monsterOne, monsterTwo].map((name, index) => ({
    name,
    threat: Math.min(10, Math.max(1, dangerLevel + index)),
    appearance: index === 0 ? 'Uma figura irregular, coberta por placas, fibras ou tecido natural do próprio bioma. Partes do corpo parecem ter sido montadas a partir de animais diferentes.' : 'Uma criatura mais discreta, de silhueta humanoide ou animal, que parece mudar de proporção quando vista por muito tempo.',
    signs: index === 0 ? 'Pegadas interrompidas, silêncio repentino, presas abandonadas e marcas acima da altura humana.' : 'Objetos deslocados, odores estranhos, reflexos fora de posição e animais fugindo da mesma direção.',
    behavior: index === 0 ? 'Observa primeiro e tenta separar a presa do restante do grupo. Evita confronto aberto quando está ferido.' : 'Protege um território, objeto ou passagem específica. Pode imitar sinais de ajuda para atrair viajantes.',
    motive: index === 0 ? 'Alimentar-se de calor, medo ou carne, dependendo da oportunidade.' : 'Impedir que alguém alcance a área oculta sob o marco principal.',
    lair: index === 0 ? `Um abrigo natural a menos de uma hora de ${landmarkDescription}, cheio de restos organizados por tamanho.` : `Uma cavidade, porão ou estrutura menor ligada ao subsolo de ${landmarkDescription}.`,
    tactics: index === 0 ? 'Usa cobertura, investe contra alvos isolados e recua quando cercado.' : 'Ataca a partir de uma posição escondida, utiliza o terreno e tenta apagar fontes de luz.',
    weakness: index === 0 ? 'Pode ser atraído por sons repetitivos e evita símbolos do antigo reino.' : 'Perde parte de sua força longe do local ao qual está ligado e reage mal a fogo intenso.',
    reward: index === 0 ? 'Partes do corpo podem servir como componente raro; o covil contém objetos de vítimas anteriores.' : 'Protege uma passagem, uma relíquia menor ou informações gravadas na própria estrutura.',
    suggestedStatBlock: index === 0 ? 'Use uma criatura de ND próximo ao nível médio do grupo com mobilidade e emboscada.' : 'Use uma criatura de ND ligeiramente menor com camuflagem, controle de terreno ou imitação.'
  }));

  const features: HexLoreFeature[] = [
    {
      name: capitalize(landmarkDescription),
      type: 'MARCO',
      visible: next() > 0.45,
      playerDescription: `O ponto mais marcante do hexágono é ${landmarkDescription}. Sua forma não combina totalmente com as construções conhecidas da região.`,
      masterDetails: `O marco é o principal nó da história local e está conectado à verdade secreta. Uma passagem oculta permite alcançar uma câmara inferior.`,
      interaction: 'Pode ser investigado, usado como abrigo imperfeito ou servir de ponto de orientação.',
      suggestedCheck: 'Investigação, História ou Sobrevivência CD 12 a 16.'
    },
    {
      name: 'Abrigo dos Viajantes',
      type: 'ABRIGO',
      visible: true,
      playerDescription: 'Uma depressão protegida, construção menor ou formação natural oferece abrigo contra parte do clima.',
      masterDetails: `O abrigo foi usado recentemente por ${npcName}. Há uma mensagem incompleta escondida sob pedras soltas.`,
      interaction: 'Permite preparar acampamento com menor risco, mas sinais recentes podem atrair curiosidade.',
      suggestedCheck: 'Sobrevivência CD 11 para tornar o local realmente seguro.'
    },
    {
      name: 'Fonte Incerta',
      type: 'RECURSO',
      visible: next() > 0.25,
      playerDescription: 'Há uma possível fonte de água e vegetação mais densa ao redor.',
      masterDetails: cosmicInfluence > 55 ? 'A água é potável após purificação, mas pode causar sonhos compartilhados.' : 'A água é segura após filtragem e fervura.',
      interaction: 'Pode reabastecer água e servir como ponto de encontro para fauna.',
      suggestedCheck: 'Natureza ou Sobrevivência CD 12 para avaliar a segurança.'
    },
    {
      name: 'Passagem Oculta',
      type: 'CAMINHO',
      visible: false,
      playerDescription: 'Uma rota secundária pode existir entre acidentes do terreno.',
      masterDetails: `A passagem reduz o custo de uma futura travessia e conduz para perto do covil de ${monsterTwo}.`,
      interaction: 'Pode ser mapeada, bloqueada ou usada para evitar a rota principal.',
      suggestedCheck: 'Percepção ou Investigação CD 14.'
    },
    {
      name: 'Área de Presságio',
      type: 'PERIGO',
      visible: false,
      playerDescription: 'Uma parte da região parece silenciosa e evita ser atravessada pela fauna.',
      masterDetails: `É o primeiro ponto de manifestação de ${horrorName}. Permanecer ali por muito tempo pode causar Abalo Cósmico.`,
      interaction: 'Pode ser estudada, contornada, consagrada ou utilizada em ritual.',
      suggestedCheck: 'Arcanismo, Religião ou Sobrevivência CD 15.'
    }
  ];

  const resources: HexLoreResource[] = [
    {
      name: 'Água local',
      category: 'AGUA',
      availability: terrain === TerrainType.PANTANO || terrain === TerrainType.REGIAO_ALAGADA ? 'ABUNDANTE' : terrain === TerrainType.CAMPO_DEVASTADO ? 'ESCASSA' : 'LIMITADA',
      access: 'Exige busca próxima a depressões, vegetação ou ruínas.',
      complication: cosmicInfluence > 55 ? 'Precisa ser purificada e pode carregar efeitos oníricos.' : 'Precisa ser filtrada ou fervida.'
    },
    {
      name: 'Alimento de coleta',
      category: 'COMIDA',
      availability: terrain === TerrainType.FLORESTA || terrain === TerrainType.FLORESTA_DENSA ? 'SUFICIENTE' : 'LIMITADA',
      access: 'Exige forrageamento e identificação correta de plantas e rastros.',
      complication: 'Parte da flora possui variedades semelhantes e tóxicas.'
    },
    {
      name: 'Materiais úteis',
      category: 'MATERIAL',
      availability: terrain === TerrainType.RUINAS ? 'ABUNDANTE' : 'LIMITADA',
      access: 'Madeira, pedra, metal reaproveitável ou fibras podem ser coletados.',
      complication: 'A coleta produz ruído, ocupa carga e pode desestabilizar estruturas.'
    },
    {
      name: flora[1].name,
      category: 'MEDICINAL',
      availability: flora[1].abundance === 'RARA' ? 'ESCASSA' : 'LIMITADA',
      access: 'Exige identificação e preparação adequadas.',
      complication: flora[1].risk
    }
  ];

  const legends = [
    {
      title: `A lenda de ${title}`,
      text: `Dizem que quem atravessa a região durante a noite escuta seu próprio nome vindo de ${landmarkDescription}. A voz sempre promete mostrar o caminho mais curto para casa.`,
      truth: next() > 0.45 ? 'As vozes repetem memórias deixadas por viajantes anteriores e conduzem até a câmara subterrânea.' : 'A história foi criada para afastar saqueadores, mas o horror local passou a imitá-la.'
    },
    {
      title: 'O caminho que retorna',
      text: 'Uma antiga história afirma que certas trilhas sempre conduzem ao mesmo ponto, independentemente da direção seguida. Os poucos que escaparam voltaram com um dia inteiro perdido da memória.',
      truth: 'O fenômeno ocorre apenas quando a influência cósmica aumenta ou durante a Noite. Marcar árvores ou pedras interrompe temporariamente o ciclo.'
    },
    {
      title: 'A promessa enterrada',
      text: `Os habitantes mais antigos acreditavam que uma promessa gravada sob ${landmarkDescription} mantinha o pior do mundo adormecido.`,
      truth: 'Há realmente uma inscrição de contenção, mas ela está incompleta e foi alterada por uma facção desconhecida.'
    }
  ];

  const rumors = [
    {
      text: `Há uma relíquia intacta escondida perto de ${landmarkDescription}.`,
      reliability: next() > 0.66 ? 'VERDADEIRO' as const : next() > 0.35 ? 'PARCIAL' as const : 'FALSO' as const,
      source: pick(rumorSources, next),
      truth: 'Existe um objeto antigo na câmara inferior, mas ele faz parte do mecanismo de contenção.'
    },
    {
      text: `${monsterOne} foi visto seguindo viajantes sem atacá-los durante três noites seguidas.`,
      reliability: next() > 0.5 ? 'VERDADEIRO' as const : 'PARCIAL' as const,
      source: pick(rumorSources, next),
      truth: `A criatura acompanha pessoas que carregam objetos retirados de ${landmarkDescription}.`
    },
    {
      text: 'A água encontrada nesta região cura febres, mas provoca sonhos compartilhados.',
      reliability: next() > 0.58 ? 'PARCIAL' as const : 'FALSO' as const,
      source: pick(rumorSources, next),
      truth: 'A água reduz sintomas comuns, mas os sonhos são memórias armazenadas no subsolo.'
    },
    {
      text: `${npcName} conhece uma rota segura, mas exige que ninguém faça perguntas sobre quem a ensinou.`,
      reliability: 'VERDADEIRO' as const,
      source: pick(rumorSources, next),
      truth: `${npcName} sobreviveu a um encontro com ${monsterTwo} e marcou a passagem oculta.`
    }
  ];

  const inhabitants: HexLoreNpc[] = [
    {
      name: npcName,
      role: pick(['caçador perdido', 'cartógrafa errante', 'sobrevivente de uma caravana', 'coletor de ervas', 'desertor armado'], next),
      appearance: 'Roupas remendadas, equipamento bem cuidado e uma marca antiga escondida sob uma faixa.',
      manner: 'Observa as mãos de todos antes de responder e evita falar nomes próprios perto do marco.',
      desire: 'Sair da região com uma informação, pessoa ou objeto específico.',
      offer: 'Uma rota secundária, um rumor, auxílio de forrageamento ou um mapa incompleto.',
      secret: `Já entrou na câmara sob ${landmarkDescription} e deixou outra pessoa para trás.`
    },
    {
      name: secondNpcName,
      role: pick(['peregrina silenciosa', 'mercador isolado', 'mensageiro ferido', 'vigia de uma facção', 'eremita local'], next),
      appearance: 'Carrega sinais da estrada e um objeto incompatível com sua história.',
      manner: 'Fala de forma educada, mas repete certas frases com exatamente o mesmo ritmo.',
      desire: 'Convencer o grupo a investigar ou evitar uma área específica.',
      offer: 'Abrigo, troca de suprimentos ou informação sobre uma ameaça próxima.',
      secret: cosmicInfluence > 60 ? 'Parte de suas lembranças pertence a alguém morto na região.' : 'Trabalha para uma facção e avalia o grupo.'
    }
  ];

  const horrorTruth = `${hiddenTruth} ${horrorName} não é uma criatura completa, mas uma pressão consciente transmitida pela estrutura. Ela utiliza memórias, vozes e padrões do ambiente para conduzir pessoas até pontos onde a contenção está enfraquecida.`;
  const encounters = [
    {
      title: `Rastros de ${monsterOne}`,
      type: 'VESTIGIO' as const,
      setup: 'A rota é interrompida por sinais recentes, restos de presa e um silêncio repentino.',
      development: `A criatura está próxima, mas ainda observa. O grupo pode seguir os rastros, contornar ou preparar uma armadilha.`,
      consequence: 'Seguir os sinais revela parte do covil; ignorá-los aumenta a chance de emboscada durante a Noite.'
    },
    {
      title: `Encontro com ${npcName}`,
      type: 'SOCIAL' as const,
      setup: `${npcName} surge em posição defensável e pede uma prova de que o grupo não trabalha para uma facção rival.`,
      development: 'A conversa pode render uma rota, um pedido de ajuda ou uma informação contraditória.',
      consequence: 'A forma como o grupo reage define se o NPC retorna como aliado, testemunha ou inimigo.'
    },
    {
      title: 'A fonte e os reflexos',
      type: 'HORROR' as const,
      setup: 'A água reflete pessoas que não estão presentes e mostra o grupo em posições diferentes.',
      development: 'Um personagem percebe um detalhe verdadeiro sobre o marco, mas corre risco de Abalo.',
      consequence: 'A água revela uma pista; coletá-la pode levar o fenômeno para outro lugar.'
    },
    {
      title: 'Descoberta do caminho antigo',
      type: 'DESCOBERTA' as const,
      setup: `Marcas sob a vegetação revelam ${routeTwo}.`,
      development: 'A rota pode ser mapeada, mas passa perto de uma área de perigo.',
      consequence: 'Mapeá-la reduz viagens futuras; usá-la imediatamente pode antecipar um encontro.'
    }
  ];

  const clues = [
    {
      clue: 'Símbolos idênticos aparecem em pedras distantes e na base do marco.',
      reveals: 'O local foi construído como parte de uma rede maior, não como uma estrutura isolada.',
      location: 'No marco principal e em uma pedra próxima à passagem oculta.'
    },
    {
      clue: 'Restos de acampamentos mostram que várias pessoas ouviram as mesmas palavras durante sonhos.',
      reveals: `${horrorName} utiliza padrões de memória compartilhada.`,
      location: 'No abrigo dos viajantes.'
    },
    {
      clue: `Partes de vítimas de ${monsterOne} foram organizadas ao redor de uma inscrição, não consumidas.`,
      reveals: 'A criatura obedece ou protege um padrão relacionado à contenção.',
      location: `No covil de ${monsterOne}.`
    },
    {
      clue: 'Uma seção recente foi removida de uma inscrição antiga com ferramentas humanas.',
      reveals: 'Uma pessoa ou facção está deliberadamente enfraquecendo o local.',
      location: 'Na câmara inferior.'
    }
  ];

  return {
    schemaVersion: 3,
    title,
    overview,
    atmosphere: pick(atmosphereOptions, next),
    landmark: {
      name: capitalize(landmarkDescription),
      description: `O ponto mais marcante do hexágono é ${landmarkDescription}. Existem sinais recentes de passagem, mas nenhum caminho confiável leva diretamente até ele.`,
      hidden: features[0].visible === false
    },
    narration,
    sensoryDetails: {
      sights: ['Cinza fina acumulada em superfícies protegidas.', 'Marcas antigas parcialmente cobertas pelo terreno.', 'Movimentos breves no limite da visão.'],
      sounds: ['O vento parece carregar passos distantes.', 'Sons de animais cessam em intervalos regulares.', 'Pedras estalam sob o solo sem causa visível.'],
      smells: ['Ferro molhado.', 'Vegetação amarga.', cosmicInfluence > 60 ? 'Ozônio e pedra recém-partida.' : 'Fumaça antiga.'],
      touch: ['O solo muda de temperatura em pequenas áreas.', 'Objetos metálicos ficam frios perto do marco.', 'A umidade deixa uma película fina sobre a pele.']
    },
    features,
    routes: [
      {
        name: capitalize(routeOne),
        description: `A rota mais evidente segue ${routeOne} e permite atravessar a maior parte da região sem perder o marco de vista.`,
        advantage: 'É mais fácil de navegar e permite perceber sinais antes de um encontro.',
        danger: `É observada por ${monsterOne} e possui poucos pontos de abrigo.`
      },
      {
        name: capitalize(routeTwo),
        description: `Uma rota menos conhecida utiliza ${routeTwo} e evita parte do terreno difícil.`,
        advantage: 'Pode reduzir o tempo de travessia depois de mapeada.',
        danger: `Passa perto do covil de ${monsterTwo} ou de uma manifestação do horror.`
      }
    ],
    resources,
    flora,
    history: pick(historyOptions, next),
    legends,
    rumors,
    fauna,
    monsters,
    inhabitants,
    horror: {
      name: horrorName,
      stage,
      omens: ['Sons naturais desaparecem por alguns segundos.', 'Objetos apontam para o mesmo ponto.', 'Sonhos de personagens diferentes compartilham detalhes.', 'Sombras permanecem imóveis mesmo quando a luz se move.'],
      playerEffect: cosmicInfluence > 60 ? 'A realidade local sofre pequenas alterações perceptíveis e a permanência prolongada é desconfortável.' : 'A presença ainda se manifesta apenas por presságios, coincidências e vestígios.',
      effect: cosmicInfluence > 60 ? 'A realidade local sofre alterações e pode causar Abalo Cósmico.' : 'A presença ainda se manifesta por presságios e vestígios.',
      truth: horrorTruth,
      escalation: ['Primeiro, sons e rastros passam a se repetir.', 'Depois, pessoas diferentes compartilham lembranças.', 'Em seguida, o marco muda de posição ou abre uma passagem.', 'Por fim, a presença tenta usar alguém como ponto de contato.'],
      containment: 'Restaurar símbolos antigos, impedir permanência durante a Noite e afastar objetos retirados da câmara reduz temporariamente a influência.'
    },
    weatherProfile: {
      common: terrain === TerrainType.MONTANHA ? ['vento cortante', 'neblina alta', 'chuva fria'] : terrain === TerrainType.PANTANO ? ['neblina baixa', 'garoa persistente', 'calor úmido'] : ['céu encoberto', 'vento de cinzas', 'chuva irregular'],
      hazard: cosmicInfluence > 70 ? 'Chuva de partículas negras reduz a visibilidade, contamina água exposta e aumenta o risco de Abalo.' : 'Mudanças rápidas de temperatura e visibilidade tornam rotas conhecidas menos confiáveis.',
      clearSign: 'Animais pequenos reaparecem e o vento mantém direção constante.',
      stormSign: 'Insetos desaparecem, superfícies metálicas vibram e nuvens formam linhas paralelas.'
    },
    clues,
    encounters,
    masterGuide: {
      premise: `${title} oferece uma travessia possível, recursos limitados e um marco antigo que liga a vida cotidiana da região a um mistério maior.`,
      hiddenTruth,
      activeConflict: `${npcName} tenta sobreviver enquanto ${monsterOne} protege involuntariamente a contenção e outra força procura enfraquecê-la.`,
      whatChangesIfIgnored: `Depois de ${Math.max(2, 7 - Math.min(5, dangerLevel))} dias, a influência avança para um hexágono vizinho, um rumor se torna público e uma ameaça passa a circular pela rota principal.`,
      connections: [`O símbolo local pode aparecer em outra ruína da campanha.`, `${npcName} conhece alguém em um assentamento próximo.`, `Um objeto do covil pertence a uma facção regional.`],
      improvisationNotes: ['Apresente sinais antes de um combate.', 'Ofereça pelo menos duas rotas ou soluções.', 'Uma falha deve revelar algo com custo, não bloquear a investigação.', 'Use a Noite para aumentar o horror, não apenas a quantidade de inimigos.']
    },
    playerSummary: `${title} é uma região de ${biomeName(biome)} conhecida por ${landmarkDescription}. Relatos mencionam recursos limitados, caminhos pouco confiáveis, fauna alterada e sinais de ${monsterOne}.`,
    secrets: hiddenTruth
  };
}

export function generateVisitState(seed: string, q: number, r: number, day: number, period: string, lore: HexLore, visitCount: number) {
  const next = random(`${seed}:${q}:${r}:${day}:${period}:${visitCount}:visit-v4`);
  const weather = pick(lore.weatherProfile.common, next);
  const visibility = weather.includes('neblina') || weather.includes('cinza')
    ? 'BAIXA'
    : weather.includes('chuva') || weather.includes('vento')
      ? 'MEDIA'
      : 'BOA';
  const periodNarration = period === 'NOITE'
    ? lore.narration.night
    : visitCount === 1
      ? lore.narration.arrival
      : lore.narration.crossing;
  const environmentalSign = pick([
    ...lore.sensoryDetails.sounds,
    ...lore.sensoryDetails.sights,
    lore.weatherProfile.clearSign,
    lore.weatherProfile.stormSign
  ], next);

  return {
    weather,
    visibility,
    generatedAt: { day, period },
    description: `${periodNarration} O clima atual é ${weather}. ${environmentalSign}`,
    narration: periodNarration,
    environmentalSign
  };
}
