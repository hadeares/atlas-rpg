'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '@/lib/api';
import {
  CreatureStatBlock,
  CreatureSyncStatus,
  CreatureTemplate,
  EncounterCategory,
  EncounterCombatPreference,
  EncounterCreatureMode,
  EncounterIntensity,
  EncounterLoreRelation,
  EncounterStatus,
  HexData,
  RandomEncounter
} from '@/lib/types';

const categoryOptions: Array<[EncounterCategory, string]> = [
  ['ALEATORIO', 'Aleatório'], ['CRIATURA', 'Criatura'], ['MONSTRO', 'Monstro'], ['HORROR', 'Horror'],
  ['SOCIAL', 'Social'], ['VIAJANTE', 'Viajante'], ['FACCAO', 'Facção'], ['DESCOBERTA', 'Descoberta'],
  ['VESTIGIO', 'Vestígio'], ['PERIGO_NATURAL', 'Perigo natural'], ['CLIMA', 'Clima'], ['RECURSO', 'Recurso'],
  ['RUINA', 'Ruína'], ['RUMOR', 'Rumor'], ['CONSEQUENCIA', 'Consequência']
];

const intensityOptions: Array<[EncounterIntensity, string]> = [
  ['QUALQUER', 'Qualquer'], ['TRANQUILA', 'Tranquila'], ['CURIOSA', 'Curiosa'],
  ['PREOCUPANTE', 'Preocupante'], ['PERIGOSA', 'Perigosa'], ['MORTAL', 'Mortal']
];

const combatOptions: Array<[EncounterCombatPreference, string]> = [
  ['QUALQUER', 'Qualquer'], ['SEM_COMBATE', 'Sem combate'], ['COMBATE_POSSIVEL', 'Combate possível'],
  ['COMBATE_PROVAVEL', 'Combate provável'], ['APENAS_SINAIS', 'Apenas sinais']
];

const relationOptions: Array<[EncounterLoreRelation, string]> = [
  ['LORE_EXISTENTE', 'Usar lore existente'], ['NOVO_COMPATIVEL', 'Novo e compatível'], ['RUMOR', 'Relacionar a rumor'],
  ['MONSTRO_LOCAL', 'Relacionar a monstro local'], ['HORROR_LOCAL', 'Relacionar ao horror'], ['FACCAO', 'Relacionar a facção']
];

const creatureModeOptions: Array<[EncounterCreatureMode, string]> = [
  ['ANY', 'Qualquer criatura'], ['SRD', 'Catálogo SRD'], ['ORIGINAL', 'Criatura original aleatória'],
  ['COSMIC', 'Criatura cósmica'], ['INFECTED', 'Criatura infectada'], ['CUSTOM', 'Criatura personalizada']
];

const statusLabels: Record<EncounterStatus, string> = {
  RASCUNHO: 'Rascunho', PREPARADO: 'Preparado', ATIVO: 'Ativo', CONCLUIDO: 'Concluído',
  IGNORADO: 'Ignorado', CANCELADO: 'Cancelado'
};

