export interface CampaignRegion {
  id: string;
  name: string;
  epithet: string;
  theme: string;
  publicDescription: string;
  secret: string;
  dominantFaction: string;
  signatureCreature: string;
  rareResource: string;
  centralMystery: string;
  blackStarManifestation: string;
  solarDecaySign: string;
}

export interface CampaignBible {
  schemaVersion: 1;
  title: string;
  subtitle: string;
  publicPremise: string;
  openingNarration: string;
  tone: string[];
  themes: string[];
  playerKnowledge: string[];
  centralQuestion: string;
  blackStar: {
    publicDescription: string;
    commonNames: string[];
    signs: string[];
    falseBeliefs: string[];
    secretNature: string;
  };
  catastrophe: {
    name: string;
    wizardName: string;
    wizardTitle: string;
    experimentName: string;
    siteName: string;
    intention: string;
    failure: string;
    immediateConsequences: string[];
    survivingEvidence: string[];
  };
  portal: {
    name: string;
    publicLore: string;
    secretMechanism: string;
    anchors: Array<{
      name: string;
      purpose: string;
      currentState: string;
      clue: string;
    }>;
    closingRequirements: string[];
    closingRisks: string[];
  };
  sunEater: {
    name: string;
    epithets: string[];
    publicSigns: string[];
    truth: string;
    impossibleBattle: string;
    stages: Array<{
      stage: number;
      name: string;
      visibleEffect: string;
      worldEffect: string;
    }>;
  };
  factions: Array<{
    name: string;
    publicGoal: string;
    secretGoal: string;
    method: string;
    relationToPortal: string;
  }>;
  relics: Array<{
    name: string;
    appearance: string;
    publicLegend: string;
    truePurpose: string;
    cost: string;
  }>;
  worldTruths: string[];
  campaignActs: Array<{
    act: number;
    title: string;
    objective: string;
    revelations: string[];
    failurePressure: string;
  }>;
  masterTimeline: Array<{
    era: string;
    event: string;
  }>;
  regions: CampaignRegion[];
  narrativeDirection: {
    horror: number;
    survival: number;
    ruins: number;
    politics: number;
    mutation: number;
    magicRarity: number;
    guidance: string[];
  };
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

const wizardFirstNames = ['Serath', 'Edran', 'Malver', 'Orien', 'Vhalem', 'Aster', 'Nemer', 'Kaelor'];
const wizardSurnames = ['Vhal', 'Arkhad', 'Morn', 'Selvar', 'Nareth', 'Dorran', 'Velkan', 'Ilyr'];
const experimentNames = ['Coroa do Meio-Dia', 'Prisma Heliotrópico', 'Convergência de Arkhad', 'Motor da Aurora', 'Lente do Primeiro Fogo'];
const sites = ['Observatório de Arkhad', 'Torre do Meridiano', 'Cidadela do Meio-Dia', 'Mosteiro Solar de Veyra', 'Agulha de Halver'];

const regionTemplates: Omit<CampaignRegion, 'id'>[] = [
  {
    name: 'Campos da Vela Morta',
    epithet: 'Onde o dia perdeu a cor',
    theme: 'planícies de cinza, fortalezas rurais e sombras longas',
    publicDescription: 'Campos pálidos cercam estradas antigas e povoados que medem as horas pela temperatura, pois o brilho do sol já não é confiável.',
    secret: 'Sob os campos passam linhas de cobre do experimento original; elas ainda conduzem energia para o portal.',
    dominantFaction: 'Vigília da Última Chama',
    signatureCreature: 'Cavaleiros do Contraluz',
    rareResource: 'sal de aurora',
    centralMystery: 'As sombras de certas pedras apontam para o observatório, mesmo à noite.',
    blackStarManifestation: 'A Estrela Negra parece maior quando observada sobre plantações abandonadas.',
    solarDecaySign: 'As colheitas germinam, mas suas folhas não conseguem se orientar para o sol.'
  },
  {
    name: 'Bosque dos Sinos Afogados',
    epithet: 'A floresta que recorda nomes',
    theme: 'árvores inundadas, memória vegetal e aldeias suspensas',
    publicDescription: 'Troncos brancos crescem sobre água escura. Sinos antigos tocam sob as raízes quando alguma criatura atravessa o portal.',
    secret: 'As raízes absorveram lembranças dos magos mortos no experimento e podem reconstruir partes do ritual.',
    dominantFaction: 'Barqueiros da Última Vigília',
    signatureCreature: 'Coro de Madeira Oca',
    rareResource: 'âmbar de memória',
    centralMystery: 'Pessoas desaparecidas continuam conversando por meio das árvores.',
    blackStarManifestation: 'Seu reflexo aparece entre as copas mesmo quando nuvens cobrem o céu.',
    solarDecaySign: 'As manhãs chegam com uma névoa fria que permanece até a Tarde.'
  },
  {
    name: 'Picos do Sol Ferido',
    epithet: 'As montanhas que observam o céu morrer',
    theme: 'observatórios quebrados, gelo negro e mosteiros solares',
    publicDescription: 'Os picos guardam instrumentos usados para estudar o sol. Muitos ainda se movem sozinhos e seguem algo invisível além da Estrela Negra.',
    secret: 'Uma das âncoras do portal está presa ao maior observatório e mantém uma via direta até o Devorador de Sóis.',
    dominantFaction: 'Ordem do Disco Partido',
    signatureCreature: 'Astrônomos Congelados',
    rareResource: 'vidro heliacal',
    centralMystery: 'Toda luneta aponta para o mesmo ponto vazio ao lado do sol.',
    blackStarManifestation: 'Ela projeta um halo de ângulos retos sobre a neve.',
    solarDecaySign: 'O gelo se forma durante o Meio-Dia e derrete durante a Noite.'
  },
  {
    name: 'Brejo dos Rostos Repetidos',
    epithet: 'Onde os mortos tentam voltar',
    theme: 'pântanos, cópias imperfeitas e memórias encarnadas',
    publicDescription: 'Águas mornas devolvem reflexos que não pertencem a quem olha. Viajantes encontram pessoas conhecidas que morreram em outros lugares.',
    secret: 'O portal usa memórias humanas como modelos incompletos para criar corpos capazes de atravessar.',
    dominantFaction: 'Coletores de Nomes',
    signatureCreature: 'Duplicatas do Lodo',
    rareResource: 'limo de lembrança',
    centralMystery: 'Algumas cópias conhecem acontecimentos que ainda não ocorreram.',
    blackStarManifestation: 'Seu reflexo multiplica-se em cada poça, sempre com posições diferentes.',
    solarDecaySign: 'A luz solar não produz reflexos completos na água.'
  },
  {
    name: 'Cicatriz de Arkhad',
    epithet: 'O coração quebrado do experimento',
    theme: 'ruínas arcanas, geometrias impossíveis e radiação cósmica',
    publicDescription: 'A região ao redor do antigo observatório foi dobrada pelo fracasso do ritual. Estradas retornam ao ponto de partida e edifícios ocupam mais espaço por dentro.',
    secret: 'O portal principal continua aberto sob o observatório, alimentado pelas âncoras espalhadas pelo mundo.',
    dominantFaction: 'Herdeiros de Arkhad',
    signatureCreature: 'Geômetras de Carne',
    rareResource: 'cristal de horizonte',
    centralMystery: 'O laboratório central aparece em locais diferentes conforme a posição do sol.',
    blackStarManifestation: 'Aqui ela parece uma abertura física, cercada por um anel de fogo escuro.',
    solarDecaySign: 'Cada dia possui alguns segundos a menos de luz, mesmo quando o relógio não muda.'
  },
  {
    name: 'Ermo do Meio-Dia Vazio',
    epithet: 'A terra onde a claridade não aquece',
    theme: 'deserto de vidro, caravanas perdidas e tempestades solares frias',
    publicDescription: 'Planícies vitrificadas refletem um sol pálido. Durante tempestades, sombras atravessam o chão antes que as criaturas correspondentes surjam.',
    secret: 'O vidro conserva o instante da abertura do portal e pode ser usado para reconstruir ou inverter o experimento.',
    dominantFaction: 'Caravana do Horizonte Partido',
    signatureCreature: 'Predadores de Sombra Adiantada',
    rareResource: 'vidro do primeiro clarão',
    centralMystery: 'Algumas crateras mostram o céu do dia da catástrofe.',
    blackStarManifestation: 'Ela deixa um segundo horizonte escuro sobre o primeiro.',
    solarDecaySign: 'A luz é intensa, mas não aquece pele, pedra ou metal.'
  },
  {
    name: 'Águas sem Reflexo',
    epithet: 'O lago que esqueceu o céu',
    theme: 'cidades submersas, cultos marítimos e distâncias falsas',
    publicDescription: 'Um conjunto de lagos e canais cobre antigas cidades. Em certas noites, barcos chegam de lugares que não existem nos mapas.',
    secret: 'As águas funcionam como espelhos de trânsito para criaturas pequenas e fragmentos de consciência do outro lado.',
    dominantFaction: 'Navegantes do Fundo Claro',
    signatureCreature: 'Barqueiros Sem Sombra',
    rareResource: 'pérola do céu ausente',
    centralMystery: 'Uma cidade intacta continua iluminada sob a água, mas ninguém alcança suas ruas.',
    blackStarManifestation: 'Não aparece refletida; em seu lugar há uma profundidade impossível.',
    solarDecaySign: 'Peixes sobem à superfície durante o dia como se procurassem luz suficiente.'
  },
  {
    name: 'Mata da Carne Branca',
    epithet: 'A fronteira viva do outro mundo',
    theme: 'floresta mutante, anatomia vegetal e colônias infectadas',
    publicDescription: 'Árvores de casca clara crescem em padrões semelhantes a nervos. Animais e pessoas sofrem alterações depois de permanecer tempo demais.',
    secret: 'Não é uma floresta contaminada: é um órgão incompleto que tenta adaptar o mundo à chegada de criaturas maiores.',
    dominantFaction: 'Jardineiros da Forma Nova',
    signatureCreature: 'Santos Incompletos',
    rareResource: 'seiva de carne estelar',
    centralMystery: 'A mata cresce na direção oposta ao sol e na direção exata do portal.',
    blackStarManifestation: 'Pupilas surgem na casca e se voltam para ela ao Anoitecer.',
    solarDecaySign: 'As plantas sobrevivem cada vez melhor sem luz solar.'
  }
];

export function generateCampaignBible(seed: string): CampaignBible {
  const next = random(`${seed}:campaign-bible-v1`);
  const wizardName = `${pick(wizardFirstNames, next)} ${pick(wizardSurnames, next)}`;
  const experimentName = pick(experimentNames, next);
  const siteName = pick(sites, next);
  const portalName = pick(['A Ferida do Meio-Dia', 'O Limiar Negro', 'A Porta Heliotrópica', 'O Rasgo de Arkhad'], next);
  const sunEaterName = pick(['Vorath, o Devorador de Sóis', 'Nhal-Azur, a Fome do Meio-Dia', 'A Boca Além da Estrela', 'O Rei que Bebe a Aurora'], next);
  const rotation = Math.floor(next() * regionTemplates.length);
  const regions = [...regionTemplates.slice(rotation), ...regionTemplates.slice(0, rotation)].map((region, index) => ({
    ...region,
    id: `region-${index + 1}`
  }));

  return {
    schemaVersion: 1,
    title: 'As Cinzas Sob a Estrela Negra',
    subtitle: 'Uma campanha sobre um mundo que perde o sol e uma porta que jamais deveria ter sido aberta',
    publicPremise: `Anos atrás, o arquimago ${wizardName} conduziu ${experimentName} em ${siteName}. Ele prometia extrair energia diretamente do sol e encerrar séculos de fome, guerra e inverno. O experimento falhou. Uma estrela negra apareceu no céu, criaturas impossíveis começaram a atravessar para o mundo e o brilho do sol passou a diminuir. Hoje, ninguém sabe quanto tempo resta antes que a luz desapareça por completo.`,
    openingNarration: `O sol ainda nasce, mas já não parece inteiro. Uma mancha negra permanece próxima dele, pequena em alguns dias, enorme em outros, como um olho que não fecha. As sombras são mais longas, as manhãs mais frias e os animais observam o céu antes de fugir. Estradas antigas estão cheias de refugiados, cultos e criaturas que não pertencem a este mundo. Em algum lugar sob as ruínas de ${siteName}, a porta continua aberta. Enquanto ela permanecer assim, algo do outro lado continuará bebendo a luz do mundo.`,
    tone: ['fantasia sombria', 'horror cósmico', 'sobrevivência', 'mistério de ruínas', 'esperança difícil, mas possível'],
    themes: ['conhecimento sem responsabilidade', 'o preço de salvar o mundo', 'memória e identidade', 'luz como recurso finito', 'escolhas locais ligadas a uma ameaça incompreensível'],
    playerKnowledge: [
      `O experimento de ${wizardName} criou a Estrela Negra.`,
      'Desde então, monstros surgem em lugares onde a realidade se torna instável.',
      'O sol está enfraquecendo lentamente e os invernos tornam-se mais longos.',
      `As ruínas de ${siteName} são consideradas o centro da catástrofe.`,
      'Há facções que desejam fechar a porta, controlá-la ou permitir que ela se abra completamente.'
    ],
    centralQuestion: 'O grupo conseguirá reunir conhecimento, aliados e componentes para fechar o portal antes que o último fragmento do sol seja consumido?',
    blackStar: {
      publicDescription: 'Uma esfera escura próxima ao sol, cercada por um halo irregular. Às vezes permanece imóvel; em outras ocasiões muda de posição entre um piscar e outro.',
      commonNames: ['Estrela Negra', 'Sol Morto', 'Olho do Meio-Dia', 'Marca de Arkhad'],
      signs: [
        'sombras apontam para ela durante alguns segundos',
        'animais interrompem seus chamados quando ela fica visível',
        'espelhos mostram um halo maior que o observado no céu',
        'pessoas expostas por muito tempo compartilham o mesmo sonho',
        'magias de adivinhação retornam imagens do observador visto por trás'
      ],
      falseBeliefs: [
        'A Estrela Negra é um segundo astro que colidiu com o sol.',
        'Ela é um deus castigando o mundo por antigas guerras.',
        'Destruir o observatório fará a estrela desaparecer imediatamente.',
        'As criaturas que atravessam são servas obedientes de uma única entidade.'
      ],
      secretNature: 'A Estrela Negra não é uma estrela. É a cicatriz visual de um portal multidimensional alinhado com o sol. Ela existe simultaneamente no céu e sob o observatório. Olhar diretamente para ela é observar uma distância que não cabe no mundo.'
    },
    catastrophe: {
      name: 'A Noite do Meio-Dia Partido',
      wizardName,
      wizardTitle: 'Arquimago do Círculo Heliacal',
      experimentName,
      siteName,
      intention: 'Criar uma fonte infinita de energia solar, capaz de sustentar cidades, curar terras devastadas e eliminar a dependência de combustíveis e sacrifícios arcanos.',
      failure: `${wizardName} usou mapas celestes incompletos e um fragmento encontrado fora do mundo. O ritual não alcançou o núcleo do sol: alinhou o laboratório com uma região além da realidade onde uma presença colossal percebeu a abertura.`,
      immediateConsequences: [
        'O céu escureceu ao Meio-Dia e a Estrela Negra surgiu.',
        'Partes do observatório passaram a existir em vários lugares ao mesmo tempo.',
        'Criaturas menores atravessaram primeiro, algumas por acidente e outras atraídas por memória, calor e medo.',
        'A onda do ritual contaminou rios, florestas, animais e sonhos humanos.',
        'Os sobreviventes esconderam peças do mecanismo para impedir uma segunda tentativa.'
      ],
      survivingEvidence: [
        'diários com páginas que mudam conforme a luz',
        'diagramas divididos entre observatórios regionais',
        'âncoras de bronze gravadas com nomes de estrelas inexistentes',
        'gravações de voz do arquimago pedindo que o ritual fosse interrompido',
        'um mapa mostrando que o portal pode ser fechado apenas pelo mesmo lado em que foi aberto'
      ]
    },
    portal: {
      name: portalName,
      publicLore: `Acredita-se que ${portalName} esteja sob ${siteName}. Ruínas e criaturas em regiões distantes apresentam símbolos ligados ao mesmo mecanismo.`,
      secretMechanism: 'O portal é mantido por uma rede de âncoras que estabiliza o alinhamento entre o observatório, a Estrela Negra e o sol. Destruir uma âncora de forma errada amplia a ruptura. As âncoras precisam ser restauradas, invertidas e sincronizadas durante um curto período de alinhamento.',
      anchors: [
        { name: 'Âncora da Forma', purpose: 'Define o que pode atravessar fisicamente.', currentState: 'Fragmentada e incorporada à Mata da Carne Branca.', clue: 'Criaturas alteradas carregam o mesmo padrão geométrico nos ossos.' },
        { name: 'Âncora da Memória', purpose: 'Permite que consciência e lembranças sobrevivam à travessia.', currentState: 'Afundada no Bosque dos Sinos Afogados.', clue: 'Árvores repetem trechos do ritual com vozes dos magos mortos.' },
        { name: 'Âncora da Distância', purpose: 'Mantém o observatório alinhado com o outro lado.', currentState: 'Ativa nos Picos do Sol Ferido.', clue: 'Instrumentos astronômicos acompanham uma posição ao lado do sol.' },
        { name: 'Âncora do Instante', purpose: 'Mantém a porta presa ao momento em que foi aberta.', currentState: 'Preservada no vidro do Ermo do Meio-Dia Vazio.', clue: 'Crateras repetem alguns segundos da catástrofe.' },
        { name: 'Âncora da Luz', purpose: 'Utiliza o sol como fonte e referência.', currentState: 'Oculta em um santuário da Ordem do Disco Partido.', clue: 'A luz ao redor dela ainda aquece, ao contrário do restante do mundo.' }
      ],
      closingRequirements: [
        'Localizar e compreender as cinco âncoras.',
        'Recuperar os diagramas originais do experimento.',
        'Descobrir qual erro de cálculo transformou captação de energia em alinhamento planar.',
        'Inverter as âncoras sem rompê-las.',
        'Chegar ao núcleo do observatório durante o alinhamento da Estrela Negra.',
        'Escolher uma fonte de energia ou sacrifício capaz de sustentar o fechamento.',
        'Concluir o ritual enquanto criaturas atravessam em massa para impedir a perda da passagem.'
      ],
      closingRisks: [
        'Fechar o portal pode prender pessoas ou lugares parcialmente deslocados.',
        'A energia acumulada pode destruir a região central.',
        'Uma âncora corrompida pode exigir que alguém assuma sua função temporariamente.',
        'O Devorador de Sóis perceberá a tentativa e pressionará o portal sem atravessá-lo por completo.'
      ]
    },
    sunEater: {
      name: sunEaterName,
      epithets: ['Devorador de Sóis', 'A Fome Além do Céu', 'A Boca do Último Dia', 'Aquele que Não Pode Entrar'],
      publicSigns: [
        'o disco solar parece menor em algumas manhãs',
        'a luz perde calor antes de perder brilho',
        'eclipses curtos ocorrem sem movimento da lua',
        'plantas voltam-se para a Estrela Negra em vez do sol',
        'magos sentem uma pulsação distante em feitiços ligados a fogo e luz'
      ],
      truth: `${sunEaterName} é uma entidade maior que continentes, existente fora das dimensões conhecidas. Ela não consegue atravessar o portal inteiro, mas alcança o sol através do alinhamento criado pelo experimento e consome sua energia pouco a pouco.`,
      impossibleBattle: 'Não existe ficha de combate para o Devorador de Sóis. Enfrentá-lo diretamente é impossível. Mesmo avatares parciais são eventos de cenário, não uma criatura derrotável. A vitória da campanha é fechar o portal, interromper o alinhamento e sobreviver às manifestações que tentam protegê-lo.',
      stages: [
        { stage: 1, name: 'Luz Ferida', visibleEffect: 'A Estrela Negra torna-se visível em dias claros.', worldEffect: 'Colheitas enfraquecem e criaturas menores atravessam em pontos instáveis.' },
        { stage: 2, name: 'Dias Frios', visibleEffect: 'A luz ainda existe, mas aquece menos.', worldEffect: 'Invernos alongam-se, migrações começam e cultos solares crescem.' },
        { stage: 3, name: 'Meio-Dia Pálido', visibleEffect: 'O sol perde cor e o céu assume tons de cinza.', worldEffect: 'Florestas mudam, mortos sonham e criaturas maiores encontram passagem.' },
        { stage: 4, name: 'Eclipses da Fome', visibleEffect: 'Eclipses curtos ocorrem várias vezes por dia.', worldEffect: 'A realidade falha em regiões inteiras e cidades disputam fontes de calor.' },
        { stage: 5, name: 'Última Aurora', visibleEffect: 'O amanhecer dura minutos e a noite ocupa quase todo o dia.', worldEffect: 'O mundo entra em colapso; fechar o portal torna-se a única ação relevante.' }
      ]
    },
    factions: [
      { name: 'Vigília da Última Chama', publicGoal: 'Proteger assentamentos e preservar fontes de calor.', secretGoal: 'Controlar a Âncora da Luz e decidir quem terá acesso ao sol restaurado.', method: 'fortificações, comboios e juramentos de proteção', relationToPortal: 'Deseja fechá-lo, mas teme perder sua posição política.' },
      { name: 'Herdeiros de Arkhad', publicGoal: 'Reunir conhecimento para corrigir o experimento.', secretGoal: 'Reabrir o portal de forma controlada e concluir o sonho do arquimago.', method: 'arqueologia, espionagem e experimentos proibidos', relationToPortal: 'Acredita que a porta pode ser dominada.' },
      { name: 'Ordem do Disco Partido', publicGoal: 'Interpretar o enfraquecimento do sol como revelação religiosa.', secretGoal: 'Acelerar a Última Aurora para provocar uma renovação do mundo.', method: 'peregrinações, profecias e sabotagem de âncoras', relationToPortal: 'Considera o fechamento uma blasfêmia.' },
      { name: 'Coletores de Nomes', publicGoal: 'Resgatar pessoas copiadas ou perdidas nas regiões afetadas.', secretGoal: 'Criar corpos perfeitos para consciências preservadas.', method: 'trocas de memória, rituais e captura de duplicatas', relationToPortal: 'Precisa da Âncora da Memória ativa.' },
      { name: 'Jardineiros da Forma Nova', publicGoal: 'Adaptar seres vivos ao mundo sem sol.', secretGoal: 'Transformar o mundo em ambiente compatível com entidades externas.', method: 'mutação dirigida, cultivo de organismos e seitas', relationToPortal: 'Deseja ampliá-lo gradualmente.' },
      { name: 'Caravana do Horizonte Partido', publicGoal: 'Transportar pessoas e recursos entre regiões isoladas.', secretGoal: 'Encontrar uma rota para outro mundo habitável.', method: 'comércio, mapas e alianças temporárias', relationToPortal: 'Pode ajudar a fechar a porta ou tentar atravessá-la.' }
    ],
    relics: [
      { name: 'Prisma do Primeiro Fogo', appearance: 'Um cristal dourado que projeta uma aurora dentro de qualquer sombra.', publicLegend: 'Dizem que contém uma centelha do sol anterior à catástrofe.', truePurpose: 'Calibra a Âncora da Luz e revela sua orientação correta.', cost: 'Cada uso apaga uma lembrança ligada a calor ou conforto.' },
      { name: 'Mapa das Distâncias Mortas', appearance: 'Folhas metálicas que mudam de desenho quando dobradas.', publicLegend: 'Mostra caminhos que não existem.', truePurpose: 'Localiza pontos onde a Âncora da Distância toca o mundo.', cost: 'O portador perde temporariamente a noção de perto e longe.' },
      { name: 'Sino da Memória Inteira', appearance: 'Um sino pequeno sem badalo que toca dentro da cabeça.', publicLegend: 'Faz mortos responderem uma pergunta.', truePurpose: 'Reúne fragmentos da gravação original do ritual.', cost: 'Atrai cópias de quem escuta.' },
      { name: 'Lente do Último Meio-Dia', appearance: 'Um disco escuro que só fica transparente diante da Estrela Negra.', publicLegend: 'Permite olhar o sol sem cegueira.', truePurpose: 'Mostra o Devorador de Sóis e os fios de energia que o ligam ao portal.', cost: 'O observador é percebido pela entidade.' },
      { name: 'Coração de Bronze de Arkhad', appearance: 'Um mecanismo pulsante com cinco cavidades.', publicLegend: 'Era o núcleo do observatório.', truePurpose: 'Sincroniza as cinco âncoras durante o fechamento.', cost: 'Precisa ser alimentado por magia, vida ou uma fonte solar equivalente.' },
      { name: 'Cinza do Arquimago', appearance: 'Pó negro preservado em uma ampola de vidro branco.', publicLegend: `${wizardName} teria morrido no experimento.`, truePurpose: 'Contém parte da consciência do arquimago e a última correção do ritual.', cost: 'A consciência pode tentar assumir o corpo de quem a consulta.' }
    ],
    worldTruths: [
      'Nem todas as criaturas atravessam por vontade própria; muitas são vítimas do portal.',
      'Alguns humanos retornaram como cópias imperfeitas sem saber que morreram.',
      'A contaminação cósmica também cria novas formas de vida capazes de sobreviver sem sol.',
      'O portal não pode ser fechado simplesmente destruindo o observatório.',
      'O arquimago percebeu o erro e tentou interromper o experimento, mas seus assistentes seguiram o plano.',
      'Parte da consciência do arquimago permanece espalhada em instrumentos e gravações.',
      'O Devorador de Sóis não odeia o mundo; ele mal percebe que vidas existem aqui.',
      'Cada uso das âncoras aproxima o grupo da solução e chama atenção de manifestações mais perigosas.',
      'Fechar o portal salvará o sol, mas não removerá imediatamente todas as criaturas e mutações.',
      'O final da campanha exige decidir o que fazer com o conhecimento que tornou a catástrofe possível.'
    ],
    campaignActs: [
      { act: 1, title: 'Sob a Luz Ferida', objective: 'Sobreviver, conhecer as primeiras regiões e perceber que eventos locais compartilham símbolos.', revelations: ['A Estrela Negra está ligada ao experimento.', 'Criaturas atravessam por pontos conectados.', 'O sol está realmente diminuindo.'], failurePressure: 'O mundo torna-se mais frio e rotas seguras começam a falhar.' },
      { act: 2, title: 'As Cinco Âncoras', objective: 'Descobrir a rede que mantém o portal aberto.', revelations: ['Cada região guarda uma função do mecanismo.', 'Destruir âncoras pode piorar a ruptura.', 'Facções desejam resultados incompatíveis.'], failurePressure: 'Uma facção conquista ou corrompe uma âncora.' },
      { act: 3, title: 'O Nome da Fome', objective: 'Compreender o Devorador de Sóis e abandonar a ideia de vencê-lo em combate.', revelations: ['A entidade consome o sol através do alinhamento.', 'Ela não pode atravessar inteira.', 'Avatares existem para proteger a conexão.'], failurePressure: 'Eclipses tornam-se frequentes e criaturas de ND maior atravessam.' },
      { act: 4, title: 'Reconstruir o Erro', objective: 'Reunir relíquias, diagramas e aliados para inverter o ritual.', revelations: ['O arquimago tentou corrigir o cálculo.', 'O fechamento exige custo real.', 'Uma facção tentará tomar o mecanismo no último momento.'], failurePressure: 'Uma âncora entra em colapso e exige solução alternativa.' },
      { act: 5, title: 'A Última Aurora', objective: 'Entrar em Arkhad, suportar a pressão do outro lado e fechar o portal.', revelations: ['A Estrela Negra é a própria abertura.', 'O Devorador percebe o grupo.', 'O mundo pode sobreviver, mas não voltar exatamente ao que era.'], failurePressure: 'A luz solar aproxima-se do estágio final.' }
    ],
    masterTimeline: [
      { era: 'Séculos antes', event: 'Astrônomos encontram padrões impossíveis próximos ao sol e escondem registros em observatórios regionais.' },
      { era: 'Quarenta anos antes', event: `${wizardName} reúne o Círculo Heliacal e inicia pesquisas para obter energia solar ilimitada.` },
      { era: 'A Noite do Meio-Dia Partido', event: `${experimentName} abre ${portalName}; a Estrela Negra surge e as primeiras criaturas atravessam.` },
      { era: 'Primeiros anos', event: 'Reinos entram em colapso, facções surgem e peças do mecanismo são escondidas.' },
      { era: 'Tempo atual', event: 'O sol enfraquece de modo perceptível. O mundo ainda funciona, mas cada estação é pior que a anterior.' }
    ],
    regions,
    narrativeDirection: {
      horror: 90,
      survival: 75,
      ruins: 90,
      politics: 55,
      mutation: 75,
      magicRarity: 45,
      guidance: [
        'Apresente primeiro sinais e consequências; revele criaturas depois.',
        'Toda região deve conter ao menos uma pista útil para fechar o portal.',
        'O Devorador de Sóis nunca deve ser apresentado como inimigo derrotável.',
        'Facções e NPCs devem possuir razões compreensíveis mesmo quando suas decisões são perigosas.',
        'Falhas devem criar custos, mudanças e novas pistas, nunca encerrar a investigação.',
        'O horror deve crescer pelo entendimento, não apenas por violência.'
      ]
    }
  };
}

export function resolveCampaignRegion(bible: CampaignBible, seed: string, q: number, r: number): CampaignRegion {
  if (q === 0 && r === 0) return bible.regions[0];
  const x = q + r / 2;
  const y = r * Math.sqrt(3) / 2;
  const angle = Math.atan2(y, x) + Math.PI;
  const seedRotation = (hashString(`${seed}:region-rotation`) % 6283) / 1000;
  const normalized = (angle + seedRotation) % (Math.PI * 2);
  const index = Math.floor((normalized / (Math.PI * 2)) * bible.regions.length) % bible.regions.length;
  return bible.regions[index];
}

export function redactCampaignBibleForPlayer(bible: CampaignBible) {
  return {
    schemaVersion: bible.schemaVersion,
    title: bible.title,
    subtitle: bible.subtitle,
    publicPremise: bible.publicPremise,
    openingNarration: bible.openingNarration,
    tone: bible.tone,
    themes: bible.themes,
    playerKnowledge: bible.playerKnowledge,
    centralQuestion: bible.centralQuestion,
    blackStar: {
      publicDescription: bible.blackStar.publicDescription,
      commonNames: bible.blackStar.commonNames,
      signs: bible.blackStar.signs
    },
    catastrophe: {
      name: bible.catastrophe.name,
      wizardName: bible.catastrophe.wizardName,
      wizardTitle: bible.catastrophe.wizardTitle,
      experimentName: bible.catastrophe.experimentName,
      siteName: bible.catastrophe.siteName,
      intention: bible.catastrophe.intention,
      immediateConsequences: bible.catastrophe.immediateConsequences
    },
    portal: {
      name: bible.portal.name,
      publicLore: bible.portal.publicLore
    },
    sunEater: {
      name: bible.sunEater.name,
      epithets: bible.sunEater.epithets,
      publicSigns: bible.sunEater.publicSigns,
      stages: bible.sunEater.stages
    },
    factions: bible.factions.map(({ name, publicGoal, method }) => ({ name, publicGoal, method })),
    relics: bible.relics.map(({ name, appearance, publicLegend }) => ({ name, appearance, publicLegend })),
    campaignActs: bible.campaignActs.map(({ act, title, objective }) => ({ act, title, objective })),
    regions: bible.regions.map(({ id, name, epithet, theme, publicDescription, dominantFaction, signatureCreature, rareResource, centralMystery, blackStarManifestation, solarDecaySign }) => ({
      id,
      name,
      epithet,
      theme,
      publicDescription,
      dominantFaction,
      signatureCreature,
      rareResource,
      centralMystery,
      blackStarManifestation,
      solarDecaySign
    }))
  };
}
