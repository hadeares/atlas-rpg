import {
  EncounterCategory,
  EncounterCombatPreference,
  EncounterContent,
  EncounterIntensity,
  EncounterLoreRelation
} from '../../database/entities/random-encounter.entity';
import { Hex } from '../../database/entities/hex.entity';
import { CreatureStatBlock } from '../../database/entities/creature-template.entity';
import { HexLore, HexLoreMonster, HexLoreNpc } from '../../hexes/generation/lore-generator';
import { GenerateEncounterDto } from '../dto/generate-encounter.dto';

export interface GeneratedEncounter {
  title: string;
  publicNarration: string;
  masterSummary: string;
  category: EncounterCategory;
  intensity: EncounterIntensity;
  combatPreference: EncounterCombatPreference;
  loreRelation: EncounterLoreRelation;
  content: EncounterContent;
}

const categoryLabels: Record<EncounterCategory, string> = {
  ALEATORIO: 'Aleatório',
  CRIATURA: 'Criatura',
  MONSTRO: 'Monstro',
  HORROR: 'Horror',
  SOCIAL: 'Social',
  VIAJANTE: 'Viajante',
  FACCAO: 'Facção',
  DESCOBERTA: 'Descoberta',
  VESTIGIO: 'Vestígio',
  PERIGO_NATURAL: 'Perigo natural',
  CLIMA: 'Clima',
  RECURSO: 'Recurso',
  RUINA: 'Ruína',
  RUMOR: 'Rumor',
  CONSEQUENCIA: 'Consequência'
};

const intensityLabels: Record<EncounterIntensity, string> = {
  QUALQUER: 'Qualquer',
  TRANQUILA: 'Tranquila',
  CURIOSA: 'Curiosa',
  PREOCUPANTE: 'Preocupante',
  PERIGOSA: 'Perigosa',
  MORTAL: 'Mortal'
};

const factionNames = [
  'Patrulha do Último Sol',
  'Companhia da Estrada Vermelha',
  'Peregrinos da Névoa',
  'Coletores da Pedra Sonhadora',
  'Cartógrafos das Sete Chaves',
  'Caçadores de Vela Cinzenta'
];

const genericTravelers = [
  'uma família empurrando uma carroça silenciosa',
  'dois caçadores carregando um terceiro companheiro ferido',
  'uma mensageira com o brasão arrancado do manto',
  'um mercador acompanhado por guardas excessivamente atentos',
  'um peregrino que afirma ter atravessado o mesmo lugar três vezes'
];

const naturalHazards = [
  'um deslizamento recente que expôs pedras gravadas',
  'uma faixa de solo instável escondida sob cinza fina',
  'uma árvore ou estrutura prestes a desabar sobre a rota',
  'um curso de água que subiu rapidamente e dividiu o caminho',
  'uma névoa fria que reduz a orientação a poucos passos'
];

const weatherEscalations = [
  'o vento muda de direção em intervalos regulares e traz cinza cortante',
  'uma chuva escura começa sem nuvens visíveis',
  'a temperatura cai rapidamente e superfícies metálicas vibram',
  'uma neblina espessa surge do chão em vez de descer do céu',
  'trovoadas distantes repetem o mesmo padrão de três batidas'
];

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
    const index = Math.floor(next() * available.length) % available.length;
    selected.push(available.splice(index, 1)[0]);
  }
  return selected;
}

