import { CampaignBible, generateCampaignBible, resolveCampaignRegion } from '../../campaigns/generation/campaign-bible-generator';
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
  schemaVersion: 5;
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
    camp: string;
    dawn: string;
    badWeather: string;
    aftermath: string;
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
  historyLayers: {
    beforeCatastrophe: string;
    duringExperiment: string;
    afterOpening: string;
    currentState: string;
  };
  region: {
    id: string;
    name: string;
    epithet: string;
    theme: string;
    publicDescription: string;
    dominantFaction: string;
    signatureCreature: string;
    rareResource: string;
    centralMystery: string;
    secret: string;
  };
  revelationLayers: {
    sensed: string;
    observed: string;
    investigated: string;
    confirmed: string;
    understood: string;
  };
  campaignConnections: {
    blackStarSign: string;
    portalEcho: string;
    solarDecaySign: string;
    linkedFaction: string;
    linkedRelic: string;
    objectiveClue: string;
    linkedHexHints: string[];
  };
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
  terrainChallenges: Array<{
    name: string;
    description: string;
    check: string;
    failure: string;
    alternative: string;
  }>;
  discoveries: Array<{
    name: string;
    description: string;
    requirement: string;
    reward: string;
    secret: string;
  }>;
  localCulture: {
    custom: string;
    taboo: string;
    trade: string;
    conflict: string;
  };
  storyHooks: Array<{
    title: string;
    hook: string;
    escalation: string;
    resolution: string;
  }>;
  cosmicPatterns: Array<{
    manifestation: string;
    trigger: string;
    effect: string;
    clue: string;
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

function pickMany<T>(items: readonly T[], amount: number, next: () => number) {
  const available = [...items];
  const selected: T[] = [];
  while (available.length > 0 && selected.length < amount) {
    const index = Math.floor(next() * available.length) % available.length;
    selected.push(available.splice(index, 1)[0]);
  }
  return selected;
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
  [TerrainType.PLANICIE]: ['lebre de cinzas', 'corvo de campina', 'antílope pálido', 'raposa de cauda branca', 'lagarto do vento', 'cão de pradaria negro', 'grou de pernas azuis', 'besouro de espelho'],
  [TerrainType.FLORESTA]: ['cervo sem manchas', 'coruja cinzenta', 'javali de casca', 'raposa musgosa', 'esquilo de olhos brancos', 'gato da folhagem', 'mariposa ferrugem', 'pica-pau de osso'],
  [TerrainType.FLORESTA_DENSA]: ['cervo oco', 'mariposa de vidro', 'lobo pálido', 'besouro de sal', 'serpente de raiz', 'aranha de sino', 'morcego de folhas', 'sapo da casca'],
  [TerrainType.COLINA]: ['cabra de pedra', 'falcão ferrugem', 'texugo das fendas', 'serpente fria', 'lebre de rocha', 'corvo do eco', 'lagarto espinhoso', 'carneiro cinzento'],
  [TerrainType.MONTANHA]: ['bode negro', 'águia cega', 'lagarto de ardósia', 'rato de neve', 'corvo de gelo', 'aranha de fenda', 'gato das escarpas', 'verme de pedra'],
  [TerrainType.PANTANO]: ['garça de lodo', 'sapo de olhos leitosos', 'enguia de brejo', 'mosca de cinza', 'crocodilo pálido', 'caracol de osso', 'libélula negra', 'rato de junco'],
  [TerrainType.REGIAO_ALAGADA]: ['peixe translúcido', 'lontra negra', 'garça muda', 'caranguejo de limo', 'enguia de prata', 'sapo de sino', 'pato sem canto', 'serpente d’água pálida'],
  [TerrainType.RUINAS]: ['rato de muralha', 'corvo de telhado', 'lagarto de cal', 'gato feral', 'morcego de campanário', 'aranha de arquivo', 'cão de porão', 'besouro de bronze'],
  [TerrainType.CAMPO_DEVASTADO]: ['abutre de poeira', 'lagarto seco', 'rato de cinzas', 'cão feral', 'corvo queimado', 'hiena magra', 'besouro de carvão', 'serpente de vidro'],
  [TerrainType.REGIAO_CONTAMINADA]: ['mariposa sem sombra', 'verme mineral', 'corvo de três vozes', 'cervo cristalino', 'aranha prismática', 'cão de pele translúcida', 'lesma estelar', 'ave de ossos flutuantes']
};

const floraByTerrain: Record<TerrainType, readonly string[]> = {
  [TerrainType.PLANICIE]: ['capim de cinza', 'flor de vigília', 'urtiga vermelha', 'junco seco', 'dente-de-sal', 'trigo fantasma', 'trevo negro', 'flor do horizonte'],
  [TerrainType.FLORESTA]: ['musgo de ferro', 'samambaia cinzenta', 'raiz amarga', 'cogumelo-lanterna', 'hera de corvo', 'lírio noturno', 'casca febril', 'orquídea de madeira'],
  [TerrainType.FLORESTA_DENSA]: ['lírio de osso', 'trepadeira muda', 'fungo de vidro', 'hera pálida', 'flor de pupila', 'musgo de memória', 'raiz sussurrante', 'cogumelo de sino'],
  [TerrainType.COLINA]: ['tomilho de pedra', 'arbusto ferrugem', 'flor do vento', 'líquen azul', 'espinho de cobre', 'erva de crista', 'rosa cinzenta', 'samambaia de rocha'],
  [TerrainType.MONTANHA]: ['pinheiro negro', 'líquen de sangue', 'erva da geada', 'rosa de ardósia', 'musgo de neve', 'raiz da encosta', 'flor de trovão', 'cogumelo de fenda'],
  [TerrainType.PANTANO]: ['junco febril', 'lírio do lodo', 'musgo sonolento', 'cogumelo do brejo', 'flor da febre', 'cipó afogado', 'alga de sangue', 'erva da garça'],
  [TerrainType.REGIAO_ALAGADA]: ['alga de prata', 'flor submersa', 'junco de sino', 'musgo aquático', 'lírio de vidro', 'raiz flutuante', 'flor da maré morta', 'erva de bolha'],
  [TerrainType.RUINAS]: ['hera de cal', 'rosa de muralha', 'fungo de porão', 'erva de telhado', 'musgo de inscrição', 'flor da janela', 'trepadeira de cobre', 'cogumelo de arquivo'],
  [TerrainType.CAMPO_DEVASTADO]: ['espinho de cinza', 'flor de carvão', 'grama cortante', 'raiz seca', 'líquen de cratera', 'erva do fogo frio', 'flor de fuligem', 'cacto de vidro'],
  [TerrainType.REGIAO_CONTAMINADA]: ['orquídea ocular', 'musgo pulsante', 'erva cristalina', 'lírio sem sombra', 'flor de carne', 'raiz prismática', 'fungo de estrela', 'trepadeira temporal']
};

const monstersByBiome: Record<BiomeType, readonly string[]> = {
  [BiomeType.CAMPOS_CINZENTOS]: ['Ceifador de Bruma', 'Cão do Marco Partido', 'Peregrino Sem Rosto', 'Touro de Cinzas', 'Pastor de Corvos', 'Rastejante do Horizonte', 'Noiva do Vento', 'Caçador de Pegadas'],
  [BiomeType.BOSQUE_MORTO]: ['Pastor de Galhos', 'Lobo da Casca', 'Viúva das Folhas', 'Homem do Oco', 'Cervo de Espinhos', 'Coruja de Duas Vozes', 'Raiz Faminta', 'Lenhador Imóvel'],
  [BiomeType.MATA_PALIDA]: ['Cervo Oco', 'Imitador de Vozes', 'Raiz que Caminha', 'Santo de Madeira', 'Mariposa de Rostos', 'Criança do Musgo', 'Aranha do Sino', 'Animal Sem Frente'],
  [BiomeType.TERRAS_ALTAS]: ['Gigante Encolhido', 'Caçador de Ecos', 'Cabra do Abismo', 'Pastor de Pedras', 'Vulto da Crista', 'Carneiro de Ossos', 'Falcão Invertido', 'Guardião da Garganta'],
  [BiomeType.PICOS_NEGROS]: ['Sentinela de Obsidiana', 'Dragão de Cinzas Menor', 'Ave do Trovão Morto', 'Monge do Gelo Negro', 'Verme da Escarpa', 'Cabra de Mil Olhos', 'Sombra da Avalanche', 'Astrônomo Congelado'],
  [BiomeType.BREJO_SILENCIOSO]: ['Noiva do Lodo', 'Sanguessuga de Memórias', 'Homem-Sapo Pálido', 'Rei dos Juncos', 'Crocodilo de Velas', 'Criança Afogada', 'Mosca de Carne', 'Carregador do Brejo'],
  [BiomeType.AGUAS_MORTAS]: ['Afogado Cantante', 'Enguia do Sino', 'Reflexo Faminto', 'Barqueiro Sem Barco', 'Peixe de Dentes Humanos', 'Mãe das Bolhas', 'Serpente do Campanário', 'Nadador Invertido'],
  [BiomeType.CICATRIZ_ANTIGA]: ['Armadura Vazia', 'Escriba Sem Rosto', 'Guardião da Porta Cega', 'Arquivista de Ossos', 'Rei da Praça Morta', 'Estátua Peregrina', 'Cão de Bronze', 'Habitante da Parede'],
  [BiomeType.ERMO_DE_CINZAS]: ['Verme de Poeira', 'Cavaleiro Queimado', 'Fome de Ossos', 'Abutre Humano', 'Cão de Vidro', 'Andarilho Carbonizado', 'Sombra da Cratera', 'Coletor de Dentes'],
  [BiomeType.ZONA_DA_FERIDA]: ['Fragmento Sonhador', 'Anjo Invertido', 'Observador Sob a Pedra', 'Geômetra de Carne', 'Filho do Céu Errado', 'Coro Sem Boca', 'Santo da Ferida', 'Animal do Último Instante']
};

const landmarksByTerrain: Record<TerrainType, readonly string[]> = {
  [TerrainType.PLANICIE]: ['um círculo de menires inclinados', 'uma torre de vigia caída', 'um campo de estátuas sem rosto', 'uma estrada real enterrada pela cinza', 'um moinho imóvel com pás de osso', 'um poço cercado por sinos mudos', 'uma capela baixa coberta por terra', 'uma fileira de colunas apontando para o norte'],
  [TerrainType.FLORESTA]: ['uma capela tomada por raízes', 'uma ponte de madeira que não apodrece', 'um carvalho marcado por centenas de nomes', 'uma casa de caça construída ao redor de uma árvore', 'um cemitério cercado por troncos brancos', 'uma clareira onde nenhuma folha toca o chão', 'um arco de pedra coberto por musgo negro', 'uma torre estreita oculta entre copas'],
  [TerrainType.FLORESTA_DENSA]: ['um altar enterrado entre raízes', 'uma aldeia engolida pelas árvores', 'um poço onde a luz não alcança', 'um corredor natural formado por troncos fundidos', 'uma árvore oca larga como uma fortaleza', 'um jardim de pedras sob a copa fechada', 'uma escadaria descendo entre raízes vivas', 'um santuário suspenso por cipós'],
  [TerrainType.COLINA]: ['uma fortificação de pedra seca', 'uma estrada escavada na colina', 'um túmulo circular', 'um anfiteatro de rocha voltado para o céu', 'uma torre de sinais partida ao meio', 'um conjunto de cavernas seladas com tijolos', 'um marco de fronteira coberto por juramentos', 'uma aldeia de terraços abandonados'],
  [TerrainType.MONTANHA]: ['uma porta talhada na rocha', 'um observatório quebrado', 'uma ponte suspensa sobre o vazio', 'um mosteiro preso à encosta', 'uma mina lacrada por placas de bronze', 'uma estátua colossal sem cabeça', 'um elevador de carga enferrujado', 'um lago negro dentro de uma cratera'],
  [TerrainType.PANTANO]: ['uma torre afundada', 'um cemitério de barcos', 'uma cabana sobre pernas de pedra', 'um templo cercado por águas paradas', 'uma passarela circular que termina no lodo', 'um bosque de árvores ocas cheias de velas', 'uma ilha de terra seca coberta por máscaras', 'um sino de bronze emergindo da lama'],
  [TerrainType.REGIAO_ALAGADA]: ['um campanário submerso', 'uma ilha coberta de ossos', 'um cais que leva a lugar nenhum', 'um palácio visível sob a água', 'uma ponte cujos arcos continuam no fundo', 'um farol apagado em uma ilhota', 'um círculo de barcos amarrados entre si', 'uma estátua que permanece seca sob a chuva'],
  [TerrainType.RUINAS]: ['um palácio sem teto', 'uma biblioteca lacrada', 'um mercado petrificado', 'um teatro onde as cadeiras encaram o palco vazio', 'uma praça coberta por relógios parados', 'um aqueduto que transporta névoa', 'uma prisão com portas abertas e celas ocupadas por sombras', 'um arquivo subterrâneo selado com chumbo'],
  [TerrainType.CAMPO_DEVASTADO]: ['uma caravana fossilizada', 'um altar queimado', 'uma cratera vitrificada', 'uma muralha derretida pelo calor', 'um campo de armas fincadas no solo', 'uma torre carbonizada que ainda produz fumaça', 'um abrigo militar coberto por cinza', 'uma estrada de vidro negro'],
  [TerrainType.REGIAO_CONTAMINADA]: ['uma coluna que pulsa', 'uma escadaria descendo para a pedra viva', 'um arco que mostra outro céu', 'um lago suspenso alguns metros acima do solo', 'uma construção dobrada sobre si mesma', 'um jardim de cristais que imitam vozes', 'uma fenda cercada por estátuas recentes', 'um observatório feito de matéria translúcida']
};

const routeByTerrain: Record<TerrainType, readonly string[]> = {
  [TerrainType.PLANICIE]: ['uma estrada de lajes rachadas', 'um caminho marcado por postes queimados', 'uma faixa de capim sempre deitado', 'um antigo canal de irrigação seco', 'uma sequência de pedras brancas', 'a sombra de uma estrada que só aparece ao entardecer'],
  [TerrainType.FLORESTA]: ['uma trilha de caçadores', 'um corredor de árvores antigas', 'um caminho coberto por raízes planas', 'uma linha de marcos entalhados', 'o leito raso de um córrego', 'uma passagem usada por cervos e viajantes'],
  [TerrainType.FLORESTA_DENSA]: ['uma passagem entre raízes', 'um leito de riacho seco', 'um túnel natural sob galhos entrelaçados', 'uma trilha de fungos luminosos', 'um caminho aberto por criatura grande', 'uma sequência de clareiras estreitas'],
  [TerrainType.COLINA]: ['uma senda sobre a crista', 'um corte estreito entre rochas', 'degraus antigos escavados na encosta', 'uma estrada em espiral', 'um caminho de pastores abandonado', 'uma faixa protegida do vento entre duas elevações'],
  [TerrainType.MONTANHA]: ['uma trilha de cabras', 'uma galeria parcialmente desabada', 'uma escada de ferro presa à parede', 'um caminho sob saliências de pedra', 'uma ponte natural estreita', 'uma rota marcada por cairns antigos'],
  [TerrainType.PANTANO]: ['uma faixa de terreno firme', 'uma passarela de troncos apodrecidos', 'uma linha de ilhas rasas', 'um canal entre juncos altos', 'uma trilha marcada por estacas', 'um caminho que só fica visível na maré baixa'],
  [TerrainType.REGIAO_ALAGADA]: ['uma sequência de ilhotas', 'um canal navegável estreito', 'uma estrada submersa pouco profunda', 'uma cadeia de pontes quebradas', 'uma rota entre árvores inundadas', 'um corredor de água sem correnteza'],
  [TerrainType.RUINAS]: ['uma avenida soterrada', 'um túnel de serviço', 'uma passagem pelos telhados baixos', 'um aqueduto seco', 'uma sequência de pátios internos', 'uma galeria comercial parcialmente intacta'],
  [TerrainType.CAMPO_DEVASTADO]: ['um sulco protegido do vento', 'uma rota entre crateras', 'uma trincheira antiga', 'uma estrada coberta por placas de metal', 'um caminho marcado por ossos queimados', 'uma faixa onde a cinza não se acumula'],
  [TerrainType.REGIAO_CONTAMINADA]: ['um caminho onde a pedra não pulsa', 'uma linha de obeliscos partidos', 'uma faixa de solo que não projeta sombra', 'uma rota marcada por cristais opacos', 'um corredor onde a gravidade permanece estável', 'uma trilha visível apenas por reflexos']
};

const rumorSources = ['um caçador ferido', 'uma velha cartógrafa', 'um mercador da Estrada Vermelha', 'um monge do Último Sol', 'uma criança que sonha acordada', 'um desertor da Ordem', 'um sobrevivente febril'];

const atmosphereFragments = [
  'O ar parece pesado e todos os sons chegam com um pequeno atraso.',
  'O vento muda de direção sem aviso e traz um cheiro metálico.',
  'Sombras se alongam na direção errada quando ninguém olha diretamente para elas.',
  'A região parece normal à distância, mas detalhes familiares estão ligeiramente deslocados.',
  'Há uma pressão constante nos ouvidos, semelhante à sensação de descer para uma caverna profunda.',
  'A luz parece evitar certos pontos do terreno, deixando manchas de penumbra mesmo ao meio-dia.',
  'Pequenos ruídos repetem-se três vezes, sempre mais distantes do que antes.',
  'Objetos de metal acumulam uma camada fria de umidade que não evapora.',
  'A sensação de estar sendo observado vem do chão, não das árvores ou do horizonte.',
  'O ambiente alterna entre cheiro de chuva e poeira seca sem que o clima mude.',
  'A distância até o marco principal parece diferente dependendo de quem mede.',
  'Animais locais evitam cruzar linhas invisíveis que atravessam a paisagem.',
  'Certas palavras são abafadas pelo vento, especialmente nomes próprios.',
  'O silêncio possui um ritmo, como uma respiração grande e lenta sob o solo.',
  'Reflexos em água, metal e vidro mostram nuvens que não existem no céu.'
];

const historyFragments = [
  'Antes da Ferida, o local fazia parte de uma rota entre dois reinos hoje esquecidos. Postos de descanso e pequenos santuários foram erguidos ao longo do caminho, mas quase todos foram desmontados depois que viajantes começaram a desaparecer.',
  'Uma comunidade tentou reconstruir este lugar décadas atrás. Registros encontrados em outros povoados indicam que ela prosperou durante três invernos e desapareceu na mesma noite, sem deixar corpos ou sinais de luta.',
  'Os mapas antigos indicam que aqui existia uma construção muito maior do que as ruínas atuais sugerem. Partes dela podem ter afundado, sido soterradas ou nunca ter pertencido inteiramente ao mundo visível.',
  'Peregrinos utilizavam este caminho para alcançar um santuário cujo nome foi removido dos registros. A tradição foi proibida depois que vários peregrinos retornaram com lembranças de vidas que não viveram.',
  'Durante a guerra dos reinos tardios, a região serviu como ponto de troca de prisioneiros. Uma das trocas nunca terminou, e documentos posteriores registram pessoas que continuaram aguardando por décadas.',
  'Uma ordem de astrônomos construiu postos de observação aqui porque certas estrelas só podiam ser vistas desta região. O último relatório descreve uma estrela que parecia aproximar-se a cada noite.',
  'Mineiros encontraram uma camada de pedra que não podia ser quebrada por ferramentas comuns. Quando começaram a cantar durante o trabalho, a pedra abriu-se sozinha.',
  'A área foi abandonada após uma doença que não matava, mas fazia moradores esquecerem os próprios parentes. As casas foram deixadas intactas para evitar que os objetos fossem levados.',
  'Uma antiga estrada real foi desviada para contornar este lugar, embora a rota alternativa fosse muito mais longa. Nenhum decreto explica a mudança.',
  'Relatos de caçadores afirmam que uma aldeia existiu aqui por apenas uma estação e, ainda assim, suas ruínas parecem ter séculos.'
];

const terrainChallengeTemplates = [
  ['Solo que cede', 'Uma camada superficial firme esconde vazios, raízes ou estruturas quebradas.', 'Sobrevivência ou Percepção CD 12 a 16.', 'Uma queda, equipamento danificado ou perda de tempo.', 'Usar varas, cordas ou contornar por terreno mais alto.'],
  ['Orientação quebrada', 'Marcos visuais parecem mudar de posição e trilhas conhecidas retornam ao mesmo ponto.', 'Sobrevivência, Investigação ou Arcanismo CD 13 a 17.', 'O grupo perde parte do período ou chega a uma área perigosa.', 'Marcar o caminho fisicamente e comparar direção por métodos diferentes.'],
  ['Passagem estreita', 'A rota força o grupo a atravessar uma área exposta, apertada ou difícil de defender.', 'Acrobacia ou Atletismo CD 11 a 15.', 'Queda, separação ou barulho suficiente para atrair atenção.', 'Abrir uma passagem secundária ou atravessar em pequenos grupos.'],
  ['Clima hostil', 'Vento, chuva, lama ou cinza tornam o avanço lento e ameaçam suprimentos.', 'Sobrevivência ou Natureza CD 12 a 16.', 'Perda de recursos, exaustão ou equipamento molhado.', 'Aguardar, montar abrigo ou escolher uma rota mais longa.'],
  ['Zona de silêncio', 'Uma parte do hexágono absorve som e dificulta comunicação e percepção de perigos.', 'Percepção ou Intuição CD 13 a 17.', 'Um integrante se afasta ou uma ameaça se aproxima sem ser notada.', 'Usar cordas, sinais visuais e manter formação fechada.'],
  ['Vegetação agressiva', 'Plantas, fungos ou raízes reagem a calor, movimento ou magia.', 'Natureza ou Sobrevivência CD 12 a 17.', 'Envenenamento, restrição ou rota bloqueada.', 'Avançar lentamente, usar frio ou encontrar uma espécie que indique passagem segura.'],
  ['Ruína instável', 'Paredes, lajes ou túneis antigos podem desabar com peso ou vibração.', 'Investigação ou Ofício apropriado CD 13 a 18.', 'Desabamento parcial, isolamento ou destruição de uma pista.', 'Escorar a estrutura, remover carga ou buscar entrada externa.']
] as const;

const discoveryTemplates = [
  ['Observatório enterrado', 'Um círculo de lentes e pedras aponta para uma seção do céu que nunca está visível.', 'Exploração detalhada ou pista relacionada a estrelas.', 'Mapa de um ponto de influência e uma lente rara.', 'O observatório mede uma abertura, não estrelas.'],
  ['Câmara de nomes', 'Paredes internas contêm milhares de nomes, alguns pertencentes a pessoas vivas.', 'Encontrar a passagem oculta e superar a contenção.', 'Informação sobre uma pessoa desaparecida.', 'Nomes novos aparecem quando alguém dorme no hexágono.'],
  ['Oficina abandonada', 'Ferramentas antigas foram organizadas como se o trabalho fosse recomeçar em breve.', 'Investigar o marco ou seguir sinais humanos.', 'Materiais, projeto incompleto e reparos.', 'A oficina fabricava peças para o mecanismo de contenção.'],
  ['Jardim impossível', 'Uma pequena área mantém flora de estação e clima incompatíveis com a região.', 'Encontrar água, seguir fauna ou explorar durante o amanhecer.', 'Plantas medicinais e componente ritual.', 'O jardim cresce sobre memórias enterradas.'],
  ['Sepultura sem corpo', 'Uma tumba cuidadosamente lacrada contém apenas objetos pessoais e uma sombra fixa.', 'Decifrar símbolos ou obter permissão de um habitante.', 'Relíquia menor e pista histórica.', 'A pessoa enterrada ainda circula pela região sem saber que morreu.'],
  ['Portal incompleto', 'Uma moldura de pedra mostra profundidade onde deveria haver parede sólida.', 'Ativar símbolos em ordem correta.', 'Atalho temporário ou visão de outro local.', 'Cada uso aproxima algo do outro lado.'],
  ['Depósito de sobreviventes', 'Suprimentos antigos foram mantidos secos e organizados com cuidado.', 'Seguir marcas discretas ou conquistar confiança local.', 'Água, comida, ferramentas e mensagem.', 'O depósito é monitorado por alguém que nunca se mostra.']
] as const;

const storyHookTemplates = [
  ['O desaparecido que voltou', 'Uma pessoa procurada em outro lugar foi vista caminhando aqui sem envelhecer.', 'A presença começa a repetir vozes e memórias dessa pessoa.', 'Descobrir se é sobrevivente, cópia ou instrumento da Ferida.'],
  ['A rota proibida', 'Uma facção paga para que ninguém mapeie uma passagem específica.', 'Patrulhas, sabotagem e rumores contraditórios tornam a rota mais importante.', 'Escolher entre revelar, vender ou selar a passagem.'],
  ['O objeto que chama', 'Uma relíquia retirada do hexágono atrai animais, sonhos e pessoas.', 'Cada noite aumenta a influência e aproxima uma criatura.', 'Devolver, destruir ou usar o objeto para localizar o núcleo.'],
  ['A promessa antiga', 'Uma inscrição exige que alguém cumpra uma tarefa feita por uma comunidade extinta.', 'O local reage a cada recusa ou tentativa incompleta.', 'Cumprir, reinterpretar ou quebrar a promessa com consequências.'],
  ['O mapa impossível', 'Um mapa local mostra caminhos que ainda não existem.', 'As rotas aparecem uma a uma e levam a encontros preparados.', 'Descobrir quem desenhou o mapa e por que um caminho termina no grupo.'],
  ['A criatura guardiã', 'Uma ameaça local evita uma manifestação maior sem compreender sua função.', 'Caçadores ou facções querem matar a criatura e enfraquecem a contenção.', 'Proteger, substituir ou remover a criatura sem liberar o horror.']
] as const;

const cosmicPatternTemplates = [
  ['Sombras apontam para o mesmo ponto', 'Ocorre quando alguém mente, remove um objeto antigo ou pronuncia um nome específico.', 'A próxima pista aparece perto do ponto indicado.', 'O padrão revela que a presença reage a intenção, não apenas a movimento.'],
  ['Três sons idênticos', 'Surge antes de uma manifestação ou aproximação de criatura cósmica.', 'A terceira repetição altera uma pequena parte do ambiente.', 'Interromper o ritmo reduz temporariamente a influência.'],
  ['Memórias compartilhadas', 'Acontece após dormir, beber água local ou tocar símbolos.', 'Dois personagens lembram a mesma cena por perspectivas diferentes.', 'A cena contém um detalhe verdadeiro sobre a contenção.'],
  ['Distâncias inconsistentes', 'Aparece durante neblina, noite ou medo intenso.', 'Uma rota curta fica longa ou duas posições trocam de relação.', 'Marcas físicas permanecem confiáveis mesmo quando a visão falha.'],
  ['Objetos voltados para o marco', 'Metal, ossos ou madeira mudam lentamente de orientação.', 'O efeito aponta para o foco mais ativo naquele momento.', 'Objetos antigos reagem com mais precisão que objetos recentes.'],
  ['Reflexos atrasados', 'Ocorre perto de água, vidro ou metal polido.', 'O reflexo repete uma ação futura ou omite uma pessoa.', 'A diferença pode prever uma ameaça imediata.']
] as const;

const localCustoms = [
  'Viajantes deixam uma pedra sobre outra antes de entrar e removem apenas uma ao sair.',
  'Nomes próprios não são pronunciados depois do Anoitecer.',
  'Água é dividida antes de qualquer negociação, mesmo entre inimigos.',
  'Fogueiras são acesas em grupos de três e uma delas deve permanecer sem alimento.',
  'Objetos encontrados perto do marco nunca são carregados diretamente sobre a pele.',
  'Quem atravessa a região marca o próprio caminho com fios, não com cortes em árvores.'
];

const localTaboos = [
  'Dormir de costas para o marco principal.',
  'Responder a uma voz que chama duas vezes pelo mesmo nome.',
  'Mover pedras organizadas em círculos incompletos.',
  'Levar água local para fora da região sem fervê-la.',
  'Contar o número exato de estrelas visíveis durante a noite.',
  'Queimar plantas pálidas dentro de abrigo fechado.'
];

const localTrades = [
  'água filtrada, couro, mapas incompletos e ervas amargas',
  'ferramentas recuperadas, sal, carvão e informações sobre rotas',
  'componentes de criaturas, tecido grosso e medicamentos simples',
  'pedra trabalhada, metal antigo e guias para atravessar o terreno',
  'sementes resistentes, fungos comestíveis e objetos de peregrinos'
];

const localConflicts = [
  'uma facção quer explorar o marco enquanto sobreviventes locais tentam mantê-lo fechado',
  'caçadores culpam viajantes pelas mudanças na fauna, mas a causa real está no subsolo',
  'duas rotas comerciais disputam o controle do único abrigo confiável',
  'um grupo religioso considera o horror uma proteção e sabota tentativas de contenção',
  'moradores escondem desaparecimentos para evitar que uma ordem militar ocupe a região',
  'uma criatura local protege recursos necessários para sobreviver ao próximo inverno'
];

const sightFragments = [
  'Cinza fina acumulada apenas nas superfícies protegidas do vento.',
  'Marcas antigas surgem sob o terreno sempre que a luz muda.',
  'Movimentos breves aparecem no limite da visão e cessam quando observados.',
  'Pedras próximas apresentam riscos paralelos feitos em épocas diferentes.',
  'A vegetação forma corredores que parecem deliberados demais para serem naturais.',
  'Pegadas de tamanhos incompatíveis seguem lado a lado e terminam no mesmo ponto.',
  'Pequenos objetos pessoais foram pendurados em galhos, estacas ou ruínas.',
  'O horizonte possui uma linha escura que não corresponde a nuvens ou relevo.',
  'Reflexos mostram pessoas ou estruturas ausentes da paisagem real.',
  'Insetos pousam em padrões circulares e mudam de posição ao mesmo tempo.',
  'Uma área do solo permanece limpa, como se fosse usada com frequência.',
  'Sombras de estruturas antigas aparecem onde restam apenas fundações.'
];

const soundFragments = [
  'O vento parece carregar passos que acompanham o ritmo do grupo.',
  'Sons de animais cessam em intervalos regulares e retornam juntos.',
  'Pedras estalam sob o solo sem causa visível.',
  'Uma batida grave repete-se longe demais para localizar sua origem.',
  'Folhas e capim produzem um sussurro semelhante a uma conversa abafada.',
  'Um sino toca apenas quando ninguém está olhando para o marco.',
  'Água corre sob o terreno mesmo onde não existe nascente conhecida.',
  'Uma voz repete a última palavra pronunciada, mas em tom diferente.',
  'O som do próprio equipamento chega com pequeno atraso.',
  'Algo pesado se move paralelamente à rota sem romper a vegetação.',
  'Um canto de ave repete exatamente a mesma sequência, sem variação.',
  'Durante alguns segundos, todo som vem da direção errada.'
];

const smellFragments = [
  'Ferro molhado e poeira antiga.',
  'Vegetação amarga e madeira recém-partida.',
  'Fumaça fria de uma fogueira apagada há muito tempo.',
  'Ozônio e pedra recém-partida.',
  'Água parada misturada a flores doces demais.',
  'Couro úmido, sal e cinza.',
  'Terra aberta e um leve odor de sangue seco.',
  'Incenso desconhecido vindo de uma direção sem abrigo.',
  'Pelo molhado e resina aquecida.',
  'Nenhum cheiro, como se o olfato falhasse dentro de uma área específica.'
];

const touchFragments = [
  'O solo muda de temperatura em pequenas áreas.',
  'Objetos metálicos ficam frios perto do marco.',
  'A umidade deixa uma película fina sobre a pele.',
  'Uma vibração leve atravessa botas e ferramentas em intervalos regulares.',
  'O ar fica espesso por alguns passos, como água rasa.',
  'Pedras aparentemente secas deixam os dedos cobertos por condensação.',
  'Cabelos e tecidos são puxados para um ponto sem vento.',
  'A pele arrepia antes de qualquer som ou movimento perceptível.',
  'O peso da mochila parece variar ao atravessar certas linhas do terreno.',
  'Pequenos cortes e cicatrizes antigas coçam perto das inscrições.'
];

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
    `O silêncio noturno é interrompido por uma voz que pronuncia nomes conhecidos. O som vem de direções diferentes e nunca se repete da mesma forma.`,
    `Depois do último brilho do céu, a região parece maior. A rota percorrida durante o dia não corresponde mais às distâncias visíveis, e uma luz fraca pulsa perto de ${landmark}.`,
    `A escuridão traz um ruído que lembra chuva sobre telhas, embora o céu esteja limpo. O som forma um círculo lento ao redor do grupo.`
  ];
  const campDetails = [
    `Ao preparar acampamento, vocês percebem que o solo guarda calor em pontos isolados. Fogueiras antigas foram apagadas com cuidado, e marcas discretas sugerem que alguém dormiu olhando para ${landmark}.`,
    `O melhor lugar para descansar fica protegido do vento, mas dali é possível ouvir passos sobre a rota sem ver qualquer viajante. A cada troca de vigia, um objeto pequeno parece ter mudado de posição.`,
    `O acampamento oferece abrigo apenas parcial. Cinza fina se acumula contra as barracas e, durante alguns minutos, todas as sombras apontam para o mesmo ponto fora da luz.`,
    `Enquanto o grupo organiza os suprimentos, um animal local permanece observando a distância. Ele foge somente quando alguém menciona ${monster}.`
  ];
  const dawnDetails = [
    `A manhã chega sem um nascer do sol claro. A luz se espalha pela região e revela pegadas novas próximas ao acampamento, mas nenhuma delas se aproxima ou se afasta.`,
    `Ao amanhecer, a névoa recua em linhas retas e expõe um caminho menor que não era visível no dia anterior.`,
    `O primeiro som da manhã é um canto de ave repetido exatamente três vezes. Depois disso, a fauna volta a se mover como se nada tivesse acontecido.`,
    `A luz fraca destaca símbolos no terreno que desaparecerão quando o solo secar. Alguns parecem apontar para ${landmark}.`
  ];
  const badWeatherDetails = [
    `O clima fecha sobre ${title} com rapidez. A visibilidade cai, o solo muda de consistência e o som de ${landmark} — pedra, madeira ou metal — chega até vocês em intervalos regulares.`,
    `Vento e cinza transformam a região em uma sucessão de formas incompletas. Durante alguns instantes, uma silhueta semelhante a ${monster} acompanha o grupo paralelamente.`,
    `A chuva não cai de maneira uniforme: certas áreas permanecem secas e formam um caminho sinuoso que parece deliberado.`,
    `A tempestade revela cheiros e sons escondidos. O ar traz ferro, raízes partidas e uma voz distante pedindo que o grupo não avance.`
  ];
  const aftermathDetails = [
    `Quando o perigo passa, o lugar não retorna imediatamente ao normal. Marcas no solo formam um padrão ao redor de onde o grupo lutou, e pequenos animais observam sem se aproximar.`,
    `Depois do conflito, o silêncio se torna mais incômodo que os sons anteriores. Entre os restos há um objeto ou sinal que não pertence a nenhuma criatura presente.`,
    `A região parece registrar o ocorrido: pegadas antigas agora terminam no local do confronto e uma trilha nova aponta para ${landmark}.`,
    `O cheiro de sangue ou magia atrai insetos pálidos que pousam apenas sobre superfícies tocadas pela presença cósmica.`
  ];
  return {
    approach: pick(approachDetails, next),
    arrival: pick(arrivalDetails, next),
    crossing: pick(crossingDetails, next),
    exploration: pick(explorationDetails, next),
    night: pick(nightDetails, next),
    landmarkDiscovery: `Depois de seguir sinais quase apagados, vocês alcançam ${landmark}. De perto, o marco é maior e mais antigo do que parecia. Há sinais de ${monster}, mas também indícios de uso recente por mãos humanas. ${cosmicInfluence > 60 ? 'A superfície vibra em intervalos regulares, como se alguma coisa muito abaixo estivesse respirando.' : 'Símbolos gastos indicam que alguém tentou proteger ou esconder este lugar.'}`,
    camp: pick(campDetails, next),
    dawn: pick(dawnDetails, next),
    badWeather: pick(badWeatherDetails, next),
    aftermath: pick(aftermathDetails, next)
  };
}

