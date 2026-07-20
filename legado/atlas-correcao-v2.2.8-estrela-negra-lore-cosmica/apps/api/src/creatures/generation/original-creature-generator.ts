import { BiomeType, Hex } from '../../database/entities/hex.entity';
import {
  CreatureAction,
  CreatureSource,
  CreatureStatBlock,
  CreatureTheme,
  CreatureTrait
} from '../../database/entities/creature-template.entity';

export type CosmicArchetype = 'RANDOM' | 'STALKER' | 'BRUTE' | 'CONTROLLER' | 'ARTILLERY' | 'SWARM' | 'BOSS' | 'ORACLE' | 'LEECH' | 'SHAPER' | 'HERALD';
export type CosmicOrigin = 'RANDOM' | 'FERIDA' | 'VAZIO' | 'SONHO' | 'CRISTAL' | 'TEMPO' | 'PARASITA' | 'ABISMO' | 'ESTRELA_NEGRA' | 'ECLIPSE' | 'CINZA_SOLAR' | 'ESPELHO' | 'FOME';
export type CosmicMutation = 'RANDOM' | 'FRACTAL' | 'MULTIMEMBROS' | 'CORO' | 'OCO' | 'ESPELHO' | 'CICATRIZ_SOLAR' | 'PARASITARIA' | 'GEOMETRICA' | 'FLUTUANTE';
export type CosmicTemperament = 'RANDOM' | 'CURIOSO' | 'PREDATORIO' | 'RITUALISTICO' | 'PROTETOR' | 'COLETOR' | 'EMISSARIO' | 'FAMINTO' | 'DORMENTE';

