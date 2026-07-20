'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { apiRequest } from '@/lib/api';
import {
  CosmicCreatureArchetype,
  CosmicCreatureMutation,
  CosmicCreatureOrigin,
  CosmicCreatureTemperament,
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
  ['ANY', 'Qualquer criatura'], ['SRD', 'Catálogo SRD'], ['ORIGINAL', 'Criatura original comum'],
  ['COSMIC', 'Criatura cósmica'], ['INFECTED', 'Criatura infectada'], ['CUSTOM', 'Criatura cadastrada']
];

const archetypeOptions: Array<[CosmicCreatureArchetype, string]> = [
  ['RANDOM', 'Arquétipo aleatório'], ['STALKER', 'Caçador furtivo'], ['BRUTE', 'Brutamontes'],
  ['CONTROLLER', 'Controlador de campo'], ['ARTILLERY', 'Artilharia à distância'], ['SWARM', 'Enxame'],
  ['BOSS', 'Entidade dominante'], ['ORACLE', 'Oráculo impossível'], ['LEECH', 'Sanguessuga de realidade'],
  ['SHAPER', 'Moldador de carne e espaço'], ['HERALD', 'Arauto da Estrela Negra']
];

const originOptions: Array<[CosmicCreatureOrigin, string]> = [
  ['RANDOM', 'Origem aleatória'], ['FERIDA', 'A Ferida'], ['VAZIO', 'O Vazio'], ['SONHO', 'O Sonho'],
  ['CRISTAL', 'Cristal impossível'], ['TEMPO', 'Tempo quebrado'], ['PARASITA', 'Parasita extraplanar'],
  ['ABISMO', 'O Abismo'], ['ESTRELA_NEGRA', 'A Estrela Negra'], ['ECLIPSE', 'Eclipse vivo'],
  ['CINZA_SOLAR', 'Cinza do sol consumido'], ['ESPELHO', 'Mundo do espelho'], ['FOME', 'Fome do Devorador']
];

const mutationOptions: Array<[CosmicCreatureMutation, string]> = [
  ['RANDOM', 'Mutação aleatória'], ['FRACTAL', 'Anatomia fractal'], ['MULTIMEMBROS', 'Múltiplos membros'],
  ['CORO', 'Corpo coral'], ['OCO', 'Interior oco'], ['ESPELHO', 'Carne espelhada'],
  ['CICATRIZ_SOLAR', 'Cicatriz solar'], ['PARASITARIA', 'Colônia parasitária'],
  ['GEOMETRICA', 'Geometria impossível'], ['FLUTUANTE', 'Forma flutuante']
];