export function generateHexLore(
  campaignSeed: string,
  q: number,
  r: number,
  terrain: TerrainType,
  biome: BiomeType,
  dangerLevel: number,
  cosmicInfluence: number,
  worldBible?: CampaignBible
): HexLore {
  const bible = worldBible ?? generateCampaignBible(campaignSeed);
  const region = resolveCampaignRegion(bible, campaignSeed, q, r);
  const next = random(`${campaignSeed}:${q}:${r}:lore-v5`);
  const title = `${pick(prefixes, next)} ${pick(suffixes, next)}`;
  const landmarkDescription = pick(landmarksByTerrain[terrain], next);
  const routeOne = pick(routeByTerrain[terrain], next);
  const routeTwo = pickDifferent(routeByTerrain[terrain], routeOne, next);
  const monsterNames = monstersByBiome[biome];
  const faunaNames = faunaByTerrain[terrain];
  const floraNames = floraByTerrain[terrain];
  const selectedMonsters = pickMany(monsterNames, 3, next);
  const [monsterOne, monsterTwo, monsterThree] = selectedMonsters;
  const atmosphereOptions = atmosphereFragments;
  const historyOptions = historyFragments;
  const horrorName = `${pick(['O Eco', 'A Vigília', 'O Sono', 'A Boca', 'O Reflexo', 'A Respiração'], next)} ${pick(['Subterrâneo', 'Sem Nome', 'de Pedra', 'da Última Estrela', 'do Mundo Oco', 'Entre as Raízes'], next)}`;
  const stage = cosmicInfluence > 82 ? 'CONTATO' : cosmicInfluence > 65 ? 'MANIFESTACAO' : cosmicInfluence > 40 ? 'VESTIGIO' : 'PRESSAGIO';
  const overview = `Uma extensão de ${biomeName(biome)} dentro de ${region.name}, marcada por ${landmarkDescription}. O terreno oferece rotas possíveis, mas nenhuma é completamente confiável. O perigo aparente é ${dangerLevel <= 3 ? 'baixo' : dangerLevel <= 6 ? 'considerável' : 'extremo'}, e sinais locais indicam atividade recente de criaturas, viajantes e alterações ligadas à Estrela Negra.`;
  const hiddenTruth = `A verdadeira origem de ${title} está ligada à rede criada pelo experimento de ${bible.catastrophe.wizardName}. ${landmarkDescription} toca uma linha secundária que conduz energia, memória ou distância até ${bible.portal.name}. A influência cósmica atual é ${cosmicInfluence}% e cresce quando viajantes permanecem durante a noite ou alteram símbolos antigos. ${region.secret}`;
  const narration = makeNarration(title, biome, landmarkDescription, monsterOne, cosmicInfluence, next);
  const npcName = `${pick(givenNames, next)} ${pick(surnames, next)}`;
  const secondNpcName = `${pickDifferent(givenNames, npcName.split(' ')[0], next)} ${pick(surnames, next)}`;
  const thirdNpcName = `${pick(givenNames, next)} ${pickDifferent(surnames, npcName.split(' ')[1], next)}`;

  const selectedFauna = pickMany(faunaNames, 5, next);
  const fauna = selectedFauna.map((name, index): HexLoreFauna => ({
    name: capitalize(name),
    abundance: pick(['RARA', 'INCOMUM', 'COMUM', 'ABUNDANTE'] as const, next),
    behavior: pick([
      'Move-se principalmente durante períodos claros e foge de sons metálicos.',
      'Permanece perto de água ou abrigo e fica imóvel quando percebe magia.',
      'Surge em pequenos grupos e abandona a região antes de manifestações sobrenaturais.',
      'Segue trilhas humanas por algum tempo, mas evita cruzar símbolos antigos.',
      'Alimenta-se ao Anoitecer e responde de forma incomum a vozes conhecidas.',
      'Mantém distância do marco principal, formando um limite natural ao redor dele.'
    ], next),
    signs: pick([
      'Fezes, pelos e trilhas estreitas próximas à rota.',
      'Marcas de alimentação e pegadas concentradas perto de terreno protegido.',
      'Sinais esparsos que desaparecem antes de áreas contaminadas.',
      'Ninhos, tocas ou restos organizados de forma incomum.',
      'Chamados interrompidos e pegadas que evitam uma linha invisível.',
      'Carcaças limpas demais, sem marcas evidentes de predador.'
    ], next),
    resource: index === 0 ? 'Carne, couro e indicação de áreas sem predadores imediatos.' : pick([
      'Componentes, alimento limitado ou indicação de água.',
      'Material raro, ingrediente alquímico ou aviso de mudança climática.',
      'Penas, veneno, gordura ou ossos úteis para ferramentas.',
      'Informação sobre rotas seguras e horários de atividade de predadores.',
      'Um componente que reage à influência cósmica local.'
    ], next)
  }));

  const selectedFlora = pickMany(floraNames, 5, next);
  const flora = selectedFlora.map((name, index): HexLoreFlora => ({
    name: capitalize(name),
    abundance: pick(['RARA', 'INCOMUM', 'COMUM', 'ABUNDANTE'] as const, next),
    appearance: pick([
      'Cresce em manchas largas e possui coloração acinzentada.',
      'Possui nervuras escuras e pequenas gotas claras nas folhas.',
      'Surge apenas em pontos protegidos e reage à aproximação de seres vivos.',
      'Suas folhas se voltam para o marco em vez de buscar luz.',
      'Apresenta flores pequenas que fecham quando alguém pronuncia um nome.',
      'Cresce em padrões quase geométricos ao redor de pedras antigas.'
    ], next),
    use: index === 0 ? 'Pode servir como forragem, combustível ruim ou material de isolamento.' : pick([
      'Pode ser preparada como remédio simples ou componente de veneno.',
      'É utilizada em rituais, antídotos raros ou preparação de tintas arcanas.',
      'Serve como alimento após preparo cuidadoso e remoção de partes tóxicas.',
      'Produz fibras, resina, óleo ou pigmento útil para a fortaleza.',
      'Reage a magia e pode indicar a proximidade de uma manifestação.'
    ], next),
    risk: pick([
      'A fumaça causa irritação se queimada em local fechado.',
      'Confundir a espécie com uma variedade venenosa é fácil.',
      'Contato prolongado pode provocar sonhos ou alteração temporária da percepção.',
      'A colheita atrai insetos, animais ou uma criatura territorial.',
      'Se retirada com a raiz, libera um cheiro que permanece por horas.',
      'Preparada incorretamente, causa febre, dormência ou perda de memória recente.'
    ], next)
  }));

  const monsters: HexLoreMonster[] = [monsterOne, monsterTwo, monsterThree].map((name, index) => ({
    name,
    threat: Math.min(10, Math.max(1, dangerLevel + index)),
    appearance: pick([
      'Uma figura irregular coberta por placas, fibras ou tecido natural do próprio bioma. Partes do corpo parecem ter sido montadas a partir de animais diferentes.',
      'Uma criatura de silhueta humanoide ou animal que muda de proporção quando vista por muito tempo.',
      'Um corpo adaptado ao terreno, com elementos de pedra, madeira, água ou cinza incorporados à anatomia.',
      'Uma presença cuja aparência é percebida primeiro por reflexos, sombras ou movimento da vegetação.',
      'Uma criatura marcada pela Ferida, com anatomia assimétrica e detalhes que não permanecem iguais entre observações.'
    ], next),
    signs: pick([
      'Pegadas interrompidas, silêncio repentino, presas abandonadas e marcas acima da altura humana.',
      'Objetos deslocados, odores estranhos, reflexos fora de posição e animais fugindo da mesma direção.',
      'Restos organizados por tamanho, trilhas circulares e marcas repetidas em árvores ou pedras.',
      'Chamados que imitam fauna local, mas repetem sempre a mesma sequência.',
      'Áreas onde a temperatura muda, cinza não se deposita e pequenas criaturas evitam passar.'
    ], next),
    behavior: pick([
      'Observa primeiro e tenta separar a presa do restante do grupo. Evita confronto aberto quando está ferido.',
      'Protege um território, objeto ou passagem específica. Pode imitar sinais de ajuda para atrair viajantes.',
      'Segue o grupo por longas distâncias e ataca apenas quando alguém fica isolado.',
      'Tenta assustar e expulsar invasores antes de arriscar combate direto.',
      'Age como se obedecesse a um padrão ou comando ligado ao marco principal.'
    ], next),
    motive: pick([
      'Alimentar-se de calor, medo, memória ou carne, dependendo da oportunidade.',
      'Impedir que alguém alcance a área oculta sob o marco principal.',
      'Recuperar um objeto retirado de seu território.',
      'Levar vítimas vivas para um covil, ritual ou foco de contaminação.',
      'Manter a contenção funcionando sem compreender sua função.'
    ], next),
    lair: pick([
      `Um abrigo natural a menos de uma hora de ${landmarkDescription}, cheio de restos organizados por tamanho.`,
      `Uma cavidade, porão ou estrutura menor ligada ao subsolo de ${landmarkDescription}.`,
      'Uma área elevada de onde pode observar duas rotas ao mesmo tempo.',
      'Uma toca parcialmente inundada ou tomada por raízes, marcada por objetos de vítimas.',
      'Um espaço impossível dentro de uma ruína, maior por dentro do que por fora.'
    ], next),
    tactics: pick([
      'Usa cobertura, investe contra alvos isolados e recua quando cercado.',
      'Ataca a partir de posição escondida, utiliza o terreno e tenta apagar fontes de luz.',
      'Força o grupo a atravessar terreno ruim e interrompe rotas de fuga.',
      'Produz sinais falsos, ataca o último da formação e muda de posição após cada golpe.',
      'Prioriza personagens que carregam objetos, magia ou marcas ligadas ao horror local.'
    ], next),
    weakness: pick([
      'Pode ser atraído por sons repetitivos e evita símbolos do antigo reino.',
      'Perde parte da força longe do local ao qual está ligado e reage mal a fogo intenso.',
      'Luz contínua revela sua posição e impede parte de sua camuflagem.',
      'Certos odores, plantas ou sons da fauna local interrompem seu comportamento de caça.',
      'Destruir ou mover o foco que protege enfraquece suas habilidades sobrenaturais.'
    ], next),
    reward: pick([
      'Partes do corpo podem servir como componente raro; o covil contém objetos de vítimas anteriores.',
      'Protege uma passagem, uma relíquia menor ou informações gravadas na própria estrutura.',
      'Seu corpo contém material útil para antídotos, armas ou rituais de contenção.',
      'O covil revela uma rota, um sobrevivente ou um mapa incompleto.',
      'Sua morte ou afastamento permite acesso temporário a um recurso importante.'
    ], next),
    suggestedStatBlock: index === 0 ? 'Use ND próximo ao nível médio do grupo com mobilidade e emboscada.' : index === 1 ? 'Use ND ligeiramente menor com controle de terreno, camuflagem ou imitação.' : 'Use uma ameaça rara de ND maior como presságio, perseguição ou encontro opcional.'
  }));

  const features: HexLoreFeature[] = [
    {
      name: capitalize(landmarkDescription), type: 'MARCO', visible: next() > 0.45,
      playerDescription: `O ponto mais marcante do hexágono é ${landmarkDescription}. Sua forma não combina totalmente com as construções conhecidas da região.`,
      masterDetails: 'O marco é o principal nó da história local e está conectado à verdade secreta. Uma passagem oculta permite alcançar uma câmara inferior.',
      interaction: 'Pode ser investigado, usado como abrigo imperfeito ou servir de ponto de orientação.',
      suggestedCheck: 'Investigação, História ou Sobrevivência CD 12 a 16.'
    },
    {
      name: pick(['Abrigo dos Viajantes', 'Posto Derrubado', 'Gruta de Pedra Seca', 'Cabana Sem Porta'], next), type: 'ABRIGO', visible: true,
      playerDescription: 'Uma depressão protegida, construção menor ou formação natural oferece abrigo contra parte do clima.',
      masterDetails: `O abrigo foi usado recentemente por ${npcName}. Há uma mensagem incompleta escondida sob pedras soltas.`,
      interaction: 'Permite preparar acampamento com menor risco, mas sinais recentes podem atrair curiosidade.',
      suggestedCheck: 'Sobrevivência CD 11 para tornar o local realmente seguro.'
    },
    {
      name: pick(['Fonte Incerta', 'Poço de Água Fria', 'Nascente de Pedra', 'Cisterna Esquecida'], next), type: 'RECURSO', visible: next() > 0.25,
      playerDescription: 'Há uma possível fonte de água e vegetação mais densa ao redor.',
      masterDetails: cosmicInfluence > 55 ? 'A água é potável após purificação, mas pode causar sonhos compartilhados.' : 'A água é segura após filtragem e fervura.',
      interaction: 'Pode reabastecer água e servir como ponto de encontro para fauna.',
      suggestedCheck: 'Natureza ou Sobrevivência CD 12 para avaliar a segurança.'
    },
    {
      name: pick(['Passagem Oculta', 'Trilha Entre Pedras', 'Corte Esquecido', 'Caminho de Caçadores'], next), type: 'CAMINHO', visible: false,
      playerDescription: 'Uma rota secundária pode existir entre acidentes do terreno.',
      masterDetails: `A passagem liga ${routeTwo} a uma entrada lateral sob ${landmarkDescription}.`,
      interaction: 'Pode ser mapeada, bloqueada ou usada para evitar a rota principal.',
      suggestedCheck: 'Percepção ou Investigação CD 14.'
    },
    {
      name: pick(['Área de Presságio', 'Clareira Silenciosa', 'Círculo de Frio', 'Solo Sem Sombras'], next), type: 'PERIGO', visible: false,
      playerDescription: 'Uma parte da região parece silenciosa e evita ser atravessada pela fauna.',
      masterDetails: `É o primeiro ponto de manifestação de ${horrorName}. Permanecer ali por muito tempo pode causar Abalo Cósmico.`,
      interaction: 'Pode ser estudada, contornada, consagrada ou utilizada em ritual.',
      suggestedCheck: 'Arcanismo, Religião ou Sobrevivência CD 15.'
    },
    {
      name: pick(['Restos de Acampamento', 'Carroça Tombada', 'Túmulo de Estrada', 'Altar Menor'], next), type: next() > 0.5 ? 'RUINA' : 'MARCO', visible: next() > 0.35,
      playerDescription: 'Restos humanos ou uma pequena construção indicam atividade anterior e uma interrupção repentina.',
      masterDetails: `Entre os restos há uma pista sobre ${monsterThree} e um objeto pertencente a ${thirdNpcName}.`,
      interaction: 'Pode fornecer pista, equipamento danificado ou um pequeno perigo.',
      suggestedCheck: 'Investigação ou Medicina CD 12 a 15.'
    },
    {
      name: pick(['Depósito Escondido', 'Jardim Protegido', 'Oficina Improvisada', 'Marco de Facção'], next), type: next() > 0.45 ? 'RECURSO' : 'RUINA', visible: false,
      playerDescription: 'Sinais discretos sugerem que alguém utiliza uma área fora da rota principal.',
      masterDetails: `O local está ligado ao conflito regional e pode conter suprimentos, ferramentas ou uma mensagem de ${secondNpcName}.`,
      interaction: 'Pode ser negociado, saqueado, protegido ou usado como ponto de contato.',
      suggestedCheck: 'Percepção, Investigação ou Intuição CD 13 a 16.'
    }
  ];

  const resources: HexLoreResource[] = [
    {
      name: 'Água local', category: 'AGUA',
      availability: terrain === TerrainType.PANTANO || terrain === TerrainType.REGIAO_ALAGADA ? 'ABUNDANTE' : terrain === TerrainType.CAMPO_DEVASTADO ? 'ESCASSA' : 'LIMITADA',
      access: 'Exige busca próxima a depressões, vegetação ou ruínas.',
      complication: cosmicInfluence > 55 ? 'Precisa ser purificada e pode carregar efeitos oníricos.' : 'Precisa ser filtrada ou fervida.'
    },
    {
      name: 'Alimento de coleta', category: 'COMIDA',
      availability: terrain === TerrainType.FLORESTA || terrain === TerrainType.FLORESTA_DENSA ? 'SUFICIENTE' : 'LIMITADA',
      access: 'Exige forrageamento e identificação correta de plantas e rastros.',
      complication: 'Parte da flora possui variedades semelhantes e tóxicas.'
    },
    {
      name: 'Materiais úteis', category: 'MATERIAL',
      availability: terrain === TerrainType.RUINAS ? 'ABUNDANTE' : 'LIMITADA',
      access: 'Madeira, pedra, metal reaproveitável ou fibras podem ser coletados.',
      complication: 'A coleta produz ruído, ocupa carga e pode desestabilizar estruturas.'
    },
    {
      name: flora[1].name, category: 'MEDICINAL',
      availability: flora[1].abundance === 'RARA' ? 'ESCASSA' : 'LIMITADA',
      access: 'Exige identificação e preparação adequadas.',
      complication: flora[1].risk
    },
    {
      name: pick(['Madeira seca', 'Turfa escura', 'Óleo vegetal', 'Carvão antigo', 'Resina inflamável'], next), category: 'COMBUSTIVEL',
      availability: terrain === TerrainType.CAMPO_DEVASTADO || terrain === TerrainType.MONTANHA ? 'ESCASSA' : 'LIMITADA',
      access: 'Pode ser coletado durante exploração ou retirado de uma característica local.',
      complication: cosmicInfluence > 65 ? 'A chama produz sombras que não correspondem aos objetos próximos.' : 'O material queima com fumaça forte e denuncia a posição.'
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
    },
    {
      title: pick(['A pessoa que não envelheceu', 'O sino sob a terra', 'A última fogueira', 'Os nomes na pedra'], next),
      text: pick([
        'Uma pessoa desaparecida teria voltado muitos anos depois sem ter envelhecido e sem reconhecer o próprio povoado.',
        'Em noites sem vento, um sino toca sob a terra e todos os animais se escondem antes da terceira badalada.',
        'Uma fogueira acesa no lugar correto revelaria todas as trilhas ocultas, mas também mostraria quem está seguindo o grupo.',
        'Algumas pedras guardariam nomes de pessoas antes mesmo de elas nascerem.'
      ], next),
      truth: pick([
        'A pessoa retornou como uma cópia formada por memórias locais.',
        'O sino é parte do mecanismo de contenção e toca quando alguém altera os símbolos.',
        'A luz revela resíduos de influência cósmica e atrai a atenção da presença.',
        'Os nomes aparecem por causa de uma estrutura que registra possibilidades futuras.'
      ], next)
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
    },
    {
      text: pick([
        `${thirdNpcName} estaria procurando alguém que morreu antes da Ferida.`,
        `Uma facção oferece pagamento por qualquer desenho dos símbolos de ${landmarkDescription}.`,
        `${monsterThree} nunca ataca quem carrega uma pedra branca no bolso.`,
        'Existe um abrigo onde nenhuma criatura entra, mas ninguém consegue dormir ali.'
      ], next),
      reliability: pick(['FALSO', 'PARCIAL', 'VERDADEIRO'] as const, next),
      source: pick(rumorSources, next),
      truth: pick([
        `${thirdNpcName} busca uma memória preservada, não uma pessoa viva.`,
        'A facção tenta reconstruir o mecanismo de contenção para controlá-lo.',
        `A pedra branca imita parte do símbolo que mantém ${monsterThree} afastado.`,
        'O abrigo está fora do alcance da criatura, mas dentro da influência do horror.'
      ], next)
    },
    {
      text: pick([
        'Uma rota aparece apenas durante chuva forte.',
        'Os corvos locais carregam objetos de pessoas desaparecidas.',
        'Dormir perto do marco permite ouvir conversas ocorridas no passado.',
        'Uma planta rara cresce onde alguém contou uma mentira importante.'
      ], next),
      reliability: pick(['FALSO', 'PARCIAL', 'VERDADEIRO'] as const, next),
      source: pick(rumorSources, next),
      truth: pick([
        'A água revela inscrições e degraus escondidos no terreno.',
        'As aves coletam objetos brilhantes perto de covis e ruínas.',
        'A estrutura repete memórias, mas também cria cenas falsas.',
        'A planta reage a estresse e presença cósmica, não à mentira em si.'
      ], next)
    }
  ];

  const inhabitants: HexLoreNpc[] = [
    {
      name: npcName,
      role: pick(['caçador perdido', 'cartógrafa errante', 'sobrevivente de uma caravana', 'coletor de ervas', 'desertor armado'], next),
      appearance: pick(['Roupas remendadas, equipamento bem cuidado e uma marca antiga escondida sob uma faixa.', 'Carrega ferramentas de viagem e um amuleto quebrado preso ao pescoço.', 'Usa peças de uniformes diferentes e evita deixar pegadas claras.'], next),
      manner: pick(['Observa as mãos de todos antes de responder e evita falar nomes próprios perto do marco.', 'Responde perguntas com outras perguntas e nunca fica de costas para a rota.', 'Fala com calma excessiva e verifica o céu sempre que alguém menciona a noite.'], next),
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
    },
    {
      name: thirdNpcName,
      role: pick(['curandeiro itinerante', 'caçadora de monstros', 'arqueólogo clandestino', 'refugiado de uma aldeia próxima', 'sacerdote sem ordem'], next),
      appearance: pick(['Possui cicatrizes recentes e carrega um recipiente que nunca abre.', 'Veste roupas inadequadas para o clima e mantém os olhos protegidos por lentes escuras.', 'Transporta páginas soltas de um livro queimado e uma arma cuidadosamente embrulhada.'], next),
      manner: pick(['Parece conhecer detalhes que ninguém contou.', 'Fica em silêncio quando animais fazem barulho e fala quando tudo se cala.', 'Trata o marco como se fosse uma pessoa capaz de ouvir.'], next),
      desire: pick(['Recuperar algo antes que uma facção chegue.', 'Confirmar se uma visão ou profecia é verdadeira.', 'Eliminar uma criatura sem revelar por que ela é importante.'], next),
      offer: pick(['Tratamento, conhecimento de criatura e ajuda temporária.', 'Um objeto de proteção, uma chave ou um nome verdadeiro.', 'Informações sobre outro hexágono e contato com uma facção.'], next),
      secret: pick([`Foi marcado por ${horrorName} e percebe manifestações antes dos demais.`, `Carrega uma parte do mecanismo de ${landmarkDescription}.`, `É seguido por ${monsterThree}, que ainda não decidiu atacar.`], next)
    }
  ];

  const horrorTruth = `${hiddenTruth} ${horrorName} não é uma criatura completa, mas uma pressão consciente transmitida pela estrutura. Ela utiliza memórias, vozes e padrões do ambiente para conduzir pessoas até pontos onde a contenção está enfraquecida.`;
  const encounters = [
    {
      title: `Rastros de ${monsterOne}`, type: 'VESTIGIO' as const,
      setup: 'A rota é interrompida por sinais recentes, restos de presa e um silêncio repentino.',
      development: 'A criatura está próxima, mas ainda observa. O grupo pode seguir os rastros, contornar ou preparar uma armadilha.',
      consequence: 'Seguir os sinais revela parte do covil; ignorá-los aumenta a chance de emboscada durante a Noite.'
    },
    {
      title: `Encontro com ${npcName}`, type: 'SOCIAL' as const,
      setup: `${npcName} surge em posição defensável e pede uma prova de que o grupo não trabalha para uma facção rival.`,
      development: 'A conversa pode render uma rota, um pedido de ajuda ou uma informação contraditória.',
      consequence: 'A forma como o grupo reage define se o NPC retorna como aliado, testemunha ou inimigo.'
    },
    {
      title: 'A fonte e os reflexos', type: 'HORROR' as const,
      setup: 'A água reflete pessoas que não estão presentes e mostra o grupo em posições diferentes.',
      development: 'Um personagem percebe um detalhe verdadeiro sobre o marco, mas corre risco de Abalo.',
      consequence: 'A água revela uma pista; coletá-la pode levar o fenômeno para outro lugar.'
    },
    {
      title: 'Descoberta do caminho antigo', type: 'DESCOBERTA' as const,
      setup: `Marcas sob a vegetação revelam ${routeTwo}.`,
      development: 'A rota pode ser mapeada, mas passa perto de uma área de perigo.',
      consequence: 'Mapeá-la reduz viagens futuras; usá-la imediatamente pode antecipar um encontro.'
    },
    {
      title: `${monsterThree} e o objeto perdido`, type: 'MONSTRO' as const,
      setup: `Um objeto pertencente a ${thirdNpcName} aparece no centro de sinais deixados por ${monsterThree}.`,
      development: 'A criatura pode estar usando o objeto como isca, protegendo-o ou tentando devolvê-lo.',
      consequence: 'Recuperar o objeto cria uma conexão com o NPC e revela parte do comportamento da criatura.'
    },
    {
      title: 'A mudança no clima', type: 'FAUNA' as const,
      setup: `${fauna[0].name} e ${fauna[1].name} abandonam a mesma direção em grande quantidade.`,
      development: 'O grupo pode seguir os animais, investigar a causa ou aproveitar o movimento para caçar.',
      consequence: 'A causa pode ser clima, predador, manifestação cósmica ou atividade humana.'
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
    },
    {
      clue: `O objeto de ${thirdNpcName} possui o mesmo símbolo encontrado no marco.`,
      reveals: 'O NPC, voluntariamente ou não, está ligado ao mecanismo local.',
      location: 'Perto de uma rota secundária ou entre sinais de criatura.'
    },
    {
      clue: 'A flora cresce em círculos interrompidos sempre no mesmo ponto.',
      reveals: 'Há uma estrutura, passagem ou foco de influência sob o solo.',
      location: `Entre manchas de ${flora[2].name}.`
    }
  ];

  const terrainChallenges = pickMany(terrainChallengeTemplates, 3, next).map(([name, description, check, failure, alternative]) => ({ name, description, check, failure, alternative }));
  const discoveries = pickMany(discoveryTemplates, 3, next).map(([name, description, requirement, reward, secret]) => ({ name, description, requirement, reward, secret }));
  const storyHooks = pickMany(storyHookTemplates, 3, next).map(([hookTitle, hook, escalation, resolution]) => ({ title: hookTitle, hook, escalation, resolution }));
  const cosmicPatterns = pickMany(cosmicPatternTemplates, cosmicInfluence > 65 ? 4 : 3, next).map(([manifestation, trigger, effect, clue]) => ({ manifestation, trigger, effect, clue }));
  const localCulture = {
    custom: pick(localCustoms, next),
    taboo: pick(localTaboos, next),
    trade: pick(localTrades, next),
    conflict: pick(localConflicts, next)
  };
  const linkedRelic = pick(bible.relics, next);
  const linkedFaction = bible.factions.find((faction) => faction.name === region.dominantFaction) ?? pick(bible.factions, next);
  const coordinateHints = [
    `Uma inscrição aponta para ${q >= 0 ? 'leste' : 'oeste'} e menciona uma distância de ${Math.max(1, Math.abs(q) + 1)} marcos.`,
    `Um mapa incompleto conecta este local a uma ruína na direção ${r >= 0 ? 'sudeste' : 'noroeste'}.`,
    `O mesmo símbolo deve reaparecer em um hexágono ligado à região ${pick(bible.regions, next).name}.`
  ];
  const historyLayers = {
    beforeCatastrophe: `Antes da Estrela Negra, este ponto de ${region.name} era usado por ${pick(['pastores', 'mineiros', 'monges solares', 'mercadores', 'cartógrafos', 'caçadores'], next)}. ${landmarkDescription} servia como ${pick(['santuário', 'depósito', 'observatório menor', 'marco de estrada', 'fortificação', 'estação de mensageiros'], next)} e mantinha ligação com outras comunidades da região.`,
    duringExperiment: `Na Noite do Meio-Dia Partido, o experimento ${bible.catastrophe.experimentName} fez símbolos surgirem sobre pedra, água e carne. Testemunhas viram ${region.blackStarManifestation.toLowerCase()} e ouviram o mesmo fragmento do ritual vindo de direções diferentes.`,
    afterOpening: `Nos anos seguintes, refugiados ocuparam o local, depois o abandonaram quando ${region.signatureCreature} passou a ser associado à rota. Uma facção removeu parte das inscrições, sem compreender que elas participavam do mecanismo do portal.`,
    currentState: `Hoje, ${title} é disputado indiretamente por ${linkedFaction.name}. A região conserva ${region.rareResource}, sinais de trânsito planar e uma pista incompleta para fechar ${bible.portal.name}.`
  };
  const revelationLayers = {
    sensed: `${region.blackStarManifestation} Há uma sensação de que o lugar está alinhado com algo muito distante.`,
    observed: `Marcas no terreno, na fauna e em ${landmarkDescription} repetem a mesma geometria vista em relatos sobre a Estrela Negra.`,
    investigated: `As inscrições locais não são decorativas: correspondem a uma função secundária do mecanismo criado por ${bible.catastrophe.wizardName}.`,
    confirmed: `O local conduz parte da energia de ${bible.portal.name} e reage a ${linkedRelic.name}. Interrompê-lo sem compreender sua função pode ampliar a abertura.`,
    understood: `Este hexágono é uma peça menor da rede de âncoras. A pista correta não ensina a combater ${bible.sunEater.name}; ensina como cortar a ligação pela qual ele consome o sol.`
  };
  const campaignConnections = {
    blackStarSign: region.blackStarManifestation,
    portalEcho: pick([
      `Durante alguns segundos, uma abertura escura aparece sobre ${landmarkDescription} e mostra corredores de ${bible.catastrophe.siteName}.`,
      `Objetos metálicos vibram no mesmo ritmo descrito nos registros de ${bible.portal.name}.`,
      `Sombras reproduzem gestos de magos que participaram do experimento.`
    ], next),
    solarDecaySign: region.solarDecaySign,
    linkedFaction: linkedFaction.name,
    linkedRelic: linkedRelic.name,
    objectiveClue: `Uma descoberta completa revela que ${linkedRelic.name} pode ajudar a localizar, calibrar ou proteger uma das âncoras necessárias para fechar o portal.`,
    linkedHexHints: coordinateHints
  };

  return {
    schemaVersion: 5,
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
      sights: pickMany(sightFragments, 5, next),
      sounds: pickMany(soundFragments, 5, next),
      smells: pickMany(cosmicInfluence > 60 ? [...smellFragments, 'Ozônio, vidro quente e chuva sobre metal.'] : smellFragments, 4, next),
      touch: pickMany(touchFragments, 4, next)
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
    history: `${pick(historyOptions, next)} ${historyLayers.currentState}`,
    historyLayers,
    region: {
      id: region.id,
      name: region.name,
      epithet: region.epithet,
      theme: region.theme,
      publicDescription: region.publicDescription,
      dominantFaction: region.dominantFaction,
      signatureCreature: region.signatureCreature,
      rareResource: region.rareResource,
      centralMystery: region.centralMystery,
      secret: region.secret
    },
    revelationLayers,
    campaignConnections,
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
    terrainChallenges,
    discoveries,
    localCulture,
    storyHooks,
    cosmicPatterns,
    masterGuide: {
      premise: `${title} oferece uma travessia possível, recursos limitados e um marco antigo que liga ${region.name} ao experimento que criou a Estrela Negra.`,
      hiddenTruth,
      activeConflict: `${npcName} tenta sobreviver enquanto ${monsterOne} protege involuntariamente a contenção e outra força procura enfraquecê-la.`,
      whatChangesIfIgnored: `Depois de ${Math.max(2, 7 - Math.min(5, dangerLevel))} dias, a influência avança para um hexágono vizinho, um rumor se torna público e uma ameaça passa a circular pela rota principal.`,
      connections: [`O símbolo local reaparece em outra peça da rede de âncoras.`, `${npcName} conhece alguém ligado a ${linkedFaction.name}.`, `Um objeto do covil reage a ${linkedRelic.name}.`, `A pista final deve apontar para o fechamento de ${bible.portal.name}, nunca para um combate contra ${bible.sunEater.name}.`],
      improvisationNotes: ['Apresente sinais antes de um combate.', 'Ofereça pelo menos duas rotas ou soluções.', 'Uma falha deve revelar algo com custo, não bloquear a investigação.', 'Use a Noite para aumentar o horror, não apenas a quantidade de inimigos.']
    },
    playerSummary: `${title} fica em ${region.name}, uma região de ${biomeName(biome)} conhecida por ${landmarkDescription}. Relatos mencionam recursos limitados, caminhos pouco confiáveis, fauna alterada, sinais de ${monsterOne} e manifestações da Estrela Negra.`,
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