export interface OriginalCreatureOptions {
  archetype?: CosmicArchetype;
  origin?: CosmicOrigin;
  monsterLevel?: number;
  mutation?: CosmicMutation;
  temperament?: CosmicTemperament;
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

function pick<T>(items: readonly T[], next: () => number): T {
  return items[Math.floor(next() * items.length) % items.length];
}

function pickMany<T>(items: readonly T[], amount: number, next: () => number): T[] {
  const available = [...items];
  const selected: T[] = [];
  while (available.length > 0 && selected.length < amount) {
    selected.push(available.splice(Math.floor(next() * available.length) % available.length, 1)[0]);
  }
  return selected;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
}

const prefixes = ['Oco', 'Velado', 'Cinzento', 'Sussurrante', 'Pálido', 'Quebrado', 'Sem-Rosto', 'Ferrugem', 'Sepulcral', 'Invertido', 'Imóvel', 'Faminto', 'Oblíquo', 'Afogado', 'Estelar', 'Desfeito'];
const cosmicNouns = ['Observador', 'Pastor de Estrelas', 'Devorador de Ecos', 'Filho da Fenda', 'Arauto do Subsolo', 'Nascido da Ferida', 'Geômetra', 'Portador do Último Som', 'Coração Ambulante', 'Vulto do Não-Lugar', 'Coletor de Rostos', 'Santo Incompleto', 'Oráculo de Carne', 'Animal da Lua Morta'];
const infectedNouns = ['Lobo', 'Cervo', 'Peregrino', 'Guardião', 'Caçador', 'Mineiro', 'Corvo', 'Javali', 'Soldado', 'Cão', 'Eremita', 'Carniçal'];
const randomNouns = ['Rastejante', 'Predador', 'Errante', 'Sentinela', 'Catador', 'Emboscador', 'Parasita', 'Carregador', 'Vigia'];

const silhouettes = [
  'uma silhueta alta demais, curvada como uma árvore sob vento permanente',
  'um corpo baixo e largo apoiado em seis membros de comprimentos diferentes',
  'uma forma humanoide envolta por apêndices que se abrem como costelas externas',
  'um volume quase esférico sustentado por pernas finas e articuladas ao contrário',
  'um quadrúpede cujo dorso se prolonga em uma coluna semelhante a um campanário',
  'uma massa alongada que alterna entre rastejar e ficar ereta sem mudar de anatomia',
  'um corpo que parece composto por várias criaturas menores tentando ocupar o mesmo espaço',
  'uma figura magra com braços que alcançam o chão e joelhos acima da cintura',
  'uma forma coberta por um manto que se revela feito da própria pele',
  'um animal impossível cuja metade dianteira parece chegar alguns instantes antes da traseira'
];

const anatomies = [
  'as articulações giram além do limite natural e fecham em ângulos perfeitos',
  'órgãos translúcidos flutuam sob a pele sem estarem presos ao restante do corpo',
  'pequenas mãos surgem ao longo do tórax e imitam os movimentos de quem a observa',
  'a caixa torácica abre e fecha como uma boca vertical',
  'os membros terminam em dedos longos com pequenas órbitas cegas nas pontas',
  'partes do corpo repetem-se em escalas menores, como uma anatomia dentro de outra',
  'o pescoço é substituído por uma sequência de anéis ósseos que deslizam entre si',
  'a coluna projeta agulhas negras que vibram quando alguém pensa em fugir',
  'a carne apresenta costuras naturais que se abrem para revelar um vazio sem profundidade',
  'o corpo não possui frente ou costas definidas e reorganiza os membros durante o movimento'
];

const surfaces = [
  'pele úmida semelhante a pedra polida',
  'placas de quitina cobertas por símbolos que mudam lentamente',
  'pelagem cinzenta entremeada por fios metálicos',
  'carne coberta por uma película que reflete um céu diferente',
  'escamas transparentes sob as quais passam sombras pequenas',
  'casca vegetal rachada por veios de luz violeta',
  'tecido pálido coberto por cristais que crescem ao som de vozes',
  'camadas de cinza aderidas como se fossem uma segunda pele',
  'membranas negras que absorvem a luz nas bordas',
  'ossos externos cobertos por inscrições naturais'
];

const movements = [
  'move-se em saltos entre posições, sem atravessar o espaço intermediário',
  'avança como se fosse puxada por fios invisíveis presos ao horizonte',
  'cada passo ocorre um instante antes do som correspondente',
  'permanece imóvel enquanto a paisagem parece deslizar sob ela',
  'caminha apenas quando ninguém pisca e congela quando observada diretamente',
  'dobra os membros contra o corpo e rola sem perder a orientação',
  'flutua poucos centímetros acima do solo e deixa pegadas mesmo assim',
  'imita a postura da criatura mais próxima antes de se mover',
  'desloca-se com lentidão até escolher uma presa, quando se torna subitamente veloz',
  'arrasta parte do corpo dentro de uma sombra que não corresponde à iluminação'
];

const faces = [
  'não há rosto, apenas uma depressão onde vozes conhecidas se formam',
  'o rosto possui olhos em círculos concêntricos e nenhuma boca visível',
  'uma máscara óssea muda de expressão sem mover-se',
  'a cabeça termina em uma abertura estrelada cercada por dentes pequenos',
  'vários rostos incompletos aparecem e afundam sob a pele',
  'um único olho ocupa toda a cabeça e reflete lembranças recentes',
  'a boca é uma linha vertical que atravessa o crânio até o peito',
  'o rosto parece normal até ser observado de perfil, quando desaparece',
  'uma coroa de antenas reage às emoções de quem está próximo',
  'a cabeça é coberta por um véu natural que sussurra nomes próprios'
];

const auras = [
  'o ar ao redor vibra como uma corda muito longa',
  'sombras próximas inclinam-se em sua direção',
  'cores perdem intensidade quando ela se aproxima',
  'sons são repetidos em volume mais baixo alguns segundos depois',
  'objetos metálicos apontam para a criatura',
  'a temperatura muda conforme ela direciona a atenção',
  'memórias breves surgem como se fossem acontecimentos presentes',
  'a distância até ela parece variar sem que ninguém se mova',
  'pequenos pontos de luz surgem sob a pele de quem sente medo',
  'a gravidade parece puxar levemente para os lados'
];

const voices = [
  'um coral baixo formado por vozes de pessoas ausentes',
  'o som de pedras sendo arrastadas muito abaixo do chão',
  'uma respiração que acompanha o ritmo de quem a escuta',
  'palavras pronunciadas ao contrário e compreendidas apenas depois',
  'um estalo semelhante a gelo partindo dentro do crânio',
  'o ruído de páginas viradas em uma sala vazia',
  'um sino distante tocado debaixo da água',
  'silêncio absoluto interrompido por nomes familiares'
];

const odors = [
  'ferro molhado e poeira antiga',
  'ozônio, cera queimada e água parada',
  'terra recém-aberta misturada a flores doces demais',
  'sal, sangue seco e madeira fria',
  'pedra aquecida sob chuva',
  'incenso desconhecido e pelo molhado',
  'frutas apodrecidas em ambiente gelado',
  'nada perceptível, como se o olfato deixasse de funcionar'
];

const biomeDescriptors: Partial<Record<BiomeType, string[]>> = {
  [BiomeType.CAMPOS_CINZENTOS]: ['coberto por cinza fina', 'com capim morto preso às articulações', 'marcado por linhas que repetem os sulcos do campo'],
  [BiomeType.BOSQUE_MORTO]: ['envolto em casca ressecada', 'com galhos crescendo sob a pele', 'carregando folhas que murmuram quando caem'],
  [BiomeType.MATA_PALIDA]: ['de pele branca e translúcida', 'marcado por veios semelhantes a raízes', 'misturando-se aos troncos quando permanece imóvel'],
  [BiomeType.TERRAS_ALTAS]: ['com placas de pedra nas costas', 'adaptado aos ventos cortantes', 'deixando pedras flutuando por instantes após a passagem'],
  [BiomeType.PICOS_NEGROS]: ['com olhos que refletem o céu', 'coberto por gelo escuro', 'exalando uma névoa que sobe contra o vento'],
  [BiomeType.BREJO_SILENCIOSO]: ['encharcado e coberto de fungos', 'com membros longos para atravessar a lama', 'arrastando uma água que não se mistura ao brejo'],
  [BiomeType.AGUAS_MORTAS]: ['com membranas pálidas', 'exalando cheiro de água parada', 'projetando um reflexo diferente de seu corpo'],
  [BiomeType.CICATRIZ_ANTIGA]: ['marcado por inscrições naturais', 'com partes que parecem pedra trabalhada', 'carregando fragmentos de construções incorporados à carne'],
  [BiomeType.ERMO_DE_CINZAS]: ['desidratado e leve demais', 'deixando rastros de pó negro', 'protegido por placas vitrificadas'],
  [BiomeType.ZONA_DA_FERIDA]: ['com anatomia impossível', 'mudando de forma quando não é observado', 'ocupando uma posição diferente em cada sombra']
};

const originConcepts: Record<Exclude<CosmicOrigin, 'RANDOM'>, { label: string; concept: string; weakness: string; resistance: string; power: string }> = {
  FERIDA: { label: 'Ferida', concept: 'um fragmento consciente da ruptura que separa o mundo de algo exterior', weakness: 'símbolos de contenção restaurados e interrupção do ponto que a ancora', resistance: 'psíquico', power: 'distorcer espaço e memória' },
  VAZIO: { label: 'Vazio', concept: 'uma ausência predatória que aprendeu a imitar matéria e intenção', weakness: 'luz contínua, ruído ritmado e espaços marcados por limites claros', resistance: 'necrótico', power: 'apagar som, calor e presença' },
  SONHO: { label: 'Sonho', concept: 'uma ideia compartilhada que adquiriu corpo depois de ser sonhada por muitas pessoas', weakness: 'contradições declaradas em voz alta e despertar simultâneo de suas vítimas', resistance: 'psíquico', power: 'invadir lembranças e fabricar percepções' },
  CRISTAL: { label: 'Cristal', concept: 'uma inteligência mineral que cresce usando carne como molde temporário', weakness: 'dano trovejante, vibração irregular e destruição dos cristais de foco', resistance: 'cortante', power: 'refletir magia e criar estilhaços vivos' },
  TEMPO: { label: 'Tempo', concept: 'um organismo preso entre vários instantes, alimentando-se de possibilidades não realizadas', weakness: 'ações repetidas em sequência exata e objetos vinculados a uma data verdadeira', resistance: 'radiante', power: 'antecipar ações e repetir momentos' },
  PARASITA: { label: 'Parasita', concept: 'uma colônia extraplanar que utiliza corpos e emoções como órgãos especializados', weakness: 'separação dos hospedeiros, fogo controlado e isolamento do núcleo', resistance: 'veneno', power: 'replicar-se e controlar hospedeiros' },
  ABISMO: { label: 'Abismo', concept: 'uma criatura adaptada à pressão de profundidades que não existem neste mundo', weakness: 'luz solar direta e redução brusca da pressão sobrenatural', resistance: 'frio', power: 'esmagar, atrair e alterar gravidade' },
  ESTRELA_NEGRA: { label: 'Estrela Negra', concept: 'uma manifestação formada diretamente pela cicatriz celeste aberta pelo experimento de Arkhad', weakness: 'diagramas do ritual original, luz solar concentrada e interrupção do alinhamento', resistance: 'psíquico', power: 'marcar alvos, abrir microfendas e distorcer sombras' },
  ECLIPSE: { label: 'Eclipse', concept: 'um avatar incompleto da pressão exercida pelo Devorador de Sóis sobre o portal', weakness: 'luz contínua de origem solar, ruptura do foco de eclipse e proteção heliacal', resistance: 'radiante', power: 'roubar calor, reduzir luz e criar zonas de noite' },
  CINZA_SOLAR: { label: 'Cinza Solar', concept: 'matéria queimada pela luz drenada do sol e reorganizada como organismo', weakness: 'água consagrada, frio extremo e dispersão de seu núcleo de cinza', resistance: 'fogo', power: 'queimar sem calor, sufocar e reconstruir-se de partículas' },
  ESPELHO: { label: 'Espelho', concept: 'uma cópia reflexiva que atravessou usando a imagem de seres vivos como molde', weakness: 'superfícies opacas, nomes verdadeiros e destruição simultânea dos reflexos', resistance: 'força', power: 'copiar gestos, trocar posições e devolver ataques' },
  FOME: { label: 'Fome', concept: 'um fragmento instintivo da entidade que consome o sol, pequeno demais para compreender o próprio propósito', weakness: 'privação de energia, círculos fechados e objetos que representam abundância', resistance: 'necrótico', power: 'drenar calor, magia, luz e vitalidade' }
};

const crXp: Array<[number, number]> = [
  [0, 10], [0.125, 25], [0.25, 50], [0.5, 100], [1, 200], [2, 450], [3, 700], [4, 1100], [5, 1800],
  [6, 2300], [7, 2900], [8, 3900], [9, 5000], [10, 5900], [11, 7200], [12, 8400], [13, 10000],
  [14, 11500], [15, 13000], [16, 15000], [17, 18000], [18, 20000], [19, 22000], [20, 25000],
  [21, 33000], [22, 41000], [23, 50000], [24, 62000], [25, 75000], [26, 90000], [27, 105000], [28, 120000], [29, 135000], [30, 155000]
];

function proficiencyForCr(cr: number) {
  if (cr < 5) return 2;
  if (cr < 9) return 3;
  if (cr < 13) return 4;
  if (cr < 17) return 5;
  if (cr < 21) return 6;
  if (cr < 25) return 7;
  if (cr < 29) return 8;
  return 9;
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

function damageExpression(cr: number, die = 8, multiplier = 1) {
  const targetAverage = Math.max(4, Math.round((5 + cr * 3.15) * multiplier));
  const modifier = Math.max(2, Math.min(10, Math.floor(cr / 3) + 2));
  const diceAverage = (die + 1) / 2;
  const diceCount = Math.max(1, Math.round((targetAverage - modifier) / diceAverage));
  return `${diceCount}d${die} + ${modifier}`;
}

function resolveOrigin(origin: CosmicOrigin | undefined, next: () => number): Exclude<CosmicOrigin, 'RANDOM'> {
  if (origin && origin !== 'RANDOM') return origin;
  return pick(['FERIDA', 'VAZIO', 'SONHO', 'CRISTAL', 'TEMPO', 'PARASITA', 'ABISMO', 'ESTRELA_NEGRA', 'ECLIPSE', 'CINZA_SOLAR', 'ESPELHO', 'FOME'] as const, next);
}

function resolveArchetype(archetype: CosmicArchetype | undefined, cr: number, next: () => number): Exclude<CosmicArchetype, 'RANDOM'> {
  if (archetype && archetype !== 'RANDOM') return archetype;
  const options: Array<Exclude<CosmicArchetype, 'RANDOM'>> = ['STALKER', 'BRUTE', 'CONTROLLER', 'ARTILLERY', 'SWARM', 'ORACLE', 'LEECH', 'SHAPER', 'HERALD'];
  if (cr >= 8) options.push('BOSS');
  return pick(options, next);
}

function archetypeLabel(archetype: Exclude<CosmicArchetype, 'RANDOM'>) {
  return {
    STALKER: 'Caçador',
    BRUTE: 'Brutamontes',
    CONTROLLER: 'Controlador',
    ARTILLERY: 'Artilharia',
    SWARM: 'Enxame',
    BOSS: 'Entidade dominante',
    ORACLE: 'Oráculo impossível',
    LEECH: 'Drenador de essência',
    SHAPER: 'Modelador de realidade',
    HERALD: 'Arauto do portal'
  }[archetype];
}

function resolveMutation(mutation: CosmicMutation | undefined, next: () => number): Exclude<CosmicMutation, 'RANDOM'> {
  if (mutation && mutation !== 'RANDOM') return mutation;
  return pick(['FRACTAL', 'MULTIMEMBROS', 'CORO', 'OCO', 'ESPELHO', 'CICATRIZ_SOLAR', 'PARASITARIA', 'GEOMETRICA', 'FLUTUANTE'] as const, next);
}

function resolveTemperament(temperament: CosmicTemperament | undefined, next: () => number): Exclude<CosmicTemperament, 'RANDOM'> {
  if (temperament && temperament !== 'RANDOM') return temperament;
  return pick(['CURIOSO', 'PREDATORIO', 'RITUALISTICO', 'PROTETOR', 'COLETOR', 'EMISSARIO', 'FAMINTO', 'DORMENTE'] as const, next);
}

const mutationProfiles: Record<Exclude<CosmicMutation, 'RANDOM'>, { label: string; appearance: string; trait: CreatureTrait; sign: string }> = {
  FRACTAL: { label: 'Anatomia fractal', appearance: 'partes do corpo repetem-se em escalas menores e continuam se movendo dentro umas das outras', trait: { name: 'Corpo Fractal', description: 'A primeira vez em cada rodada que sofre dano de um único alvo, a criatura reduz esse dano pelo bônus de proficiência.' }, sign: 'rastros menores surgem dentro de rastros maiores' },
  MULTIMEMBROS: { label: 'Membros excedentes', appearance: 'membros adicionais abrem-se do tórax e imitam ações vistas no turno anterior', trait: { name: 'Membros Redundantes', description: 'A criatura tem vantagem para resistir a ser agarrada ou derrubada e pode interagir com dois objetos simultaneamente.' }, sign: 'marcas de mãos aparecem em alturas impossíveis' },
  CORO: { label: 'Corpo coral', appearance: 'dezenas de bocas pequenas recitam trechos diferentes do ritual que abriu o portal', trait: { name: 'Coro Disruptivo', description: 'Criaturas hostis a até 3 m têm desvantagem no primeiro teste de concentração realizado em cada rodada.' }, sign: 'vozes distantes terminam frases iniciadas pelos viajantes' },
  OCO: { label: 'Interior ausente', appearance: 'a caixa torácica abre para um espaço negro muito maior que o corpo', trait: { name: 'Volume Ausente', description: 'A criatura não pode ser atravessada por teleporte involuntário e tem resistência a dano de força.' }, sign: 'objetos leves desaparecem e reaparecem dentro de recipientes fechados' },
  ESPELHO: { label: 'Reflexo autônomo', appearance: 'sua superfície reflete versões erradas das pessoas ao redor', trait: { name: 'Reflexo Atrasado', description: 'Quando um inimigo erra um ataque corpo a corpo, a criatura pode mover-se 1,5 m sem provocar ataques de oportunidade.' }, sign: 'reflexos se movem antes de seus donos' },
  CICATRIZ_SOLAR: { label: 'Cicatriz solar', appearance: 'uma abertura dourada e negra atravessa o corpo como um eclipse preso na carne', trait: { name: 'Fenda Heliacal', description: 'Ao sofrer dano radiante, a criatura emite luz intensa por uma rodada, perde suas resistências e causa dano radiante igual ao bônus de proficiência a criaturas adjacentes.' }, sign: 'cinzas frias formam pequenos discos eclipsados' },
  PARASITARIA: { label: 'Colônia parasitária', appearance: 'organismos menores entram e saem da pele, carregando pedaços de memória e tecido', trait: { name: 'Subcorpos', description: 'Ao chegar à metade dos pontos de vida, a criatura libera uma manifestação menor que ocupa um espaço adjacente e fornece meia cobertura.' }, sign: 'pequenas cápsulas pulsantes surgem sob pele de animais mortos' },
  GEOMETRICA: { label: 'Forma geométrica', appearance: 'ossos e carne formam linhas retas, polígonos e ângulos que não se fecham', trait: { name: 'Ângulos Inabitáveis', description: 'Ataques de oportunidade contra a criatura têm desvantagem e ela ignora terreno difícil criado por estruturas.' }, sign: 'pedras alinham-se em polígonos incompletos' },
  FLUTUANTE: { label: 'Corpo suspenso', appearance: 'órgãos e membros flutuam separados, unidos apenas por fios de sombra', trait: { name: 'Anatomia Suspensa', description: 'A criatura pode pairar e passar por aberturas estreitas sem se espremer.' }, sign: 'poeira permanece suspensa em camadas imóveis' }
};

const temperamentProfiles: Record<Exclude<CosmicTemperament, 'RANDOM'>, { label: string; behavior: string; motive: string }> = {
  CURIOSO: { label: 'Curioso', behavior: 'observa, imita e testa reações antes de atacar', motive: 'compreender como memória, dor e linguagem funcionam neste mundo' },
  PREDATORIO: { label: 'Predatório', behavior: 'isola o alvo mais vulnerável e evita combate prolongado', motive: 'alimentar-se de calor, magia ou medo' },
  RITUALISTICO: { label: 'Ritualístico', behavior: 'organiza objetos, corpos e sons em padrões antes de agir', motive: 'reproduzir uma parte do experimento que abriu o portal' },
  PROTETOR: { label: 'Protetor', behavior: 'defende um local, criatura ou fragmento de âncora até ser afastado', motive: 'preservar uma função do portal que considera parte do próprio corpo' },
  COLETOR: { label: 'Coletor', behavior: 'remove itens específicos, lembranças ou partes do corpo e tenta fugir', motive: 'montar um mapa vivo do mundo para algo do outro lado' },
  EMISSARIO: { label: 'Emissário', behavior: 'tenta comunicar imagens e propostas antes de usar violência', motive: 'preparar o mundo para uma travessia maior' },
  FAMINTO: { label: 'Faminto', behavior: 'avança de modo direto contra fontes de luz, magia e vida', motive: 'saciar uma fome herdada do Devorador de Sóis' },
  DORMENTE: { label: 'Dormente', behavior: 'permanece imóvel até um gatilho específico e então age com precisão', motive: 'aguardar o alinhamento, o nome ou o objeto que ativa sua função' }
};

function actionDc(cr: number, keyScore: number) {
  return 8 + proficiencyForCr(cr) + abilityModifier(keyScore);
}

function cosmicTraits(origin: Exclude<CosmicOrigin, 'RANDOM'>, archetype: Exclude<CosmicArchetype, 'RANDOM'>, cr: number, dc: number, next: () => number): CreatureTrait[] {
  const general = [
    { name: 'Anatomia Não Euclidiana', description: 'A criatura pode atravessar espaços ocupados por outras criaturas. Ataques de oportunidade contra ela são feitos com desvantagem.' },
    { name: 'Presença Incompreensível', description: `Uma criatura que inicia o turno a até 3 m deve superar um teste de resistência de Sabedoria CD ${dc} ou não pode realizar reações até o início do próximo turno.` },
    { name: 'Sangue que Recorda', description: 'Quando sofre dano, uma lembrança estranha invade a mente do atacante, revelando um sinal verdadeiro sobre a origem da criatura.' },
    { name: 'Contorno Instável', description: 'A primeira jogada de ataque realizada contra a criatura em cada rodada tem desvantagem, salvo se o atacante puder vê-la por meios mágicos.' },
    { name: 'Ecologia Impossível', description: 'A criatura não precisa respirar, comer ou dormir e não deixa rastros normais; seus sinais são alterações no ambiente.' }
  ];
  const originTraits: Partial<Record<Exclude<CosmicOrigin, 'RANDOM'>, CreatureTrait[]>> = {
    FERIDA: [{ name: 'Fenda Ambulante', description: `Ao atravessar uma abertura ou sombra, a criatura pode teleportar-se até ${cr >= 10 ? 12 : 6} m para outro ponto que possa ver.` }],
    VAZIO: [{ name: 'Ausência de Calor', description: 'Chamas não mágicas a até 3 m enfraquecem, e criaturas sem visão no escuro tratam a área como escuridão intensa.' }],
    SONHO: [{ name: 'Forma Onírica', description: `Ao sofrer dano psíquico, a criatura pode reduzir esse dano à metade e obrigar o agressor a realizar um teste de Sabedoria CD ${dc}.` }],
    CRISTAL: [{ name: 'Refração Hostil', description: 'A primeira magia que a alveja a cada rodada produz estilhaços; uma criatura próxima sofre dano perfurante igual ao bônus de proficiência.' }],
    TEMPO: [{ name: 'Eco do Instante', description: 'Uma vez por rodada, depois de errar um ataque, a criatura pode repetir a jogada contra o mesmo alvo.' }],
    PARASITA: [{ name: 'Colônia Distribuída', description: 'Enquanto possuir pelo menos metade dos pontos de vida, a criatura tem vantagem em testes de resistência de Constituição.' }],
    ABISMO: [{ name: 'Pressão do Não-Fundo', description: `Terreno a até 3 m é difícil para inimigos. Criaturas que começam o turno caídas sofrem ${Math.max(2, proficiencyForCr(cr))} de dano de força.` }],
    ESTRELA_NEGRA: [{ name: 'Marca da Estrela Negra', description: `Uma criatura que falha em um teste contra a criatura fica marcada até o fim do próximo turno. A primeira vez que sofrer dano, recebe ${Math.max(2, proficiencyForCr(cr))} de dano psíquico adicional.` }],
    ECLIPSE: [{ name: 'Halo de Eclipse', description: 'Luz intensa a até 3 m torna-se penumbra. Cura mágica recebida por inimigos nessa área é reduzida pelo bônus de proficiência.' }],
    CINZA_SOLAR: [{ name: 'Corpo de Cinza Fria', description: 'A criatura pode atravessar aberturas mínimas e, quando sofre dano de fogo, espalha uma nuvem que obscurece levemente a área até o próximo turno.' }],
    ESPELHO: [{ name: 'Imagem Hostil', description: 'A primeira criatura que a atingir em cada rodada vê uma cópia de si mesma e deve superar um teste de Sabedoria ou ter desvantagem no próximo ataque.' }],
    FOME: [{ name: 'Consumo de Luz', description: 'Quando uma criatura conjura magia ou recupera pontos de vida a até 6 m, esta criatura recebe pontos de vida temporários iguais ao bônus de proficiência.' }]
  };
  const archetypeTraits: Partial<Record<Exclude<CosmicArchetype, 'RANDOM'>, CreatureTrait[]>> = {
    STALKER: [{ name: 'Predador Entre Quadros', description: 'A criatura pode se Esconder como ação bônus e não revela sua posição ao errar um ataque à distância.' }],
    BRUTE: [{ name: 'Massa Impossível', description: 'A criatura conta como uma categoria de tamanho maior ao empurrar, agarrar ou resistir a essas manobras.' }],
    CONTROLLER: [{ name: 'Campo de Distorção', description: `Inimigos a até 4,5 m subtraem ${Math.max(1, Math.floor(proficiencyForCr(cr) / 2))} m do deslocamento.` }],
    ARTILLERY: [{ name: 'Olhos de Longa Distância', description: 'Ataques à distância da criatura ignoram meia cobertura e não sofrem desvantagem contra alvos adjacentes.' }],
    SWARM: [{ name: 'Corpo Coletivo', description: 'A criatura pode ocupar o espaço de outras criaturas e não pode ser agarrada ou derrubada enquanto tiver mais de 0 pontos de vida.' }],
    BOSS: [{ name: 'Resistência Lendária', description: `Se falhar em um teste de resistência, a criatura pode escolher obter sucesso. Pode fazer isso ${cr >= 15 ? 3 : 2} vezes por dia.` }],
    ORACLE: [{ name: 'Conhecimento Impossível', description: 'A criatura não pode ser surpreendida e sabe a localização de criaturas que tenham falhado em um teste de resistência contra ela.' }],
    LEECH: [{ name: 'Sifão de Essência', description: 'Uma vez por turno, quando causa dano necrótico ou psíquico, recupera pontos de vida iguais ao bônus de proficiência.' }],
    SHAPER: [{ name: 'Mundo Maleável', description: 'No início de cada turno, a criatura transforma um espaço de 3 m em terreno difícil, cobertura parcial ou superfície instável.' }],
    HERALD: [{ name: 'Voz do Portal', description: 'Aliados cósmicos a até 9 m somam o bônus de proficiência da criatura ao primeiro teste de resistência que fizerem em cada rodada.' }]
  };
  return [...pickMany(general, cr >= 8 ? 2 : 1, next), ...(originTraits[origin] ?? []), ...(archetypeTraits[archetype] ?? [])];
}

function cosmicActions(
  name: string,
  origin: Exclude<CosmicOrigin, 'RANDOM'>,
  archetype: Exclude<CosmicArchetype, 'RANDOM'>,
  cr: number,
  attackBonus: number,
  dc: number,
  next: () => number
) {
  const primaryNames = ['Garras de Ângulo Morto', 'Mordida do Intervalo', 'Lâmina de Osso Estelar', 'Tentáculo de Memória', 'Golpe da Forma Ausente', 'Mandíbula Interior', 'Apêndice de Vidro Negro'];
  const primaryDamage = damageExpression(cr, pick([6, 8, 10] as const, next), archetype === 'BRUTE' ? 1.25 : 0.9);
  const actions: CreatureAction[] = [{
    name: pick(primaryNames, next),
    description: `${name} realiza um ataque corpo a corpo contra uma criatura ao alcance. Em um acerto, o alvo sofre ${primaryDamage} de dano ${origin === 'CRISTAL' ? 'perfurante' : origin === 'VAZIO' ? 'necrótico' : 'cortante e psíquico'}. Se falhar em um teste de resistência de Força CD ${dc}, é movido 1,5 m em uma direção escolhida pela criatura.`,
    attackBonus,
    damage: primaryDamage,
    damageType: origin === 'CRISTAL' ? 'perfurante' : origin === 'VAZIO' ? 'necrótico' : 'cortante e psíquico'
  }];

  const originActions: Partial<Record<Exclude<CosmicOrigin, 'RANDOM'>, CreatureAction>> = {
    FERIDA: { name: 'Dobrar a Distância', description: `Uma linha de 9 m se contrai. Criaturas nela fazem um teste de Destreza CD ${dc}; em falha sofrem ${damageExpression(cr, 8, 0.8)} de dano de força e são puxadas 3 m.`, recharge: 'Recarga 5–6' },
    VAZIO: { name: 'Apagar Presença', description: `Uma criatura a até 18 m faz um teste de Carisma CD ${dc}. Em falha, fica invisível para seus aliados e não pode receber ajuda até o fim do próximo turno da criatura.`, recharge: 'Recarga 5–6' },
    SONHO: { name: 'Memória que Nunca Aconteceu', description: `Criaturas em um cone de 9 m fazem um teste de Sabedoria CD ${dc}. Em falha, sofrem ${damageExpression(cr, 6, 0.8)} de dano psíquico e ficam Amedrontadas até o fim do próximo turno.`, recharge: 'Recarga 5–6' },
    CRISTAL: { name: 'Coroa de Estilhaços', description: `Estilhaços atingem até três alvos a 18 m. Cada alvo faz um teste de Destreza CD ${dc}, sofrendo ${damageExpression(cr, 6, 0.65)} de dano perfurante em uma falha, ou metade em sucesso.`, recharge: 'Recarga 5–6' },
    TEMPO: { name: 'Repetir o Ferimento', description: `Uma criatura ferida desde o último turno repete parte do dano. Ela faz um teste de Constituição CD ${dc}; em falha sofre ${damageExpression(cr, 8, 0.7)} de dano de força.`, recharge: 'Recarga 6' },
    PARASITA: { name: 'Semente do Hospedeiro', description: `Uma criatura a até 9 m faz um teste de Constituição CD ${dc}. Em falha, fica Envenenada por 1 minuto e sofre ${damageExpression(cr, 6, 0.5)} de dano necrótico no início de cada turno até repetir o teste com sucesso.`, recharge: 'Recarga 5–6' },
    ABISMO: { name: 'Peso de Mil Braças', description: `Criaturas em um raio de 4,5 m fazem um teste de Força CD ${dc}. Em falha, sofrem ${damageExpression(cr, 8, 0.75)} de dano de força, caem e ficam com deslocamento 0 até o início do próximo turno.`, recharge: 'Recarga 5–6' },
    ESTRELA_NEGRA: { name: 'Abrir Microfenda', description: `Uma fenda surge em um ponto a até 18 m. Criaturas a 3 m fazem um teste de Destreza CD ${dc}; em falha sofrem ${damageExpression(cr, 8, 0.85)} de dano de força e são teleportadas 3 m.`, recharge: 'Recarga 5–6' },
    ECLIPSE: { name: 'Roubar o Meio-Dia', description: `Uma esfera de 6 m torna-se escuridão sobrenatural até o próximo turno. Inimigos nela fazem um teste de Constituição CD ${dc} ou sofrem ${damageExpression(cr, 8, 0.75)} de dano necrótico e não podem recuperar pontos de vida.`, recharge: 'Recarga 5–6' },
    CINZA_SOLAR: { name: 'Tempestade de Cinza Fria', description: `Um cone de 9 m causa ${damageExpression(cr, 6, 0.8)} de dano necrótico em falha num teste de Constituição CD ${dc}; a área fica obscurecida até o fim do próximo turno.`, recharge: 'Recarga 5–6' },
    ESPELHO: { name: 'Devolver a Forma', description: `Uma criatura a até 18 m faz um teste de Carisma CD ${dc}. Em falha, troca de posição com a criatura e sofre ${damageExpression(cr, 6, 0.65)} de dano psíquico.`, recharge: 'Recarga 5–6' },
    FOME: { name: 'Beber a Luz', description: `Criaturas em um raio de 6 m fazem um teste de Constituição CD ${dc}. Em falha, sofrem ${damageExpression(cr, 10, 0.9)} de dano necrótico; a criatura recupera metade do dano total causado.`, recharge: 'Recarga 6' }
  };
  actions.push(originActions[origin] ?? { name: 'Pulso da Estrela Negra', description: `Uma área de 6 m escurece. Criaturas nela fazem um teste de Sabedoria CD ${dc}; em falha sofrem ${damageExpression(cr, 8, 0.8)} de dano psíquico e não podem realizar reações até o próximo turno.`, recharge: 'Recarga 5–6' });

  const archetypeActions: Partial<Record<Exclude<CosmicArchetype, 'RANDOM'>, CreatureAction>> = {
    STALKER: { name: 'Ataque pela Sombra Errada', description: `A criatura teleporta-se até 9 m para uma área de penumbra e realiza um ataque. Se estava escondida, o ataque causa ${damageExpression(cr, 6, 0.45)} de dano psíquico adicional.` },
    BRUTE: { name: 'Impacto que Deforma', description: `Todas as criaturas em um raio de 3 m fazem um teste de Força CD ${dc}. Em falha, sofrem ${damageExpression(cr, 10, 0.9)} de dano de concussão e são derrubadas.`, recharge: 'Recarga 5–6' },
    CONTROLLER: { name: 'Campo de Posições Falsas', description: `Escolha até três pontos a 18 m. Cada criatura em um ponto faz um teste de Sabedoria CD ${dc}; em falha, é teleportada para outro ponto escolhido e fica Desorientada até o fim do turno.` },
    ARTILLERY: { name: 'Raio da Estrela Morta', description: `Ataque à distância contra um alvo a até 36 m. Em um acerto, causa ${damageExpression(cr, 10, 1.05)} de dano radiante e psíquico.`, attackBonus, damage: damageExpression(cr, 10, 1.05), damageType: 'radiante e psíquico' },
    SWARM: { name: 'Passar por Dentro', description: `A criatura atravessa espaços ocupados. Cada criatura atravessada faz um teste de Destreza CD ${dc}, sofrendo ${damageExpression(cr, 6, 0.6)} de dano cortante e psíquico em uma falha.` },
    BOSS: { name: 'Manifestação Total', description: `A realidade se rompe em um raio de 9 m. Inimigos fazem um teste de Sabedoria CD ${dc}; em falha sofrem ${damageExpression(cr, 10, 1.15)} de dano psíquico e ficam Amedrontados por 1 minuto.`, recharge: 'Recarga 6' },
    ORACLE: { name: 'Profecia Autocumprida', description: `Escolha uma criatura a até 18 m e declare queda, silêncio ou fuga. No fim do próximo turno, ela faz um teste de Sabedoria CD ${dc}; em falha sofre ${damageExpression(cr, 8, 0.75)} de dano psíquico e sofre o efeito narrado até o fim do turno seguinte.`, recharge: 'Recarga 5–6' },
    LEECH: { name: 'Sifão da Aurora', description: `Uma criatura a até 9 m faz um teste de Constituição CD ${dc}; em falha sofre ${damageExpression(cr, 8, 0.9)} de dano necrótico e a criatura recupera a metade.`, recharge: 'Recarga 5–6' },
    SHAPER: { name: 'Reescrever Terreno', description: `Uma área de 6 m a até 18 m torna-se parede, fenda, lama viva ou superfície inclinada. Criaturas nela fazem um teste de Destreza CD ${dc} ou sofrem ${damageExpression(cr, 6, 0.6)} de dano de força e caem.` },
    HERALD: { name: 'Convocar Eco Menor', description: `Uma manifestação de ND muito inferior surge em um espaço a até 9 m ou um aliado cósmico pode usar sua reação para mover-se e atacar.`, recharge: 'Recarga 6' }
  };
  const archetypeAction = archetypeActions[archetype] ?? { name: 'Função Impossível', description: `A criatura impõe sua função ao campo. Uma criatura a até 18 m faz um teste de Sabedoria CD ${dc}; em falha sofre ${damageExpression(cr, 8, 0.7)} de dano psíquico e é movida 3 m.` };
  if (cr >= 2) actions.push(archetypeAction);
  return actions;
}

function cosmicBonusActions(archetype: Exclude<CosmicArchetype, 'RANDOM'>, cr: number): CreatureAction[] {
  if (cr < 2) return [];
  const options: Partial<Record<Exclude<CosmicArchetype, 'RANDOM'>, CreatureAction>> = {
    STALKER: { name: 'Sumir Entre Olhares', description: 'A criatura realiza a ação Esconder ou move-se até metade do deslocamento sem provocar ataques de oportunidade.' },
    BRUTE: { name: 'Avanço Irresistível', description: 'A criatura move-se até metade do deslocamento em linha reta e pode empurrar uma criatura atravessada.' },
    CONTROLLER: { name: 'Reposicionar Peça', description: 'Uma criatura afetada por uma habilidade cósmica é movida 1,5 m.' },
    ARTILLERY: { name: 'Ajustar o Horizonte', description: 'A próxima jogada de ataque à distância da criatura tem vantagem.' },
    SWARM: { name: 'Fragmentar', description: 'A criatura move-se através de uma abertura mínima e recebe meia cobertura até o início do próximo turno.' },
    BOSS: { name: 'Comando da Ferida', description: 'Uma criatura aliada ou manifestação move-se e realiza uma ação menor.' },
    ORACLE: { name: 'Antecipar Decisão', description: 'A criatura escolhe um inimigo; até o próximo turno, a primeira reação desse inimigo falha sem efeito.' },
    LEECH: { name: 'Aderir à Sombra', description: 'A criatura move-se até metade do deslocamento em direção a um alvo ferido e recebe pontos de vida temporários.' },
    SHAPER: { name: 'Dobrar Cobertura', description: 'A criatura cria meia cobertura adjacente ou remove cobertura de um alvo até o próximo turno.' },
    HERALD: { name: 'Chamado da Estrela', description: 'Um aliado a até 18 m move-se até metade do deslocamento sem provocar ataques de oportunidade.' }
  };
  return [options[archetype] ?? { name: 'Reposicionar-se pela Fenda', description: 'A criatura move-se até metade do deslocamento sem provocar ataques de oportunidade.' }];
}

function cosmicReactions(origin: Exclude<CosmicOrigin, 'RANDOM'>, cr: number, dc: number): CreatureAction[] {
  if (cr < 3) return [];
  return [{
    name: origin === 'TEMPO' ? 'Isso Ainda Não Aconteceu' : 'Reflexo da Ferida',
    description: origin === 'TEMPO'
      ? 'Quando é atingida, a criatura reduz o dano pela metade e move-se 3 m para uma posição que ocupava desde o último turno.'
      : `Quando uma criatura a atinge, o agressor faz um teste de Sabedoria CD ${dc}. Em falha, não pode realizar reações e vê uma lembrança que não lhe pertence.`
  }];
}

function cosmicLegendaryActions(archetype: Exclude<CosmicArchetype, 'RANDOM'>, cr: number, attackBonus: number): CreatureAction[] {
  if (archetype !== 'BOSS' && cr < 12) return [];
  return [
    { name: 'Movimento Antinatural', description: 'A criatura move-se até metade do deslocamento sem provocar ataques de oportunidade.' },
    { name: 'Toque do Não-Lugar', description: `A criatura realiza um ataque cósmico contra um alvo ao alcance.`, attackBonus },
    { name: 'Pulso de Distorção (Custa 2 ações)', description: 'Criaturas a até 3 m são movidas 1,5 m e não podem realizar reações até o início do próximo turno.' }
  ];
}

function infectedTraits(cr: number): CreatureTrait[] {
  const traits: CreatureTrait[] = [{ name: 'Carne Contaminada', description: 'Quando sofre dano corpo a corpo, a criatura libera fluidos ou esporos; o atacante deve superar um teste de Constituição ou não pode recuperar pontos de vida até o início do próximo turno.' }];
  if (cr >= 5) traits.push({ name: 'Não Sente Dor', description: 'A primeira vez que seria reduzida a 0 pontos de vida, fica com 1 ponto de vida, salvo se tiver sofrido dano radiante desde o último turno.' });
  return traits;
}

function standardActions(name: string, cr: number, theme: CreatureTheme, next: () => number): CreatureAction[] {
  const proficiency = proficiencyForCr(cr);
  const attackBonus = Math.max(3, proficiency + 3 + Math.floor(cr / 6));
  const primaryDamage = damageExpression(cr, 8, 0.85);
  const actions: CreatureAction[] = [{
    name: pick(['Garras', 'Mordida', 'Golpe deformado', 'Lâmina óssea'], next),
    description: `${name} realiza um ataque corpo a corpo. Em um acerto, causa ${primaryDamage} de dano e empurra o alvo 1,5 m se ele falhar em um teste de resistência de Força.`,
    attackBonus,
    damage: primaryDamage,
    damageType: theme === CreatureTheme.INFECTED ? 'perfurante e necrótico' : 'cortante'
  }];
  if (cr >= 3) actions.push({
    name: theme === CreatureTheme.INFECTED ? 'Esporos da Infecção' : 'Investida Brutal',
    description: theme === CreatureTheme.INFECTED
      ? 'Uma nuvem de partículas cobre uma área próxima. Criaturas na área fazem um teste de Constituição; em falha, ficam Envenenadas até o fim do próximo turno.'
      : 'A criatura avança até seu deslocamento e ataca. Se acertar após mover pelo menos 6 m, causa dano adicional.',
    recharge: 'Recarga 5–6'
  });
  return actions;
}

export function generateOriginalCreature(
  seed: string,
  theme: CreatureTheme,
  targetCr: number,
  hex?: Pick<Hex, 'biome' | 'dangerLevel' | 'cosmicInfluence'>,
  base?: CreatureStatBlock,
  options: OriginalCreatureOptions = {}
): CreatureStatBlock {
  const next = random(seed);
  const cr = clamp(targetCr || options.monsterLevel || 1, 0.125, 30);
  const resolvedTheme = theme === CreatureTheme.RANDOM
    ? pick([CreatureTheme.STANDARD, CreatureTheme.COSMIC, CreatureTheme.INFECTED], next)
    : theme;
  const origin = resolveOrigin(options.origin, next);
  const archetype = resolveArchetype(options.archetype, cr, next);
  const mutation = resolveMutation(options.mutation, next);
  const temperament = resolveTemperament(options.temperament, next);
  const mutationProfile = mutationProfiles[mutation];
  const temperamentProfile = temperamentProfiles[temperament];
  const noun = base?.name ?? (resolvedTheme === CreatureTheme.COSMIC
    ? pick(cosmicNouns, next)
    : resolvedTheme === CreatureTheme.INFECTED
      ? pick(infectedNouns, next)
      : pick(randomNouns, next));
  const name = base
    ? `${base.name} ${resolvedTheme === CreatureTheme.COSMIC ? `da ${originConcepts[origin].label}` : resolvedTheme === CreatureTheme.INFECTED ? 'Infectado' : 'Alterado'}`
    : `${pick(prefixes, next)} ${noun}`;
  const descriptor = pick(biomeDescriptors[hex?.biome ?? BiomeType.ERMO_DE_CINZAS] ?? ['adaptado ao ermo'], next);
  const size = base?.size ?? (archetype === 'SWARM' ? 'Médio' : cr < 1 ? 'Pequeno' : cr < 5 ? 'Médio' : cr < 12 ? 'Grande' : cr < 21 ? 'Enorme' : 'Imenso');
  const roleHpMultiplier = archetype === 'BRUTE' ? 1.35 : archetype === 'BOSS' ? 1.5 : archetype === 'ARTILLERY' ? 0.8 : archetype === 'STALKER' ? 0.88 : 1;
  const baseHp = base?.hitPoints ?? Math.round(16 + cr * 16 + Math.pow(cr, 1.2) * 2);
  const hitPoints = Math.max(5, Math.round(baseHp * roleHpMultiplier));
  const armorClass = Math.max(base?.armorClass ?? 0, clamp(12 + Math.floor(cr / 3) + (archetype === 'STALKER' ? 1 : 0), 12, 22));
  const hitDice = base?.hitDice ?? `${Math.max(2, Math.ceil(hitPoints / (size === 'Grande' ? 10 : size === 'Enorme' || size === 'Imenso' ? 12 : 8)))}d${size === 'Grande' ? 10 : size === 'Enorme' || size === 'Imenso' ? 12 : 8} + ${Math.max(0, Math.floor(cr * 2))}`;
  const proficiencyBonus = proficiencyForCr(cr);
  const baseAbilities = {
    str: archetype === 'BRUTE' ? 16 + Math.floor(cr / 3) : 11 + Math.floor(cr / 4),
    dex: archetype === 'STALKER' || archetype === 'ARTILLERY' ? 16 + Math.floor(cr / 4) : 11 + Math.floor(cr / 6),
    con: 14 + Math.floor(cr / 3),
    int: resolvedTheme === CreatureTheme.COSMIC ? 11 + Math.floor(cr / 4) : 5 + Math.floor(next() * 6),
    wis: 12 + Math.floor(cr / 5),
    cha: resolvedTheme === CreatureTheme.COSMIC ? 13 + Math.floor(cr / 4) : 7 + Math.floor(next() * 6)
  };
  const abilities = base?.abilities ?? {
    str: clamp(baseAbilities.str, 3, 30),
    dex: clamp(baseAbilities.dex, 3, 30),
    con: clamp(baseAbilities.con, 3, 30),
    int: clamp(baseAbilities.int, 3, 30),
    wis: clamp(baseAbilities.wis, 3, 30),
    cha: clamp(baseAbilities.cha, 3, 30)
  };
  const keyScore = archetype === 'BRUTE' ? abilities.str : archetype === 'STALKER' || archetype === 'ARTILLERY' ? abilities.dex : abilities.cha;
  const attackBonus = proficiencyBonus + abilityModifier(keyScore);
  const dc = actionDc(cr, keyScore);

  const silhouette = pick(silhouettes, next);
  const anatomy = pick(anatomies, next);
  const surface = pick(surfaces, next);
  const movement = pick(movements, next);
  const face = pick(faces, next);
  const aura = pick(auras, next);
  const voice = pick(voices, next);
  const odor = pick(odors, next);
  const appearanceProfile = { silhouette, anatomy, surface, movement, face, aura, voice, odor };

  const cosmicDescription = `${name} apresenta ${silhouette}. ${capitalize(surface)}; ${anatomy}. ${capitalize(face)}. A mutação dominante é ${mutationProfile.label.toLowerCase()}: ${mutationProfile.appearance}. Quando se desloca, ${movement}. Sua presença altera o ambiente: ${aura}. É ${descriptor}.`;
  const cosmicNarration = `Antes que a criatura seja vista, vocês ouvem ${voice} e percebem um cheiro de ${odor}. Então ${silhouette} atravessa o limite da visão. ${capitalize(surface)} e ${anatomy}. ${capitalize(face)}. ${capitalize(mutationProfile.appearance)}. Ela não caminha como um animal: ${movement}. Ao redor dela, ${aura}.`;
  const infectedNarration = `Um ruído úmido precede a aparição. ${name} avança com movimentos interrompidos, ${descriptor}; partes de seu corpo continuam reagindo mesmo quando o restante fica imóvel.`;
  const standardNarration = `Entre a vegetação e as cinzas surge ${name}, ${descriptor}. Ele observa o grupo em silêncio antes de escolher entre recuar, seguir ou atacar.`;

  const traits = base?.traits?.length
    ? [...base.traits, ...(resolvedTheme === CreatureTheme.COSMIC ? cosmicTraits(origin, archetype, cr, dc, next) : resolvedTheme === CreatureTheme.INFECTED ? infectedTraits(cr) : [{ name: 'Predador do Ermo', description: 'A criatura tem vantagem em testes para rastrear criaturas feridas ou isoladas em seu ambiente.' }])]
    : resolvedTheme === CreatureTheme.COSMIC
      ? cosmicTraits(origin, archetype, cr, dc, next)
      : resolvedTheme === CreatureTheme.INFECTED
        ? infectedTraits(cr)
        : [{ name: 'Predador do Ermo', description: 'A criatura tem vantagem em testes para rastrear criaturas feridas ou isoladas em seu ambiente.' }];
  if (resolvedTheme === CreatureTheme.COSMIC) traits.push(mutationProfile.trait);
  const actions = resolvedTheme === CreatureTheme.COSMIC
    ? cosmicActions(name, origin, archetype, cr, attackBonus, dc, next)
    : base?.actions?.length ? base.actions : standardActions(name, cr, resolvedTheme, next);
  const bonusActions = resolvedTheme === CreatureTheme.COSMIC ? cosmicBonusActions(archetype, cr) : base?.bonusActions ?? [];
  const reactions = resolvedTheme === CreatureTheme.COSMIC ? cosmicReactions(origin, cr, dc) : base?.reactions ?? [];
  const legendaryActions = resolvedTheme === CreatureTheme.COSMIC ? cosmicLegendaryActions(archetype, cr, attackBonus) : cr >= 10 ? [{ name: 'Movimento Antinatural', description: 'A criatura se move até metade do deslocamento sem provocar ataques de oportunidade.' }] : base?.legendaryActions ?? [];
  const phases = resolvedTheme === CreatureTheme.COSMIC && (archetype === 'BOSS' || cr >= 10)
    ? [
        { name: 'A Forma Observada', trigger: 'Do início do combate até metade dos pontos de vida.', effect: `A criatura luta como ${archetypeLabel(archetype).toLowerCase()} e testa as reações do grupo.` },
        { name: 'A Forma Verdadeira', trigger: 'Ao chegar à metade dos pontos de vida.', effect: `A manifestação de ${originConcepts[origin].label} se intensifica; a criatura usa imediatamente uma ação com recarga e sua aura alcança mais 1,5 m.` },
        { name: 'O Último Vínculo', trigger: 'Ao ser reduzida a 0 pontos de vida pela primeira vez.', effect: 'O núcleo permanece por uma rodada. Destruí-lo ou conter o foco impede um retorno futuro.' }
      ]
    : [];

  return {
    name,
    baseName: base?.name,
    source: CreatureSource.ORIGINAL,
    theme: resolvedTheme,
    size,
    type: resolvedTheme === CreatureTheme.COSMIC ? 'Aberração cósmica' : resolvedTheme === CreatureTheme.INFECTED ? 'Monstruosidade infectada' : base?.type ?? 'Monstruosidade',
    alignment: base?.alignment ?? 'Além de alinhamento',
    armorClass,
    armorDescription: base?.armorDescription ?? (resolvedTheme === CreatureTheme.COSMIC ? 'corpo impossível' : 'armadura natural'),
    hitPoints,
    hitDice,
    speed: base?.speed ?? (archetype === 'ARTILLERY' ? { walk: '9 m', fly: '9 m (pairar)' } : archetype === 'SWARM' ? { walk: '9 m', climb: '9 m' } : { walk: archetype === 'STALKER' ? '12 m' : '9 m' }),
    abilities,
    savingThrows: base?.savingThrows ?? { con: abilityModifier(abilities.con) + proficiencyBonus, wis: abilityModifier(abilities.wis) + proficiencyBonus, cha: abilityModifier(abilities.cha) + proficiencyBonus },
    skills: base?.skills ?? { perception: abilityModifier(abilities.wis) + proficiencyBonus, stealth: abilityModifier(abilities.dex) + proficiencyBonus },
    damageVulnerabilities: resolvedTheme === CreatureTheme.COSMIC ? [] : base?.damageVulnerabilities ?? (resolvedTheme === CreatureTheme.INFECTED ? ['radiante'] : []),
    damageResistances: [...new Set([...(base?.damageResistances ?? []), ...(resolvedTheme === CreatureTheme.COSMIC ? [originConcepts[origin].resistance, 'dano de armas não mágicas'] : resolvedTheme === CreatureTheme.INFECTED ? ['necrótico'] : [])])],
    damageImmunities: base?.damageImmunities ?? [],
    conditionImmunities: [...new Set([...(base?.conditionImmunities ?? []), ...(resolvedTheme === CreatureTheme.COSMIC ? ['Amedrontado'] : [])])],
    senses: [...new Set([...(base?.senses ?? []), resolvedTheme === CreatureTheme.COSMIC ? 'visão no escuro 36 m' : 'visão no escuro 18 m', `Percepção passiva ${10 + abilityModifier(abilities.wis) + proficiencyBonus}`])],
    languages: base?.languages?.length ? base.languages : resolvedTheme === CreatureTheme.COSMIC ? ['compreende todos os idiomas, telepatia 36 m'] : ['—'],
    challengeRating: cr,
    challengeLabel: challengeLabel(cr),
    experiencePoints: xpForCr(cr),
    proficiencyBonus,
    traits,
    actions,
    bonusActions,
    reactions,
    legendaryActions,
    description: resolvedTheme === CreatureTheme.COSMIC ? cosmicDescription : `${name} é uma criatura original do Atlas das Cinzas, ${descriptor}. Seu comportamento é moldado pelo terreno e pela influência sobrenatural da região.`,
    narration: resolvedTheme === CreatureTheme.COSMIC ? cosmicNarration : resolvedTheme === CreatureTheme.INFECTED ? infectedNarration : standardNarration,
    signs: resolvedTheme === CreatureTheme.COSMIC
      ? [mutationProfile.sign, ...pickMany(['sombras apontando para direções diferentes', 'objetos vibrando sem vento', 'lembranças breves que não pertencem aos personagens', 'animais nascendo com marcas simétricas', 'ecos respondendo antes do som', 'trilhas que terminam em superfícies verticais', 'água formando círculos sem impacto', 'sonhos idênticos entre pessoas distantes', 'a Estrela Negra parece pulsar quando a criatura se aproxima', 'a luz solar perde calor em um círculo ao redor dos rastros', 'cinzas formam a figura de um eclipse'], 4, next)]
      : resolvedTheme === CreatureTheme.INFECTED
        ? ['odor adocicado de decomposição', 'pelos, penas ou pele com cristais negros', 'animais menores fugindo em silêncio']
        : ['rastros recentes', 'restos de alimento', 'marcas de território'],
    behavior: resolvedTheme === CreatureTheme.COSMIC
      ? `${archetypeLabel(archetype)} · ${temperamentProfile.label}: ${temperamentProfile.behavior}. Em combate, ${archetype === 'STALKER' ? 'observa, separa e ataca apenas quando a rota de fuga está comprometida' : archetype === 'BRUTE' ? 'avança sobre a maior concentração de criaturas e tenta quebrar formações' : archetype === 'CONTROLLER' ? 'evita confronto direto e reorganiza o campo até isolar um alvo' : archetype === 'ARTILLERY' ? 'mantém distância, usa elevação e troca de posição' : archetype === 'SWARM' ? 'ocupa espaços, cerca saídas e transforma o ambiente em extensão do corpo' : 'testa o grupo em etapas e revela poderes mais perigosos quando pressionada'}. Objetivo: ${temperamentProfile.motive}.`
      : resolvedTheme === CreatureTheme.INFECTED ? 'Ataca por impulsos e protege focos de contaminação.' : 'Age como predador territorial e evita riscos desnecessários.',
    tactics: resolvedTheme === CreatureTheme.COSMIC
      ? `Usa ${originConcepts[origin].power}, escolhe alvos que falharam em testes mentais e explora ${archetype === 'ARTILLERY' ? 'linhas longas de visão' : archetype === 'CONTROLLER' ? 'passagens estreitas e posições elevadas' : archetype === 'STALKER' ? 'escuridão e separação' : 'terreno difícil e medo'}. Objetivo: ${temperamentProfile.motive}.`
      : resolvedTheme === CreatureTheme.INFECTED ? 'Avança sem recuar, espalha condições e prende alvos.' : 'Embosca, busca terreno favorável e foge quando gravemente ferida.',
    weakness: resolvedTheme === CreatureTheme.COSMIC ? originConcepts[origin].weakness : resolvedTheme === CreatureTheme.INFECTED ? 'Dano radiante, fogo controlado ou remoção do foco de contaminação.' : 'Pode ser distraída por alimento, território ou ameaça maior.',
    rewards: resolvedTheme === CreatureTheme.COSMIC
      ? [`núcleo da ${originConcepts[origin].label.toLowerCase()}`, 'tecido ou mineral impossível usado como componente raro', 'memória preservada de uma vítima', 'pista sobre um ponto de contenção']
      : ['componentes incomuns', 'pista sobre a origem da criatura', 'materiais úteis para a fortaleza'],
    license: 'Conteúdo original do Atlas das Cinzas.',
    appearanceProfile,
    originStory: resolvedTheme === CreatureTheme.COSMIC ? originConcepts[origin].concept : undefined,
    cosmicConcept: resolvedTheme === CreatureTheme.COSMIC ? `${originConcepts[origin].label} · ${archetypeLabel(archetype)} · ${mutationProfile.label} · ${temperamentProfile.label}` : undefined,
    cosmicMutation: resolvedTheme === CreatureTheme.COSMIC ? mutation : undefined,
    cosmicTemperament: resolvedTheme === CreatureTheme.COSMIC ? temperament : undefined,
    portalConnection: resolvedTheme === CreatureTheme.COSMIC ? `A criatura atravessou ou foi formada pela rede ligada à Estrela Negra. Seu impulso dominante é ${temperamentProfile.motive}.` : undefined,
    combatPhases: phases
  };
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