function formatEnum(value: string) {
  return value.toLowerCase().split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

function resolveCategory(requested: EncounterCategory | undefined, lore: HexLore, next: () => number): EncounterCategory {
  if (requested && requested !== EncounterCategory.ALEATORIO) return requested;
  const weighted: EncounterCategory[] = [
    EncounterCategory.VESTIGIO,
    EncounterCategory.DESCOBERTA,
    EncounterCategory.SOCIAL,
    EncounterCategory.CRIATURA,
    EncounterCategory.MONSTRO,
    EncounterCategory.RUMOR,
    EncounterCategory.PERIGO_NATURAL,
    EncounterCategory.RECURSO,
    EncounterCategory.HORROR,
    EncounterCategory.VIAJANTE,
    EncounterCategory.RUINA,
    EncounterCategory.CLIMA
  ];
  if ((lore.monsters ?? []).length > 0) weighted.push(EncounterCategory.MONSTRO, EncounterCategory.VESTIGIO);
  if ((lore.inhabitants ?? []).length > 0) weighted.push(EncounterCategory.SOCIAL, EncounterCategory.VIAJANTE);
  if (lore.horror) weighted.push(EncounterCategory.HORROR);
  return pick(weighted, next);
}

function resolveIntensity(requested: EncounterIntensity | undefined, hex: Hex, next: () => number): EncounterIntensity {
  if (requested && requested !== EncounterIntensity.QUALQUER) return requested;
  const danger = hex.dangerLevel;
  const roll = next();
  if (danger >= 8 && roll > 0.58) return EncounterIntensity.MORTAL;
  if (danger >= 6 && roll > 0.45) return EncounterIntensity.PERIGOSA;
  if (danger >= 4 && roll > 0.35) return EncounterIntensity.PREOCUPANTE;
  if (roll > 0.45) return EncounterIntensity.CURIOSA;
  return EncounterIntensity.TRANQUILA;
}

function resolveCombat(
  requested: EncounterCombatPreference | undefined,
  category: EncounterCategory,
  intensity: EncounterIntensity,
  next: () => number
): EncounterCombatPreference {
  if (requested && requested !== EncounterCombatPreference.QUALQUER) return requested;
  if ([EncounterCategory.RUMOR, EncounterCategory.RECURSO, EncounterCategory.DESCOBERTA, EncounterCategory.CLIMA].includes(category)) {
    return EncounterCombatPreference.SEM_COMBATE;
  }
  if (category === EncounterCategory.VESTIGIO) return EncounterCombatPreference.APENAS_SINAIS;
  if (category === EncounterCategory.MONSTRO && [EncounterIntensity.PERIGOSA, EncounterIntensity.MORTAL].includes(intensity)) {
    return EncounterCombatPreference.COMBATE_PROVAVEL;
  }
  return next() > 0.58 ? EncounterCombatPreference.COMBATE_POSSIVEL : EncounterCombatPreference.SEM_COMBATE;
}

function resolveRelation(requested: EncounterLoreRelation | undefined, category: EncounterCategory, next: () => number): EncounterLoreRelation {
  if (requested) return requested;
  if (category === EncounterCategory.RUMOR) return EncounterLoreRelation.RUMOR;
  if ([EncounterCategory.MONSTRO, EncounterCategory.CRIATURA, EncounterCategory.VESTIGIO].includes(category)) return EncounterLoreRelation.MONSTRO_LOCAL;
  if (category === EncounterCategory.HORROR) return EncounterLoreRelation.HORROR_LOCAL;
  if (category === EncounterCategory.FACCAO) return EncounterLoreRelation.FACCAO;
  return next() > 0.68 ? EncounterLoreRelation.NOVO_COMPATIVEL : EncounterLoreRelation.LORE_EXISTENTE;
}

function dangerAssessment(intensity: EncounterIntensity, partySize: number, averageLevel: number, hex: Hex) {
  const intensityScore: Record<EncounterIntensity, number> = {
    QUALQUER: 2,
    TRANQUILA: 0,
    CURIOSA: 1,
    PREOCUPANTE: 2,
    PERIGOSA: 4,
    MORTAL: 6
  };
  const groupStrength = averageLevel + Math.max(0, partySize - 4) * 0.6;
  const score = intensityScore[intensity] + hex.dangerLevel * 0.55 - groupStrength * 0.55;
  if (score <= -2) return 'Favorável: o grupo provavelmente controla a situação, mas ainda pode gastar tempo ou recursos.';
  if (score <= 0.5) return 'Equilibrado: decisões, terreno e preparação podem definir o resultado.';
  if (score <= 2.5) return 'Arriscado: o grupo deve observar sinais, negociar ou preparar uma rota de fuga.';
  if (score <= 4.5) return 'Mortal: confronto direto pode derrubar personagens e consumir recursos importantes.';
  return 'Provavelmente impossível nas condições atuais: apresente sinais claros e rotas de retirada.';
}

function checkDc(intensity: EncounterIntensity, hex: Hex, modifier = 0) {
  const base: Record<EncounterIntensity, number> = {
    QUALQUER: 12,
    TRANQUILA: 10,
    CURIOSA: 11,
    PREOCUPANTE: 13,
    PERIGOSA: 15,
    MORTAL: 17
  };
  return Math.min(20, base[intensity] + Math.floor(hex.dangerLevel / 4) + modifier);
}

function chooseMonster(lore: HexLore, next: () => number): HexLoreMonster {
  return pick(lore.monsters?.length ? lore.monsters : [{
    name: 'Predador sem nome',
    threat: 4,
    appearance: 'Uma silhueta irregular coberta por fragmentos do terreno.',
    signs: 'Silêncio súbito e rastros interrompidos.',
    behavior: 'Observa antes de atacar e busca alvos isolados.',
    motive: 'Defender seu território.',
    lair: 'Uma cavidade próxima ao marco.',
    tactics: 'Emboscada e retirada.',
    weakness: 'Luz forte e sons repetitivos.',
    reward: 'Componentes raros e objetos de vítimas.',
    suggestedStatBlock: 'Use uma criatura de ND compatível com o nível do grupo.'
  }], next);
}


function creatureToLoreMonster(creature: CreatureStatBlock): HexLoreMonster {
  return {
    name: creature.name,
    threat: Math.max(1, Math.min(10, Math.round(creature.challengeRating))),
    appearance: creature.description,
    signs: creature.signs.join(' '),
    behavior: creature.behavior,
    motive: creature.theme === 'COSMIC' ? 'Aproximar-se de fontes de memória e influência.' : creature.theme === 'INFECTED' ? 'Proteger e espalhar o foco de contaminação.' : 'Defender território, caçar ou sobreviver.',
    lair: 'Um local do hexágono coerente com sua ecologia e seus sinais.',
    tactics: creature.tactics,
    weakness: creature.weakness,
    reward: creature.rewards.join(', '),
    suggestedStatBlock: `ND ${creature.challengeLabel}; CA ${creature.armorClass}; PV ${creature.hitPoints}.`
  };
}
function chooseNpc(lore: HexLore, next: () => number): HexLoreNpc {
  return pick(lore.inhabitants?.length ? lore.inhabitants : [{
    name: 'Viajante sem brasão',
    role: 'sobrevivente perdido',
    appearance: 'Roupas gastas e equipamento cuidadosamente remendado.',
    manner: 'Fala baixo e observa constantemente a rota de onde veio.',
    desire: 'Encontrar uma estrada segura.',
    offer: 'Informações e parte dos suprimentos.',
    secret: 'Carrega um objeto retirado do marco local.'
  }], next);
}

export function generateEncounter(
  generationSeed: string,
  hex: Hex,
  lore: HexLore,
  dto: GenerateEncounterDto,
  creatureBlocks: CreatureStatBlock[] = []
): GeneratedEncounter {
  const next = random(generationSeed);
  const category = resolveCategory(dto.category, lore, next);
  const intensity = resolveIntensity(dto.intensity, hex, next);
  const combatPreference = resolveCombat(dto.combatPreference, category, intensity, next);
  const loreRelation = resolveRelation(dto.loreRelation, category, next);
  const partySize = dto.partySize ?? 4;
  const averageLevel = dto.averageLevel ?? 3;
  const creatureCategory = [EncounterCategory.MONSTRO, EncounterCategory.CRIATURA, EncounterCategory.HORROR, EncounterCategory.VESTIGIO].includes(category);
  const includedCreatures = creatureCategory ? creatureBlocks : [];
  const primaryCreature = includedCreatures[0];
  const monster = primaryCreature ? creatureToLoreMonster(primaryCreature) : chooseMonster(lore, next);
  const npc = chooseNpc(lore, next);
  const rumor = pick(lore.rumors ?? [{ text: 'Há algo escondido sob o marco.', source: 'um viajante', truth: 'Existe uma passagem oculta.' }], next);
  const feature = pick(lore.features ?? [], next) ?? {
    name: lore.landmark.name,
    playerDescription: lore.landmark.description,
    masterDetails: lore.masterGuide?.hiddenTruth ?? lore.secrets,
    interaction: 'Pode ser investigado.',
    suggestedCheck: 'Investigação CD 13.'
  };
  const resource = pick(lore.resources ?? [], next);
  const baseEncounter = pick(lore.encounters ?? [], next);
  const factionName = pick(factionNames, next);
  const dc = checkDc(intensity, hex);

  const commonSigns = pickMany([
    ...lore.sensoryDetails.sounds,
    ...lore.sensoryDetails.sights,
    monster.signs,
    lore.horror?.omens?.[0] ?? 'O ambiente fica silencioso por alguns segundos.'
  ], 3, next);

  let title = baseEncounter?.title ?? `Ocorrência em ${lore.title}`;
  let publicNarration = lore.narration.crossing;
  let truth = lore.masterGuide?.hiddenTruth ?? lore.secrets;
  let objective = 'Criar uma escolha imediata sem obrigar o grupo a entrar em combate.';
  let behavior = 'A situação reage às decisões do grupo e não permanece estática.';
  let participants = [{ name: 'Ambiente local', type: 'CENARIO', count: '1 área', role: 'Fonte principal do encontro' }];
  let peacefulSolutions = ['Observar antes de agir.', 'Contornar a situação.', 'Oferecer recursos ou informação.'];
  let rewards = ['Informação útil sobre o hexágono.', 'Uma rota ou recurso local.', 'Uma pista ligada à lore.'];
  let statBlockSuggestion = 'Nenhum bloco de estatísticas é necessário.';
  let loreConnection = `O encontro utiliza elementos já presentes em ${lore.title}.`;

  switch (category) {
    case EncounterCategory.MONSTRO:
    case EncounterCategory.CRIATURA: {
      title = combatPreference === EncounterCombatPreference.APENAS_SINAIS ? `Sinais de ${monster.name}` : `${monster.name} na rota`;
      publicNarration = combatPreference === EncounterCombatPreference.APENAS_SINAIS
        ? `O caminho muda de forma quase imperceptível. ${monster.signs} Nenhuma criatura está visível, mas a sensação de estar sendo observado cresce a cada passo.`
        : primaryCreature?.narration ?? `Um movimento rompe a imobilidade de ${lore.title}. ${monster.appearance} A criatura não avança imediatamente; ela mede a distância, a luz e quem está separado do restante do grupo.`;
      truth = `${monster.name} está ${combatPreference === EncounterCombatPreference.APENAS_SINAIS ? 'próximo, acompanhando o grupo sem se revelar' : 'defendendo uma rota ligada ao seu covil'}. ${monster.motive}`;
      objective = monster.motive;
      behavior = monster.behavior;
      participants = [{ name: monster.name, type: category, count: creatureBlocks.length > 0 ? String(creatureBlocks.length) : intensity === EncounterIntensity.MORTAL ? '1 criatura dominante e sinais de outras' : next() > 0.65 ? '2 criaturas' : '1 criatura', role: 'Ameaça ou guardião territorial' }];
      peacefulSolutions = ['Recuar sem correr.', `Explorar a fraqueza comportamental: ${monster.weakness}`, 'Desviar a criatura com alimento, som ou outra distração.', 'Descobrir o que ela protege antes de atacar.'];
      rewards = [monster.reward, 'Acesso ao covil ou à passagem protegida.', 'Conhecimento sobre o comportamento da espécie.'];
      statBlockSuggestion = monster.suggestedStatBlock;
      loreConnection = `${monster.name} já faz parte da ecologia e do conflito secreto do hexágono.`;
      break;
    }
    case EncounterCategory.HORROR: {
      title = `${lore.horror.name}: ${formatEnum(lore.horror.stage)}`;
      publicNarration = `Por alguns segundos, o ambiente deixa de obedecer ao que deveria ser normal. ${pick(lore.horror.omens, next)} ${lore.horror.playerEffect} Um detalhe impossível permanece visível apenas tempo suficiente para que todos tenham certeza de que aconteceu.`;
      truth = lore.horror.truth;
      objective = 'A presença quer conduzir atenção, memória ou movimento até o ponto onde sua influência é mais forte.';
      behavior = 'Manifesta-se por repetição, distorção sensorial e respostas incompletas às ações dos personagens.';
      participants = [{ name: lore.horror.name, type: 'HORROR', count: '1 manifestação', role: 'Presença cósmica ou efeito de influência' }];
      peacefulSolutions = ['Sair da área de manifestação.', `Usar o método de contenção conhecido: ${lore.horror.containment}`, 'Registrar símbolos e padrões sem tocá-los.', 'Interromper fontes de luz, som ou objetos que estejam alimentando a manifestação.'];
      rewards = ['Uma visão verdadeira, mas incompleta.', 'Uma pista sobre a contenção.', 'A identificação de uma área de influência.'];
      statBlockSuggestion = 'Não trate como combate comum. Use testes, escolhas e Abalo Cósmico; uma criatura só aparece se a manifestação evoluir.';
      loreConnection = lore.masterGuide?.activeConflict ?? 'A manifestação está ligada ao segredo central do hexágono.';
      break;
    }
    case EncounterCategory.SOCIAL:
    case EncounterCategory.VIAJANTE: {
      title = category === EncounterCategory.VIAJANTE ? `Viajantes em ${lore.title}` : `${npc.name} pede passagem`;
      const traveler = category === EncounterCategory.VIAJANTE ? pick(genericTravelers, next) : `${npc.name}, ${npc.role}`;
      publicNarration = `Adiante, vocês encontram ${traveler}. A aproximação é cautelosa, sem armas completamente baixadas. ${npc.appearance} ${npc.manner}`;
      truth = npc.secret;
      objective = npc.desire ?? 'Conseguir ajuda sem revelar tudo o que sabe.';
      behavior = `${npc.manner} Se tratado com respeito, oferece ${npc.offer ?? 'uma informação local'}.`;
      participants = [{ name: npc.name, type: category, count: category === EncounterCategory.VIAJANTE ? '1d4 viajantes' : '1 pessoa', role: npc.role }];
      peacefulSolutions = ['Conversar e comparar informações.', 'Negociar troca de recursos.', 'Oferecer escolta ou indicar uma rota.', 'Perceber a contradição na história sem acusar diretamente.'];
      rewards = [npc.offer ?? 'Um rumor local.', 'Uma relação futura.', 'Informação sobre uma rota ou ameaça.'];
      statBlockSuggestion = 'Use plebeu, batedor, espião, guarda ou veterano conforme a função e o perigo.';
      loreConnection = `${npc.name} conhece aspectos do marco e carrega uma ligação secreta com o hexágono.`;
      break;
    }
    case EncounterCategory.FACCAO: {
      title = `${factionName} em movimento`;
      publicNarration = `Um pequeno grupo avança pela região usando sinais combinados e equipamento marcado. Eles se identificam como membros da ${factionName}, mas observam o mapa e os suprimentos do grupo antes de explicar o motivo de estarem aqui.`;
      truth = `A patrulha procura ${lore.landmark.name} e recebeu instruções para ocultar tudo o que encontrar. Um dos integrantes discorda silenciosamente da missão.`;
      objective = `Avaliar o grupo e obter acesso a ${lore.landmark.name}.`;
      behavior = 'Educados enquanto mantêm vantagem numérica; tornam-se desconfiados diante de perguntas específicas.';
      participants = [{ name: factionName, type: 'FACCAO', count: intensity === EncounterIntensity.MORTAL ? '8 a 12 integrantes' : '3 a 6 integrantes', role: 'Patrulha, exploradores ou agentes' }];
      peacefulSolutions = ['Negociar informações parciais.', 'Convencer a patrulha de que outra rota é mais importante.', 'Descobrir a divisão interna do grupo.', 'Aceitar uma missão em troca de passagem.'];
      rewards = ['Reputação com a facção.', 'Equipamento, mapas ou permissões.', 'Informação sobre operações futuras.'];
      statBlockSuggestion = 'Combine guardas, batedores, veteranos e um líder social; evite usar todos como combatentes idênticos.';
      loreConnection = lore.masterGuide?.connections?.[2] ?? 'A facção possui interesse em um objeto ou rota local.';
      break;
    }
    case EncounterCategory.RUMOR: {
      title = 'Um rumor ganha forma';
      publicNarration = `Sinais recentes parecem confirmar uma história ouvida na estrada: “${rumor.text}” Há marcas, objetos e testemunhos suficientes para tornar a informação difícil de ignorar, mas nada prova ainda qual parte é verdadeira.`;
      truth = rumor.truth;
      objective = 'Levar o grupo a decidir se vale gastar tempo verificando o rumor.';
      behavior = 'A situação oferece sinais contraditórios e uma pista verificável.';
      participants = [{ name: rumor.source, type: 'RUMOR', count: '1 fonte ou vestígio', role: 'Origem da informação' }];
      peacefulSolutions = ['Verificar a fonte.', 'Comparar com outra pista.', 'Marcar o local para investigar depois.'];
      rewards = ['Confirmação ou desmentido do rumor.', 'Acesso a uma nova pista.', 'Possível relíquia, rota ou contato.'];
      loreConnection = `A verdade definida para o rumor é: ${rumor.truth}`;
      break;
    }
    case EncounterCategory.RECURSO: {
      title = resource ? `${resource.name} ao alcance` : 'Recurso inesperado';
      publicNarration = resource
        ? `O terreno apresenta sinais de ${resource.name.toLowerCase()}. ${resource.access} A quantidade parece suficiente para justificar uma parada, mas o local não está completamente tranquilo.`
        : 'Uma área protegida contém água, alimento ou materiais úteis. Sinais recentes indicam que outra criatura ou grupo também utiliza o local.';
      truth = resource?.complication ?? `O recurso fica próximo a uma área observada por ${monster.name}.`;
      objective = 'Criar uma decisão entre segurança, tempo e necessidade de suprimentos.';
      behavior = 'O encontro permanece passivo até que o grupo comece a coletar ou permaneça tempo demais.';
      participants = [{ name: resource?.name ?? 'Recurso local', type: 'RECURSO', count: resource?.availability ?? 'quantidade limitada', role: 'Oportunidade de sobrevivência' }];
      peacefulSolutions = ['Coletar rapidamente.', 'Fazer vigia durante a coleta.', 'Deixar parte do recurso para evitar conflito.', 'Marcar o local e retornar preparado.'];
      rewards = [resource ? `${resource.category}: ${resource.availability}` : 'Melhora de um dado de suprimento.', 'Conhecimento de um ponto de coleta.'];
      loreConnection = 'O recurso é compatível com a ecologia e as condições permanentes do hexágono.';
      break;
    }
    case EncounterCategory.DESCOBERTA:
    case EncounterCategory.RUINA: {
      title = category === EncounterCategory.RUINA ? `Estrutura esquecida: ${feature.name}` : `Descoberta: ${feature.name}`;
      publicNarration = `${feature.playerDescription} O acesso não é imediato: marcas no terreno mostram que o lugar foi visitado recentemente, embora não haja ninguém à vista.`;
      truth = feature.masterDetails ?? lore.masterGuide?.hiddenTruth ?? lore.secrets;
      objective = 'Oferecer uma descoberta que pode ser explorada agora ou marcada para depois.';
      behavior = 'O local reage apenas quando investigado; ruído ou retirada de objetos pode chamar atenção.';
      participants = [{ name: feature.name, type: category, count: '1 local', role: 'Descoberta ou pequeno local de aventura' }];
      peacefulSolutions = ['Examinar apenas a parte externa.', 'Marcar a posição.', 'Preparar ferramentas e retornar.', 'Buscar uma entrada alternativa.'];
      rewards = ['Nova localização persistente.', 'Pista histórica.', 'Abrigo, rota ou relíquia menor.'];
      loreConnection = feature.masterDetails ?? `O local está ligado a ${lore.landmark.name}.`;
      break;
    }
    case EncounterCategory.PERIGO_NATURAL: {
      const hazard = pick(naturalHazards, next);
      title = 'O terreno cobra seu preço';
      publicNarration = `A travessia é interrompida por ${hazard}. O perigo não é impossível de superar, mas qualquer tentativa apressada pode separar o grupo, danificar equipamento ou consumir o restante do período.`;
      truth = `O obstáculo foi agravado por mudanças recentes no clima e esconde uma pequena pista relacionada a ${lore.landmark.name}.`;
      objective = 'Consumir decisão e recursos sem exigir combate.';
      behavior = 'O perigo piora com pressa e melhora com preparação, ferramentas ou uma rota alternativa.';
      participants = [{ name: hazard, type: 'PERIGO_NATURAL', count: '1 obstáculo', role: 'Desafio ambiental' }];
      peacefulSolutions = ['Encontrar uma rota alternativa.', 'Usar ferramentas e cordas.', 'Esperar condições melhores.', 'Dividir a tarefa entre guia, batedor e vigia.'];
      rewards = ['Travessia segura.', 'Uma rota mapeada.', 'Uma pista exposta pelo acidente natural.'];
      loreConnection = `O perigo utiliza o terreno ${formatEnum(hex.terrain)} e o clima local.`;
      break;
    }
    case EncounterCategory.CLIMA: {
      const escalation = pick(weatherEscalations, next);
      title = 'Mudança brusca no céu';
      publicNarration = `O clima muda antes que exista tempo para procurar abrigo: ${escalation}. A paisagem perde seus limites e cada som parece mais próximo do que deveria.`;
      truth = hex.cosmicInfluence > 55 ? 'A alteração não é totalmente natural e segue padrões ligados à influência cósmica.' : 'É uma mudança climática extrema, mas natural para a região.';
      objective = 'Forçar escolha entre avançar, proteger recursos ou procurar abrigo.';
      behavior = 'A condição dura um período ou até o grupo alcançar proteção adequada.';
      participants = [{ name: 'Clima regional', type: 'CLIMA', count: '1 frente', role: 'Pressão ambiental' }];
      peacefulSolutions = ['Montar abrigo.', 'Recuar para um local conhecido.', 'Proteger suprimentos e aguardar.', 'Usar magia ou conhecimento natural para prever a duração.'];
      rewards = ['Evitar perda de recursos.', 'Observar um sinal raro do clima.', 'Encontrar algo exposto pela tempestade.'];
      loreConnection = lore.weatherProfile.hazard;
      break;
    }
    case EncounterCategory.VESTIGIO: {
      title = `Vestígios de ${monster.name}`;
      publicNarration = `Nenhuma criatura está visível, mas ${monster.signs} Os sinais são recentes e atravessam a rota em direção a ${lore.landmark.name}.`;
      truth = `${monster.name} passou pelo local há pouco tempo e está ${next() > 0.5 ? 'caçando' : 'transportando algo para seu covil'}.`;
      objective = 'Avisar sobre a ameaça e oferecer a escolha de seguir, evitar ou preparar-se.';
      behavior = 'Não há confronto imediato. Seguir os sinais aproxima o grupo do covil.';
      participants = [{ name: monster.name, type: 'VESTIGIO', count: 'sinais de 1 ou mais criaturas', role: 'Ameaça fora de cena' }];
      peacefulSolutions = ['Contornar os rastros.', 'Preparar uma armadilha.', 'Seguir à distância.', 'Marcar o território no mapa.'];
      rewards = ['Informação sobre a criatura.', 'Possível acesso ao covil.', 'Redução da chance de surpresa futura.'];
      statBlockSuggestion = monster.suggestedStatBlock;
      loreConnection = `${monster.name} é uma ameaça permanente deste hexágono.`;
      break;
    }
    case EncounterCategory.CONSEQUENCIA: {
      title = 'Uma escolha antiga retorna';
      publicNarration = `O grupo encontra sinais de que uma decisão anterior teve efeitos além do esperado. Um caminho está diferente, uma mensagem foi deixada ou alguém chegou primeiro a ${lore.landmark.name}.`;
      truth = lore.masterGuide?.whatChangesIfIgnored ?? 'A situação se desenvolveu enquanto o grupo estava ausente.';
      objective = 'Mostrar consequência sem alterar automaticamente o mundo antes da decisão do mestre.';
      behavior = 'O mestre escolhe qual decisão anterior está sendo retomada e qual parte se torna visível.';
      participants = [{ name: 'Consequência pendente', type: 'CONSEQUENCIA', count: '1 desenvolvimento', role: 'Retorno de uma escolha anterior' }];
      peacefulSolutions = ['Investigar antes de reagir.', 'Procurar testemunhas.', 'Negociar com os envolvidos.', 'Aceitar a perda e adaptar a rota.'];
      rewards = ['Continuidade narrativa.', 'Nova oportunidade de intervenção.', 'Informação sobre o avanço de uma ameaça ou facção.'];
      loreConnection = lore.masterGuide?.whatChangesIfIgnored ?? 'Ligada ao conflito ativo local.';
      break;
    }
  }

  const checks = [
    {
      skill: category === EncounterCategory.SOCIAL || category === EncounterCategory.VIAJANTE || category === EncounterCategory.FACCAO ? 'Intuição ou Persuasão' : 'Percepção ou Sobrevivência',
      dc,
      success: 'O grupo percebe a intenção principal, encontra uma posição melhor ou reduz o risco antes de decidir.',
      failure: 'A informação ainda é obtida, mas custa tempo, recurso, posição ou cria uma complicação.'
    },
    {
      skill: [EncounterCategory.HORROR, EncounterCategory.RUINA, EncounterCategory.DESCOBERTA].includes(category) ? 'Arcanismo, Religião ou Investigação' : 'Natureza, História ou Investigação',
      dc: Math.min(20, dc + 1),
      success: 'Uma pista secundária conecta o encontro à lore do hexágono.',
      failure: 'A pista aparece de forma incompleta ou junto de uma ameaça adicional.'
    }
  ];

  const complications = pickMany([
    'A ação consome o restante do período.',
    'Um suprimento relevante precisa ser testado.',
    'O grupo produz barulho e deixa rastros claros.',
    'Uma segunda presença percebe o encontro.',
    'A rota mais segura fica temporariamente bloqueada.',
    'Um personagem recebe uma informação que os demais não percebem.',
    'O clima piora antes da resolução.',
    dto.notes?.trim() ? `Incorpore a observação do mestre: ${dto.notes.trim()}` : 'Uma pista aponta para outro hexágono.'
  ], 3, next);

  const consequences = pickMany([
    'Salvar este resultado como evento futuro no mesmo hexágono.',
    'Aumentar ou reduzir a confiança de um NPC ou grupo local.',
    'Revelar uma rota, pista ou característica do hexágono.',
    'Registrar uma ameaça como conhecida pelos jogadores.',
    'Consumir tempo, água, comida, munição ou materiais médicos.',
    'Criar uma dívida, promessa ou inimigo recorrente.',
    'Alterar apenas uma pequena condição local, sem mudar toda a região.'
  ], 3, next);

  const revealableFragments = [
    commonSigns[0],
    commonSigns[1],
    `Impressão inicial: ${publicNarration}`,
    `Pista observável: ${pick(lore.clues ?? [{ clue: 'Há marcas recentes no terreno.' }], next).clue}`
  ];

  const masterSummary = `${truth} Objetivo: ${objective} Comportamento: ${behavior}`;

  return {
    title,
    publicNarration,
    masterSummary,
    category,
    intensity,
    combatPreference,
    loreRelation,
    content: {
      categoryLabel: categoryLabels[category],
      intensityLabel: intensityLabels[intensity],
      combatLikelihood: formatEnum(combatPreference),
      truth,
      objective,
      behavior,
      signs: commonSigns,
      clues: pickMany((lore.clues ?? []).map((item) => `${item.clue} — revela: ${item.reveals}`), 2, next),
      checks,
      complications,
      peacefulSolutions,
      consequences,
      rewards,
      loreConnection,
      dangerAssessment: dangerAssessment(intensity, partySize, averageLevel, hex),
      statBlockSuggestion,
      participants,
      revealableFragments,
      creatures: includedCreatures,
      creatureNarration: primaryCreature?.narration,
      masterQuestions: [
        'Qual sinal será apresentado antes de qualquer perigo direto?',
        'O que muda se o grupo ignorar este encontro?',
        'Qual informação pode ser descoberta mesmo em uma falha?',
        'Existe uma saída que não dependa de combate?'
      ]
    }
  };
}