const temperamentOptions: Array<[CosmicCreatureTemperament, string]> = [
  ['RANDOM', 'Temperamento aleatório'], ['CURIOSO', 'Curioso e observador'], ['PREDATORIO', 'Predatório'],
  ['RITUALISTICO', 'Ritualístico'], ['PROTETOR', 'Protetor de âncora'], ['COLETOR', 'Coletor de memórias'],
  ['EMISSARIO', 'Emissário'], ['FAMINTO', 'Faminto'], ['DORMENTE', 'Dormente até ser despertado']
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
  const [modalOpen, setModalOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [category, setCategory] = useState<EncounterCategory>('HORROR');
  const [intensity, setIntensity] = useState<EncounterIntensity>('PERIGOSA');
  const [combatPreference, setCombatPreference] = useState<EncounterCombatPreference>('COMBATE_POSSIVEL');
  const [loreRelation, setLoreRelation] = useState<EncounterLoreRelation>('HORROR_LOCAL');
  const [generateCosmicCreature, setGenerateCosmicCreature] = useState(true);
  const [saveGeneratedCreature, setSaveGeneratedCreature] = useState(true);
  const [cosmicArchetype, setCosmicArchetype] = useState<CosmicCreatureArchetype>('RANDOM');
  const [cosmicOrigin, setCosmicOrigin] = useState<CosmicCreatureOrigin>('RANDOM');
  const [cosmicMutation, setCosmicMutation] = useState<CosmicCreatureMutation>('RANDOM');
  const [cosmicTemperament, setCosmicTemperament] = useState<CosmicCreatureTemperament>('RANDOM');
  const [monsterLevel, setMonsterLevel] = useState(3);
  const [creatureMode, setCreatureMode] = useState<EncounterCreatureMode>('COSMIC');
  const [creatureTemplateId, setCreatureTemplateId] = useState('');
  const [creatureSearch, setCreatureSearch] = useState('');
  const [creatureCount, setCreatureCount] = useState(1);
  const [targetCr, setTargetCr] = useState(3);
  const [partySize, setPartySize] = useState(4);
  const [averageLevel, setAverageLevel] = useState(3);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [customName, setCustomName] = useState('');
  const [customJson, setCustomJson] = useState(defaultCustomCreatureJson());
  const [bulkJson, setBulkJson] = useState(defaultBulkCreatureJson());

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    void loadData();
  }, [campaignId, hex.q, hex.r]);

  useEffect(() => {
    if (!modalOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) setModalOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [modalOpen, busy]);

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
      setSelectedEncounter(encounterData[0] ?? null);
    } catch (caughtError) {
      setError(readError(caughtError));
    }
  }

  async function generateEncounter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const cosmic = generateCosmicCreature;
      const generated = await apiRequest<RandomEncounter>(`/campaigns/${campaignId}/encounters/generate`, {
        method: 'POST',
        body: JSON.stringify({
          q: hex.q,
          r: hex.r,
          category: cosmic ? 'HORROR' : category,
          intensity,
          combatPreference,
          loreRelation: cosmic ? 'HORROR_LOCAL' : loreRelation,
          creatureMode: cosmic ? 'COSMIC' : creatureMode,
          creatureTemplateId: !cosmic && creatureTemplateId ? creatureTemplateId : undefined,
          creatureCount,
          targetCr: cosmic ? monsterLevel : targetCr,
          monsterLevel: cosmic ? monsterLevel : undefined,
          partySize,
          averageLevel,
          generateCosmicCreature: cosmic,
          saveGeneratedCreature: cosmic && saveGeneratedCreature,
          cosmicArchetype: cosmic ? cosmicArchetype : undefined,
          cosmicOrigin: cosmic ? cosmicOrigin : undefined,
          cosmicMutation: cosmic ? cosmicMutation : undefined,
          cosmicTemperament: cosmic ? cosmicTemperament : undefined,
          notes
        })
      });
      setEncounters((current) => [generated, ...current]);
      setSelectedEncounter(generated);
      setModalOpen(false);
      if (cosmic && saveGeneratedCreature) {
        setCreatures(await apiRequest<CreatureTemplate[]>(`/campaigns/${campaignId}/creatures?limit=500`));
      }
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
      const remaining = encounters.filter((item) => item.id !== selectedEncounter.id);
      setEncounters(remaining);
      setSelectedEncounter(remaining[0] ?? null);
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

  const modal = mounted && modalOpen ? createPortal(
    <div className="encounter-modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !busy) setModalOpen(false);
    }}>
      <section className="encounter-modal" role="dialog" aria-modal="true" aria-labelledby="encounter-modal-title">
        <header className="encounter-modal-header">
          <div>
            <p className="eyebrow">Hexágono {hex.q}, {hex.r}</p>
            <h2 id="encounter-modal-title">Gerar encontro secreto</h2>
          </div>
          <button type="button" className="ghost-button encounter-modal-close" disabled={busy} onClick={() => setModalOpen(false)}>Fechar</button>
        </header>
        <form className="encounter-modal-form" onSubmit={generateEncounter}>
          <div className="cosmic-generator-toggle">
            <label className="checkbox-row">
              <input type="checkbox" checked={generateCosmicCreature} onChange={(event) => {
                const checked = event.target.checked;
                setGenerateCosmicCreature(checked);
                if (checked) {
                  setCategory('HORROR');
                  setCreatureMode('COSMIC');
                  setLoreRelation('HORROR_LOCAL');
                }
              }} />
              <span><strong>Gerar monstro cósmico personalizado</strong><small>Cria aparência, ficha, ataques, poderes, fraqueza e comportamento exclusivos para este encontro.</small></span>
            </label>
          </div>

          <div className="encounter-modal-grid">
            {!generateCosmicCreature && <label>Tipo de encontro<select value={category} onChange={(event) => setCategory(event.target.value as EncounterCategory)}>{categoryOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>}
            <label>Intensidade<select value={intensity} onChange={(event) => setIntensity(event.target.value as EncounterIntensity)}>{intensityOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label>Possibilidade de combate<select value={combatPreference} onChange={(event) => setCombatPreference(event.target.value as EncounterCombatPreference)}>{combatOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            {!generateCosmicCreature && <label>Relação com a lore<select value={loreRelation} onChange={(event) => setLoreRelation(event.target.value as EncounterLoreRelation)}>{relationOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>}

            {generateCosmicCreature ? <>
              <label>Nível do monstro<input type="number" min={1} max={20} value={monsterLevel} onChange={(event) => setMonsterLevel(Number(event.target.value))} /></label>
              <label>Quantidade<input type="number" min={1} max={12} value={creatureCount} onChange={(event) => setCreatureCount(Number(event.target.value))} /></label>
              <label>Arquétipo<select value={cosmicArchetype} onChange={(event) => setCosmicArchetype(event.target.value as CosmicCreatureArchetype)}>{archetypeOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label>Origem cósmica<select value={cosmicOrigin} onChange={(event) => setCosmicOrigin(event.target.value as CosmicCreatureOrigin)}>{originOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label>Mutação corporal<select value={cosmicMutation} onChange={(event) => setCosmicMutation(event.target.value as CosmicCreatureMutation)}>{mutationOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label>Temperamento<select value={cosmicTemperament} onChange={(event) => setCosmicTemperament(event.target.value as CosmicCreatureTemperament)}>{temperamentOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            </> : <>
              <label>Origem da criatura<select value={creatureMode} onChange={(event) => { setCreatureMode(event.target.value as EncounterCreatureMode); setCreatureTemplateId(''); }}>{creatureModeOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label>Quantidade<input type="number" min={1} max={12} value={creatureCount} onChange={(event) => setCreatureCount(Number(event.target.value))} /></label>
              <label>ND desejado<input type="number" min={0.125} max={30} step={0.125} value={targetCr} onChange={(event) => setTargetCr(Number(event.target.value))} /></label>
              <label>Buscar criatura<input value={creatureSearch} onChange={(event) => setCreatureSearch(event.target.value)} placeholder="Nome, tipo ou ND" /></label>
              <label className="encounter-modal-wide">Criatura específica<select value={creatureTemplateId} onChange={(event) => setCreatureTemplateId(event.target.value)}><option value="">Escolher automaticamente</option>{filteredCreatures.map((creature) => <option key={creature.id} value={creature.id}>{creature.name} · ND {creature.challengeRating} · {creature.source}</option>)}</select></label>
            </>}

            <label>Nível médio do grupo<input type="number" min={1} max={20} value={averageLevel} onChange={(event) => setAverageLevel(Number(event.target.value))} /></label>
            <label>Quantidade de personagens<input type="number" min={1} max={12} value={partySize} onChange={(event) => setPartySize(Number(event.target.value))} /></label>
          </div>

          {generateCosmicCreature && <label className="checkbox-row compact-checkbox">
            <input type="checkbox" checked={saveGeneratedCreature} onChange={(event) => setSaveGeneratedCreature(event.target.checked)} />
            <span><strong>Salvar o monstro no catálogo da campanha</strong><small>A ficha poderá ser usada novamente em outros encontros.</small></span>
          </label>}

          <label>Orientação do mestre<textarea rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Ex.: a criatura protege uma mina, imita vozes e deve permitir uma saída sem combate" /></label>
          {error && <p className="global-error compact-error">{error}</p>}
          <footer className="encounter-modal-footer">
            <button type="button" className="ghost-button" disabled={busy} onClick={() => setModalOpen(false)}>Cancelar</button>
            <button className="primary-button" disabled={busy}>{busy ? 'Gerando criatura e encontro...' : generateCosmicCreature ? 'Gerar horror cósmico' : 'Gerar encontro'}</button>
          </footer>
        </form>
      </section>
    </div>,
    document.body
  ) : null;

  return <section className="sidebar-section encounter-panel">
    {modal}
    <div className="encounter-panel-header">
      <div><p className="eyebrow">Somente o mestre</p><h3>Encontros secretos</h3></div>
      <span className="status-badge status-explorado">Hex {hex.q}, {hex.r}</span>
    </div>
    <p className="helper-text">Nada é revelado aos jogadores até você narrar ou ativar o encontro.</p>
    {error && !modalOpen && <p className="global-error compact-error">{error}</p>}
    <button className="primary-button encounter-new-button" onClick={() => setModalOpen(true)}>Novo encontro ou monstro</button>

    <div className="catalog-status-card">
      <div><strong>Catálogo SRD</strong><small>{syncStatus?.catalogCount ?? 0} criaturas importadas</small></div>
      <button className="ghost-button mini-button" onClick={() => void syncSrd()} disabled={busy || syncStatus?.running}>{syncStatus?.running ? `${syncStatus.imported}/${syncStatus.total || '?'}` : 'Sincronizar SRD'}</button>
    </div>
    {syncStatus?.lastError && <small className="muted">A sincronização online falhou; criaturas cósmicas originais continuam disponíveis.</small>}

    <details className="custom-creature-box">
      <summary>Cadastrar ficha manual em JSON</summary>
      <form className="form-stack compact-form" onSubmit={createCustomCreature}>
        <label>Nome<input value={customName} onChange={(event) => setCustomName(event.target.value)} required /></label>
        <label>Ficha em JSON<textarea className="json-editor" rows={12} value={customJson} onChange={(event) => setCustomJson(event.target.value)} required /></label>
        <button className="ghost-button" disabled={busy}>Salvar criatura personalizada</button>
      </form>
    </details>

    <details className="custom-creature-box">
      <summary>Importar catálogo JSON</summary>
      <form className="form-stack compact-form" onSubmit={importCustomCreatures}>
        <p className="helper-text">Aceita até 1.000 fichas no formato <code>[{`{ name, statBlock }`}]</code>.</p>
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
  const appearance = creature.appearanceProfile;
  return <article className="creature-stat-card">
    <header><div><p className="eyebrow">{creature.size} {creature.type} · {creature.alignment}</p><h2>{creature.name}</h2></div><span>ND {creature.challengeLabel}</span></header>
    {creature.cosmicConcept && <p className="cosmic-concept">{creature.cosmicConcept}</p>}
    <p className="creature-narration">{creature.narration}</p>
    {appearance && <section className="creature-appearance-grid">
      <AppearanceItem label="Silhueta" value={appearance.silhouette} />
      <AppearanceItem label="Anatomia" value={appearance.anatomy} />
      <AppearanceItem label="Superfície" value={appearance.surface} />
      <AppearanceItem label="Movimento" value={appearance.movement} />
      <AppearanceItem label="Rosto" value={appearance.face} />
      <AppearanceItem label="Aura" value={appearance.aura} />
      <AppearanceItem label="Som" value={appearance.voice} />
      <AppearanceItem label="Odor" value={appearance.odor} />
    </section>}
    {creature.originStory && <section className="secret-box"><strong>Origem cósmica</strong><p>{creature.originStory}</p></section>}
    {(creature.cosmicMutation || creature.cosmicTemperament || creature.portalConnection) && <section className="cosmic-metadata-grid">
      {creature.cosmicMutation && <AppearanceItem label="Mutação" value={formatEnum(creature.cosmicMutation)} />}
      {creature.cosmicTemperament && <AppearanceItem label="Temperamento" value={formatEnum(creature.cosmicTemperament)} />}
      {creature.portalConnection && <AppearanceItem label="Ligação com o portal" value={creature.portalConnection} />}
    </section>}
    <dl className="stat-summary"><div><dt>CA</dt><dd>{creature.armorClass}</dd></div><div><dt>PV</dt><dd>{creature.hitPoints} ({creature.hitDice})</dd></div><div><dt>Deslocamento</dt><dd>{speeds || '—'}</dd></div><div><dt>PB</dt><dd>+{creature.proficiencyBonus}</dd></div></dl>
    <div className="ability-grid">{Object.entries(creature.abilities).map(([ability, value]) => <div key={ability}><strong>{ability.toUpperCase()}</strong><span>{value} ({modifier(value)})</span></div>)}</div>
    <CompactLine label="Vulnerabilidades" values={creature.damageVulnerabilities} />
    <CompactLine label="Resistências" values={creature.damageResistances} />
    <CompactLine label="Imunidades" values={creature.damageImmunities} />
    <CompactLine label="Imunidades a condições" values={creature.conditionImmunities} />
    <CompactLine label="Sentidos" values={creature.senses} />
    <CompactLine label="Idiomas" values={creature.languages} />
    {creature.traits.map((trait) => <section key={trait.name} className="stat-feature"><strong>{trait.name}.</strong> <span>{trait.description}</span></section>)}
    <ActionSection title="Ações" actions={creature.actions} />
    <ActionSection title="Ações bônus" actions={creature.bonusActions} />
    <ActionSection title="Reações" actions={creature.reactions} />
    <ActionSection title="Ações lendárias" actions={creature.legendaryActions} />
    {Boolean(creature.combatPhases?.length) && <div className="stat-section"><h3>Fases do confronto</h3>{creature.combatPhases?.map((phase) => <section key={phase.name} className="stat-feature"><strong>{phase.name} — {phase.trigger}</strong><span>{phase.effect}</span></section>)}</div>}
    <div className="creature-master-notes"><p><strong>Comportamento:</strong> {creature.behavior}</p><p><strong>Tática:</strong> {creature.tactics}</p><p><strong>Fraqueza:</strong> {creature.weakness}</p><p><strong>Sinais:</strong> {creature.signs.join(' ')}</p><p><strong>Recompensas:</strong> {creature.rewards.join(', ')}</p></div>
    {creature.license && <small className="license-note">{creature.license}</small>}
  </article>;
}

function ActionSection({ title, actions }: { title: string; actions: CreatureStatBlock['actions'] }) {
  if (!actions.length) return null;
  return <div className="stat-section"><h3>{title}</h3>{actions.map((action) => <section key={action.name} className="stat-feature"><strong>{action.name}{action.recharge ? ` (${action.recharge})` : ''}.</strong> <span>{action.description}</span>{action.damage && <small>Dano: {action.damage} {action.damageType ?? ''}</small>}</section>)}</div>;
}

function AppearanceItem({ label, value }: { label: string; value: string }) {
  return <div><strong>{label}</strong><span>{value}</span></div>;
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
    source: 'CUSTOM', theme: 'COSMIC', size: 'Médio', type: 'Aberração cósmica', alignment: 'Além de alinhamento',
    armorClass: 14, hitPoints: 45, hitDice: '6d8 + 18', speed: { walk: '9 m' },
    abilities: { str: 16, dex: 12, con: 16, int: 10, wis: 14, cha: 12 }, savingThrows: {}, skills: {},
    damageVulnerabilities: [], damageResistances: ['psíquico'], damageImmunities: [], conditionImmunities: ['Amedrontado'],
    senses: ['visão no escuro 36 m', 'Percepção passiva 14'], languages: ['telepatia 36 m'], challengeRating: 3,
    challengeLabel: '3', experiencePoints: 700, proficiencyBonus: 2,
    traits: [{ name: 'Anatomia Não Euclidiana', description: 'A criatura atravessa espaços ocupados e altera a percepção de distância.' }],
    actions: [{ name: 'Garra do Intervalo', description: 'Ataque corpo a corpo. Em um acerto, causa dano cortante e psíquico.', attackBonus: 5, damage: '2d8 + 3', damageType: 'cortante e psíquico' }],
    bonusActions: [], reactions: [], legendaryActions: [], description: 'Descrição detalhada da criatura.',
    narration: 'Texto pronto para narrar quando ela aparece.', signs: ['sombras voltadas para a direção errada'], behavior: 'Observa antes de atacar.',
    tactics: 'Separa alvos e explora terreno difícil.', weakness: 'Símbolos de contenção.', rewards: ['núcleo impossível']
  }, null, 2);
}

function defaultBulkCreatureJson() {
  const example = JSON.parse(defaultCustomCreatureJson()) as CreatureStatBlock;
  return JSON.stringify([{ name: 'Criatura de exemplo', statBlock: example }], null, 2);
}