export function EncountersPanel({ campaignId, hex }: { campaignId: string; hex: HexData }) {
  const [encounters, setEncounters] = useState<RandomEncounter[]>([]);
  const [selectedEncounter, setSelectedEncounter] = useState<RandomEncounter | null>(null);
  const [creatures, setCreatures] = useState<CreatureTemplate[]>([]);
  const [syncStatus, setSyncStatus] = useState<CreatureSyncStatus | null>(null);
  const [category, setCategory] = useState<EncounterCategory>('ALEATORIO');
  const [intensity, setIntensity] = useState<EncounterIntensity>('QUALQUER');
  const [combatPreference, setCombatPreference] = useState<EncounterCombatPreference>('QUALQUER');
  const [loreRelation, setLoreRelation] = useState<EncounterLoreRelation>('LORE_EXISTENTE');
  const [creatureMode, setCreatureMode] = useState<EncounterCreatureMode>('ANY');
  const [creatureTemplateId, setCreatureTemplateId] = useState('');
  const [creatureSearch, setCreatureSearch] = useState('');
  const [creatureCount, setCreatureCount] = useState(1);
  const [targetCr, setTargetCr] = useState(1);
  const [partySize, setPartySize] = useState(4);
  const [averageLevel, setAverageLevel] = useState(3);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [customName, setCustomName] = useState('');
  const [customJson, setCustomJson] = useState(defaultCustomCreatureJson());
  const [bulkJson, setBulkJson] = useState(defaultBulkCreatureJson());

  useEffect(() => {
    void loadData();
  }, [campaignId, hex.q, hex.r]);

  const filteredCreatures = useMemo(() => {
    const search = creatureSearch.trim().toLowerCase();
    return creatures.filter((creature) => {
      if (creatureMode === 'SRD' && creature.source !== 'SRD') return false;
      if (creatureMode === 'CUSTOM' && creature.source !== 'CUSTOM') return false;
      if (!search) return true;
      return `${creature.name} ${creature.creatureType} ${creature.challengeRating}`.toLowerCase().includes(search);
    }).slice(0, 250);
  }, [creatures, creatureMode, creatureSearch]);

  async function loadData() {
    setError('');
    try {
      const [encounterData, creatureData, statusData] = await Promise.all([
        apiRequest<RandomEncounter[]>(`/campaigns/${campaignId}/encounters?q=${hex.q}&r=${hex.r}`),
        apiRequest<CreatureTemplate[]>(`/campaigns/${campaignId}/creatures?limit=500`),
        apiRequest<CreatureSyncStatus>(`/campaigns/${campaignId}/creatures/sync-status`)
      ]);
      setEncounters(encounterData);
      setCreatures(creatureData);
      setSyncStatus(statusData);
      if (encounterData.length > 0) setSelectedEncounter((current) => current ?? encounterData[0]);
    } catch (caughtError) {
      setError(readError(caughtError));
    }
  }

  async function generateEncounter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const generated = await apiRequest<RandomEncounter>(`/campaigns/${campaignId}/encounters/generate`, {
        method: 'POST',
        body: JSON.stringify({
          q: hex.q,
          r: hex.r,
          category,
          intensity,
          combatPreference,
          loreRelation,
          creatureMode,
          creatureTemplateId: creatureTemplateId || undefined,
          creatureCount,
          targetCr,
          partySize,
          averageLevel,
          notes
        })
      });
      setEncounters((current) => [generated, ...current]);
      setSelectedEncounter(generated);
    } catch (caughtError) {
      setError(readError(caughtError));
    } finally {
      setBusy(false);
    }
  }

  async function updateStatus(status: EncounterStatus) {
    if (!selectedEncounter) return;
    setBusy(true);
    setError('');
    try {
      const updated = await apiRequest<RandomEncounter>(`/campaigns/${campaignId}/encounters/${selectedEncounter.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      replaceEncounter(updated);
    } catch (caughtError) {
      setError(readError(caughtError));
    } finally {
      setBusy(false);
    }
  }

  async function deleteEncounter() {
    if (!selectedEncounter || !window.confirm(`Excluir o encontro “${selectedEncounter.title}”?`)) return;
    setBusy(true);
    setError('');
    try {
      await apiRequest(`/campaigns/${campaignId}/encounters/${selectedEncounter.id}`, { method: 'DELETE' });
      setEncounters((current) => current.filter((item) => item.id !== selectedEncounter.id));
      setSelectedEncounter(null);
    } catch (caughtError) {
      setError(readError(caughtError));
    } finally {
      setBusy(false);
    }
  }

  async function syncSrd() {
    setBusy(true);
    setError('');
    try {
      const status = await apiRequest<CreatureSyncStatus>(`/campaigns/${campaignId}/creatures/sync-srd`, { method: 'POST' });
      setSyncStatus(status);
      window.setTimeout(() => void refreshSyncStatus(), 1200);
    } catch (caughtError) {
      setError(readError(caughtError));
    } finally {
      setBusy(false);
    }
  }

  async function refreshSyncStatus() {
    try {
      const status = await apiRequest<CreatureSyncStatus>(`/campaigns/${campaignId}/creatures/sync-status`);
      setSyncStatus(status);
      if (status.running) {
        window.setTimeout(() => void refreshSyncStatus(), 1500);
      } else {
        setCreatures(await apiRequest<CreatureTemplate[]>(`/campaigns/${campaignId}/creatures?limit=500`));
      }
    } catch {
      return;
    }
  }

  async function createCustomCreature(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const parsed = JSON.parse(customJson) as CreatureStatBlock;
      const created = await apiRequest<CreatureTemplate>(`/campaigns/${campaignId}/creatures/custom`, {
        method: 'POST',
        body: JSON.stringify({ name: customName, statBlock: parsed })
      });
      setCreatures((current) => [...current, created]);
      setCreatureMode('CUSTOM');
      setCreatureTemplateId(created.id);
      setCustomName('');
    } catch (caughtError) {
      setError(caughtError instanceof SyntaxError ? 'O JSON da ficha personalizada é inválido.' : readError(caughtError));
    } finally {
      setBusy(false);
    }
  }

  async function importCustomCreatures(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const parsed = JSON.parse(bulkJson) as unknown;
      const creaturesToImport = Array.isArray(parsed) ? parsed : (parsed as { creatures?: unknown[] })?.creatures;
      if (!Array.isArray(creaturesToImport)) throw new SyntaxError('O JSON precisa ser um array ou possuir a propriedade creatures.');
      const result = await apiRequest<{ imported: number; creatures: CreatureTemplate[] }>(`/campaigns/${campaignId}/creatures/custom/import`, {
        method: 'POST',
        body: JSON.stringify({ creatures: creaturesToImport })
      });
      setCreatures((current) => [...current, ...result.creatures]);
      setCreatureMode('CUSTOM');
      window.alert(`${result.imported} criaturas importadas.`);
    } catch (caughtError) {
      setError(caughtError instanceof SyntaxError ? 'O JSON do catálogo é inválido.' : readError(caughtError));
    } finally {
      setBusy(false);
    }
  }

  function replaceEncounter(updated: RandomEncounter) {
    setEncounters((current) => current.map((item) => item.id === updated.id ? updated : item));
    setSelectedEncounter(updated);
  }

  return <section className="sidebar-section encounter-panel">
    <div className="encounter-panel-header">
      <div><p className="eyebrow">Somente o mestre</p><h3>Gerador de encontros</h3></div>
      <span className="status-badge status-explorado">Hex {hex.q}, {hex.r}</span>
    </div>
    <p className="helper-text">Gerar não altera o mundo nem revela nada. O encontro só entra em cena quando você clicar em “Ativar”.</p>
    {error && <p className="global-error compact-error">{error}</p>}

    <details open className="encounter-generator-box">
      <summary>Configurar e gerar</summary>
      <form className="form-stack compact-form" onSubmit={generateEncounter}>
        <div className="encounter-form-grid">
          <label>Tipo<select value={category} onChange={(event) => setCategory(event.target.value as EncounterCategory)}>{categoryOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label>Intensidade<select value={intensity} onChange={(event) => setIntensity(event.target.value as EncounterIntensity)}>{intensityOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label>Combate<select value={combatPreference} onChange={(event) => setCombatPreference(event.target.value as EncounterCombatPreference)}>{combatOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label>Relação com a lore<select value={loreRelation} onChange={(event) => setLoreRelation(event.target.value as EncounterLoreRelation)}>{relationOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label>Origem da criatura<select value={creatureMode} onChange={(event) => { setCreatureMode(event.target.value as EncounterCreatureMode); setCreatureTemplateId(''); }}>{creatureModeOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label>Quantidade<input type="number" min={1} max={12} value={creatureCount} onChange={(event) => setCreatureCount(Number(event.target.value))} /></label>
          <label>ND desejado<input type="number" min={0.125} max={30} step={0.125} value={targetCr} onChange={(event) => setTargetCr(Number(event.target.value))} /></label>
          <label>Nível médio<input type="number" min={1} max={20} value={averageLevel} onChange={(event) => setAverageLevel(Number(event.target.value))} /></label>
          <label>Tamanho do grupo<input type="number" min={1} max={12} value={partySize} onChange={(event) => setPartySize(Number(event.target.value))} /></label>
        </div>

        <>
          <label>Buscar criatura<input value={creatureSearch} onChange={(event) => setCreatureSearch(event.target.value)} placeholder="Nome, tipo ou ND" /></label>
          <label>Criatura específica<select value={creatureTemplateId} onChange={(event) => setCreatureTemplateId(event.target.value)}><option value="">Escolher automaticamente</option>{filteredCreatures.map((creature) => <option key={creature.id} value={creature.id}>{creature.name} · ND {creature.challengeRating} · {creature.source}</option>)}</select></label>
        </>
        {['COSMIC', 'INFECTED'].includes(creatureMode) && <small className="muted">Escolha uma criatura-base para criar uma variante, ou deixe automático para gerar uma criatura original.</small>}

        <label>Orientação do mestre<textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Ex.: quero uma pista sobre a mina e uma saída sem combate" /></label>
        <button className="primary-button" disabled={busy}>{busy ? 'Gerando...' : 'Gerar encontro secreto'}</button>
      </form>
    </details>

    <div className="catalog-status-card">
      <div><strong>Catálogo SRD</strong><small>{syncStatus?.catalogCount ?? 0} criaturas importadas</small></div>
      <button className="ghost-button mini-button" onClick={() => void syncSrd()} disabled={busy || syncStatus?.running}>{syncStatus?.running ? `${syncStatus.imported}/${syncStatus.total || '?'}` : 'Sincronizar SRD'}</button>
    </div>
    {syncStatus?.lastError && <small className="muted">A sincronização online falhou; as criaturas originais continuam disponíveis.</small>}

    <details className="custom-creature-box">
      <summary>Cadastrar criatura personalizada</summary>
      <form className="form-stack compact-form" onSubmit={createCustomCreature}>
        <label>Nome<input value={customName} onChange={(event) => setCustomName(event.target.value)} required /></label>
        <label>Ficha em JSON<textarea className="json-editor" rows={12} value={customJson} onChange={(event) => setCustomJson(event.target.value)} required /></label>
        <button className="ghost-button" disabled={busy}>Salvar criatura personalizada</button>
      </form>
    </details>

    <details className="custom-creature-box">
      <summary>Importar catálogo JSON</summary>
      <form className="form-stack compact-form" onSubmit={importCustomCreatures}>
        <p className="helper-text">Aceita até 1.000 fichas no formato <code>[{`{ name, statBlock }`}]</code>. Use apenas conteúdo que você tenha autorização para importar.</p>
        <label>Catálogo<textarea className="json-editor" rows={12} value={bulkJson} onChange={(event) => setBulkJson(event.target.value)} required /></label>
        <button className="ghost-button" disabled={busy}>Importar catálogo</button>
      </form>
    </details>

    <div className="encounter-history">
      <div className="card-title-row"><h3>Encontros deste hexágono</h3><span>{encounters.length}</span></div>
      {encounters.length === 0 && <p className="muted">Nenhum encontro foi preparado aqui.</p>}
      {encounters.map((encounter) => <button key={encounter.id} className={`encounter-history-item${selectedEncounter?.id === encounter.id ? ' active' : ''}`} onClick={() => setSelectedEncounter(encounter)}><strong>{encounter.title}</strong><small>Dia {encounter.day} · {statusLabels[encounter.status]} · {formatEnum(encounter.intensity)}</small></button>)}
    </div>

    {selectedEncounter && <EncounterDetail
      encounter={selectedEncounter}
      busy={busy}
      onCopy={(text) => navigator.clipboard.writeText(text)}
      onStatus={updateStatus}
      onDelete={deleteEncounter}
    />}
  </section>;
}

function EncounterDetail({ encounter, busy, onCopy, onStatus, onDelete }: {
  encounter: RandomEncounter;
  busy: boolean;
  onCopy: (text: string) => Promise<void>;
  onStatus: (status: EncounterStatus) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  return <article className="encounter-detail">
    <header>
      <div><p className="eyebrow">{formatEnum(encounter.category)} · {formatEnum(encounter.intensity)}</p><h2>{encounter.title}</h2></div>
      <span className={`encounter-status encounter-status-${encounter.status.toLowerCase()}`}>{statusLabels[encounter.status]}</span>
    </header>

    <section className="narration-box">
      <div className="card-title-row"><h3>Texto para narrar</h3><button className="ghost-button mini-button" onClick={() => void onCopy(encounter.publicNarration)}>Copiar</button></div>
      <p>{encounter.publicNarration}</p>
    </section>

    <section className="secret-box"><strong>Informação do mestre</strong><p>{encounter.masterSummary}</p></section>
    <LoreSection title="Sinais" items={encounter.content.signs} />
    <LoreSection title="Pistas" items={encounter.content.clues} />
    <LoreSection title="Resoluções sem combate" items={encounter.content.peacefulSolutions} />
    <LoreSection title="Complicações" items={encounter.content.complications} />
    <LoreSection title="Consequências possíveis" items={encounter.content.consequences} />
    <LoreSection title="Recompensas" items={encounter.content.rewards} />

    <div className="encounter-checks">
      {encounter.content.checks.map((check) => <article key={`${check.skill}-${check.dc}`} className="lore-card"><h3>{check.skill} · CD {check.dc}</h3><p><strong>Sucesso:</strong> {check.success}</p><p><strong>Falha:</strong> {check.failure}</p></article>)}
    </div>

    {encounter.content.creatures.map((creature, index) => <CreatureStatCard key={`${creature.name}-${index}`} creature={creature} />)}

    <section className="lore-card"><h3>Avaliação de perigo</h3><p>{encounter.content.dangerAssessment}</p><small className="secret-line">{encounter.content.loreConnection}</small></section>

    <div className="encounter-actions">
      <button className="ghost-button" disabled={busy} onClick={() => void onStatus('PREPARADO')}>Preparar</button>
      <button className="primary-button" disabled={busy} onClick={() => void onStatus('ATIVO')}>Ativar</button>
      <button className="ghost-button" disabled={busy} onClick={() => void onStatus('CONCLUIDO')}>Concluir</button>
      <button className="ghost-button" disabled={busy} onClick={() => void onStatus('IGNORADO')}>Ignorar</button>
      <button className="danger-button" disabled={busy || encounter.status === 'ATIVO'} onClick={() => void onDelete()}>Excluir</button>
    </div>
  </article>;
}

function CreatureStatCard({ creature }: { creature: CreatureStatBlock }) {
  const speeds = Object.entries(creature.speed).filter(([, value]) => Boolean(value)).map(([key, value]) => `${formatEnum(key)} ${value}`).join(', ');
  return <article className="creature-stat-card">
    <header><div><p className="eyebrow">{creature.size} {creature.type} · {creature.alignment}</p><h2>{creature.name}</h2></div><span>ND {creature.challengeLabel}</span></header>
    <p className="creature-narration">{creature.narration}</p>
    <dl className="stat-summary"><div><dt>CA</dt><dd>{creature.armorClass}</dd></div><div><dt>PV</dt><dd>{creature.hitPoints} ({creature.hitDice})</dd></div><div><dt>Deslocamento</dt><dd>{speeds || '—'}</dd></div><div><dt>PB</dt><dd>+{creature.proficiencyBonus}</dd></div></dl>
    <div className="ability-grid">{Object.entries(creature.abilities).map(([ability, value]) => <div key={ability}><strong>{ability.toUpperCase()}</strong><span>{value} ({modifier(value)})</span></div>)}</div>
    <CompactLine label="Resistências" values={creature.damageResistances} />
    <CompactLine label="Imunidades" values={creature.damageImmunities} />
    <CompactLine label="Imunidades a condições" values={creature.conditionImmunities} />
    <CompactLine label="Sentidos" values={creature.senses} />
    <CompactLine label="Idiomas" values={creature.languages} />
    {creature.traits.map((trait) => <section key={trait.name} className="stat-feature"><strong>{trait.name}.</strong> <span>{trait.description}</span></section>)}
    {creature.actions.length > 0 && <div className="stat-section"><h3>Ações</h3>{creature.actions.map((action) => <section key={action.name} className="stat-feature"><strong>{action.name}.</strong> <span>{action.description}</span>{action.damage && <small>Dano: {action.damage} {action.damageType ?? ''}</small>}</section>)}</div>}
    {creature.reactions.length > 0 && <div className="stat-section"><h3>Reações</h3>{creature.reactions.map((action) => <section key={action.name} className="stat-feature"><strong>{action.name}.</strong> <span>{action.description}</span></section>)}</div>}
    {creature.legendaryActions.length > 0 && <div className="stat-section"><h3>Ações lendárias</h3>{creature.legendaryActions.map((action) => <section key={action.name} className="stat-feature"><strong>{action.name}.</strong> <span>{action.description}</span></section>)}</div>}
    <div className="creature-master-notes"><p><strong>Comportamento:</strong> {creature.behavior}</p><p><strong>Tática:</strong> {creature.tactics}</p><p><strong>Fraqueza:</strong> {creature.weakness}</p><p><strong>Sinais:</strong> {creature.signs.join(' ')}</p></div>
    {creature.license && <small className="license-note">{creature.license}</small>}
  </article>;
}

function LoreSection({ title, items }: { title: string; items: string[] }) {
  if (!items?.length) return null;
  return <section className="lore-card"><h3>{title}</h3><ul>{items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul></section>;
}

function CompactLine({ label, values }: { label: string; values: string[] }) {
  if (!values?.length) return null;
  return <p className="compact-stat-line"><strong>{label}:</strong> {values.join(', ')}</p>;
}

function modifier(value: number) {
  const result = Math.floor((value - 10) / 2);
  return result >= 0 ? `+${result}` : String(result);
}

function formatEnum(value: string) {
  return value.toLowerCase().split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

function readError(error: unknown) {
  return error instanceof Error ? error.message : 'Não foi possível concluir a operação.';
}

function defaultCustomCreatureJson() {
  return JSON.stringify({
    source: 'CUSTOM', theme: 'STANDARD', size: 'Médio', type: 'Monstruosidade', alignment: 'Sem alinhamento',
    armorClass: 13, hitPoints: 30, hitDice: '4d8 + 12', speed: { walk: '9 m' },
    abilities: { str: 14, dex: 12, con: 16, int: 6, wis: 12, cha: 7 }, savingThrows: {}, skills: {},
    damageVulnerabilities: [], damageResistances: [], damageImmunities: [], conditionImmunities: [],
    senses: ['visão no escuro 18 m', 'Percepção passiva 11'], languages: ['—'], challengeRating: 2,
    challengeLabel: '2', experiencePoints: 450, proficiencyBonus: 2,
    traits: [{ name: 'Instinto do Ermo', description: 'Tem vantagem para rastrear criaturas feridas.' }],
    actions: [{ name: 'Garras', description: 'Ataque corpo a corpo. Em um acerto, causa 2d6 + 2 de dano cortante.', attackBonus: 4, damage: '2d6 + 2', damageType: 'cortante' }],
    bonusActions: [], reactions: [], legendaryActions: [], description: 'Descrição da criatura.',
    narration: 'Texto pronto para narrar quando ela aparece.', signs: ['rastros recentes'], behavior: 'Defende território.',
    tactics: 'Embosca alvos isolados.', weakness: 'Luz forte.', rewards: ['componentes raros']
  }, null, 2);
}


function defaultBulkCreatureJson() {
  const example = JSON.parse(defaultCustomCreatureJson()) as CreatureStatBlock;
  return JSON.stringify([{ name: 'Criatura de exemplo', statBlock: example }], null, 2);
}
