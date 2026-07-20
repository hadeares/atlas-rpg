'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { clearSession, readSession } from '@/lib/auth';
import {
  AuthSession,
  Campaign,
  CampaignLiveState,
  CampaignMember,
  DiscoveryStatus,
  ExploreResult,
  HexData,
  HexLore,
  MoveResult,
  VisitState
} from '@/lib/types';
import { HexMap } from './hex-map';
import { EncountersPanel } from './encounters-panel';

const periodLabels: Record<string, string> = {
  MANHA: 'Manhã',
  TARDE: 'Tarde',
  ANOITECER: 'Anoitecer',
  NOITE: 'Noite'
};

const discoveryLabels: Record<DiscoveryStatus, string> = {
  DESCONHECIDO: 'Desconhecido',
  AVISTADO: 'Avistado',
  ATRAVESSADO: 'Atravessado',
  EXPLORADO: 'Explorado',
  MAPEADO: 'Mapeado'
};

const discoveryOrder: DiscoveryStatus[] = ['DESCONHECIDO', 'AVISTADO', 'ATRAVESSADO', 'EXPLORADO', 'MAPEADO'];
type LoreTab = 'RESUMO' | 'NARRACAO' | 'LOCAIS' | 'RECURSOS' | 'RUMORES' | 'FAUNA' | 'AMEACAS' | 'HISTORIA' | 'HORROR' | 'ENCONTROS' | 'MESTRE' | 'MEMBROS';

export function CampaignView({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [hexes, setHexes] = useState<HexData[]>([]);
  const [selectedHex, setSelectedHex] = useState<HexData | null>(null);
  const [members, setMembers] = useState<CampaignMember[]>([]);
  const [activeTab, setActiveTab] = useState<LoreTab>('RESUMO');
  const [publicName, setPublicName] = useState('');
  const [masterNotes, setMasterNotes] = useState('');
  const [loreTitle, setLoreTitle] = useState('');
  const [loreOverview, setLoreOverview] = useState('');
  const [loreHistory, setLoreHistory] = useState('');
  const [lorePlayerSummary, setLorePlayerSummary] = useState('');
  const [loreSecrets, setLoreSecrets] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState<'MASTER' | 'PLAYER'>('PLAYER');
  const [visit, setVisit] = useState<VisitState | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [session, setSession] = useState<AuthSession | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const selectionRequestId = useRef(0);
  const hexDetailCache = useRef(new Map<string, HexData>());
  const campaignVersionRef = useRef<number | null>(null);
  const liveRefreshInFlight = useRef(false);

  const isMaster = campaign?.accessRole === 'MASTER';
  const isPlayerView = campaign?.accessRole === 'PLAYER';

  useEffect(() => {
    const currentSession = readSession();
    setSession(currentSession);
    setAuthReady(true);

    if (!currentSession) {
      router.replace('/login');
      return;
    }

    void loadCampaign();
  }, [campaignId, router]);

  useEffect(() => {
    campaignVersionRef.current = campaign?.version ?? null;
  }, [campaign?.version]);

  useEffect(() => {
    if (!authReady || campaign?.accessRole !== 'PLAYER') return;

    let disposed = false;

    const refreshIfChanged = async () => {
      if (disposed || liveRefreshInFlight.current || document.hidden) return;
      liveRefreshInFlight.current = true;
      try {
        const liveState = await apiRequest<CampaignLiveState>(`/campaigns/${campaignId}/live-state`);
        if (disposed || liveState.version === campaignVersionRef.current) return;
        await refreshPlayerCampaign(liveState);
      } catch {
      } finally {
        liveRefreshInFlight.current = false;
      }
    };

    const handleVisibility = () => {
      if (!document.hidden) void refreshIfChanged();
    };

    const interval = window.setInterval(() => void refreshIfChanged(), 1500);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      disposed = true;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [authReady, campaign?.accessRole, campaignId]);

  useEffect(() => {
    setPublicName(selectedHex?.publicName ?? '');
    setMasterNotes(selectedHex?.masterNotes ?? '');
    const lore = getLore(selectedHex);
    setLoreTitle(lore?.title ?? '');
    setLoreOverview(lore?.overview ?? '');
    setLoreHistory(lore?.history ?? '');
    setLorePlayerSummary(lore?.playerSummary ?? lore?.overview ?? '');
    setLoreSecrets(lore?.secrets ?? lore?.masterGuide?.hiddenTruth ?? '');
  }, [selectedHex]);

  const discoveredCount = useMemo(
    () => hexes.filter((hex) => hex.discoveryStatus !== 'DESCONHECIDO').length,
    [hexes]
  );

  const selectedLore = getLore(selectedHex);
  const canMove = Boolean(
    isMaster && campaign && selectedHex && hexDistance(campaign.currentQ, campaign.currentR, selectedHex.q, selectedHex.r) === 1
  );
  const isCurrentHex = Boolean(campaign && selectedHex && campaign.currentQ === selectedHex.q && campaign.currentR === selectedHex.r);

  async function loadCampaign() {
    setLoading(true);
    setError('');
    try {
      const [campaignData, mapHexes] = await Promise.all([
        apiRequest<Campaign>(`/campaigns/${campaignId}`),
        apiRequest<HexData[]>(`/campaigns/${campaignId}/hexes`)
      ]);
      campaignVersionRef.current = campaignData.version;
      setCampaign(campaignData);
      setHexes(mapHexes);
      const currentSummary = mapHexes.find((hex) => hex.q === campaignData.currentQ && hex.r === campaignData.currentR) ?? mapHexes[0] ?? null;
      if (currentSummary) {
        const detail = await apiRequest<HexData>(`/campaigns/${campaignId}/hexes/${currentSummary.q}/${currentSummary.r}`);
        hexDetailCache.current.set(detail.id, detail);
        setSelectedHex(detail);
      }
      if (campaignData.accessRole === 'MASTER') {
        setMembers(await apiRequest<CampaignMember[]>(`/campaigns/${campaignId}/members`));
      }
    } catch (caughtError) {
      setError(readError(caughtError));
    } finally {
      setLoading(false);
    }
  }

  async function refreshPlayerCampaign(liveState: CampaignLiveState) {
    const [campaignData, mapHexes] = await Promise.all([
      apiRequest<Campaign>(`/campaigns/${campaignId}`),
      apiRequest<HexData[]>(`/campaigns/${campaignId}/hexes`)
    ]);

    if (campaignData.version < liveState.version) return;

    hexDetailCache.current.clear();
    const currentSummary = mapHexes.find(
      (hex) => hex.q === campaignData.currentQ && hex.r === campaignData.currentR
    ) ?? null;
    const currentDetail = currentSummary
      ? await apiRequest<HexData>(`/campaigns/${campaignId}/hexes/${currentSummary.q}/${currentSummary.r}`)
      : null;

    campaignVersionRef.current = campaignData.version;
    setCampaign(campaignData);
    setHexes(mapHexes);
    if (currentDetail) {
      selectionRequestId.current += 1;
      hexDetailCache.current.set(currentDetail.id, currentDetail);
      setDetailLoading(false);
      setSelectedHex(currentDetail);
    }
  }

  const selectHex = useCallback(async (hex: HexData) => {
    const cached = hexDetailCache.current.get(hex.id);
    if (cached) {
      selectionRequestId.current += 1;
      setDetailLoading(false);
      setSelectedHex(cached);
      return;
    }

    const requestId = selectionRequestId.current + 1;
    selectionRequestId.current = requestId;
    setSelectedHex(hex);
    setDetailLoading(true);
    setError('');
    try {
      const detail = await apiRequest<HexData>(`/campaigns/${campaignId}/hexes/${hex.q}/${hex.r}`);
      hexDetailCache.current.set(detail.id, detail);
      if (selectionRequestId.current === requestId) setSelectedHex(detail);
    } catch (caughtError) {
      if (selectionRequestId.current === requestId) setError(readError(caughtError));
    } finally {
      if (selectionRequestId.current === requestId) setDetailLoading(false);
    }
  }, [campaignId]);

  function updateHexes(changedHexes: HexData[]) {
    for (const changedHex of changedHexes) {
      if (getLore(changedHex)) hexDetailCache.current.set(changedHex.id, changedHex);
    }
    const changedById = new Map(changedHexes.map((hex) => [hex.id, hex]));
    setHexes((current) => current.map((hex) => {
      const changed = changedById.get(hex.id);
      if (!changed) return hex;
      return {
        ...hex,
        ...changed,
        state: {
          ...hex.state,
          hasLore: Boolean(changed.state.lore || changed.state.publicLore || changed.state.hasLore),
          lastVisit: changed.state.lastVisit ?? hex.state.lastVisit
        }
      };
    }));
    setSelectedHex((current) => current ? changedById.get(current.id) ?? current : current);
  }

  async function advancePeriod() {
    if (!isMaster) return;
    setBusy(true);
    setError('');
    try {
      const updated = await apiRequest<Campaign>(`/campaigns/${campaignId}/time/advance`, {
        method: 'POST',
        body: JSON.stringify({ steps: 1 })
      });
      setCampaign((current) => current ? { ...current, ...updated } : updated);
    } catch (caughtError) {
      setError(readError(caughtError));
    } finally {
      setBusy(false);
    }
  }

  async function moveParty() {
    if (!selectedHex || !canMove) return;
    setBusy(true);
    setError('');
    try {
      const result = await apiRequest<MoveResult>(`/campaigns/${campaignId}/travel/move`, {
        method: 'POST',
        body: JSON.stringify({ q: selectedHex.q, r: selectedHex.r })
      });
      setCampaign((current) => current ? { ...current, ...result.campaign } : result.campaign);
      updateHexes(result.changedHexes);
      selectionRequestId.current += 1;
      setDetailLoading(false);
      setSelectedHex(result.destination);
      setVisit(result.visit);
      setActiveTab('NARRACAO');
    } catch (caughtError) {
      setError(readError(caughtError));
    } finally {
      setBusy(false);
    }
  }

  async function exploreCurrentHex() {
    if (!isMaster || !isCurrentHex) return;
    setBusy(true);
    setError('');
    try {
      const result = await apiRequest<ExploreResult>(`/campaigns/${campaignId}/travel/explore`, { method: 'POST' });
      setCampaign((current) => current ? { ...current, ...result.campaign } : result.campaign);
      updateHexes([result.hex]);
      selectionRequestId.current += 1;
      setDetailLoading(false);
      setSelectedHex(result.hex);
      setActiveTab('LOCAIS');
    } catch (caughtError) {
      setError(readError(caughtError));
    } finally {
      setBusy(false);
    }
  }

  async function saveHex(status?: DiscoveryStatus) {
    if (!selectedHex || !isMaster) return;
    setBusy(true);
    setError('');
    try {
      const updated = await apiRequest<HexData>(`/campaigns/${campaignId}/hexes/${selectedHex.q}/${selectedHex.r}`, {
        method: 'PATCH',
        body: JSON.stringify({ discoveryStatus: status ?? selectedHex.discoveryStatus, publicName, masterNotes })
      });
      updateHexes([updated]);
      setSelectedHex(updated);
    } catch (caughtError) {
      setError(readError(caughtError));
    } finally {
      setBusy(false);
    }
  }

  async function saveLore() {
    if (!selectedHex || !isMaster) return;
    setBusy(true);
    setError('');
    try {
      const updated = await apiRequest<HexData>(`/campaigns/${campaignId}/hexes/${selectedHex.q}/${selectedHex.r}/lore`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: loreTitle,
          overview: loreOverview,
          history: loreHistory,
          playerSummary: lorePlayerSummary,
          secrets: loreSecrets
        })
      });
      updateHexes([updated]);
      setSelectedHex(updated);
    } catch (caughtError) {
      setError(readError(caughtError));
    } finally {
      setBusy(false);
    }
  }

  async function regenerateLore() {
    if (!selectedHex || !isMaster) return;
    if (!window.confirm('Regenerar toda a lore deste hexágono? As edições narrativas serão substituídas.')) return;
    setBusy(true);
    setError('');
    try {
      const updated = await apiRequest<HexData>(`/campaigns/${campaignId}/hexes/${selectedHex.q}/${selectedHex.r}/lore/regenerate`, { method: 'POST' });
      updateHexes([updated]);
      setSelectedHex(updated);
    } catch (caughtError) {
      setError(readError(caughtError));
    } finally {
      setBusy(false);
    }
  }

  async function addMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await apiRequest(`/campaigns/${campaignId}/members`, {
        method: 'POST',
        body: JSON.stringify({ email: memberEmail, role: memberRole })
      });
      setMemberEmail('');
      setMembers(await apiRequest<CampaignMember[]>(`/campaigns/${campaignId}/members`));
    } catch (caughtError) {
      setError(readError(caughtError));
    } finally {
      setBusy(false);
    }
  }

  async function changeMemberRole(member: CampaignMember, role: 'MASTER' | 'PLAYER') {
    setBusy(true);
    setError('');
    try {
      const updated = await apiRequest<CampaignMember>(`/campaigns/${campaignId}/members/${member.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ role })
      });
      setMembers((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (caughtError) {
      setError(readError(caughtError));
    } finally {
      setBusy(false);
    }
  }

  async function removeMember(member: CampaignMember) {
    if (!window.confirm(`Remover ${member.displayName} da campanha?`)) return;
    setBusy(true);
    setError('');
    try {
      await apiRequest(`/campaigns/${campaignId}/members/${member.id}`, { method: 'DELETE' });
      setMembers((current) => current.filter((item) => item.id !== member.id));
    } catch (caughtError) {
      setError(readError(caughtError));
    } finally {
      setBusy(false);
    }
  }

  async function copyNarration(text?: string) {
    if (!text) return;
    await navigator.clipboard.writeText(text);
  }

  function logout() {
    clearSession();
    setSession(null);
    router.replace('/login');
  }

  if (!authReady) {
    return <main className="loading-shell"><div className="loading-card"><div className="spinner" /><p>Validando sessão...</p></div></main>;
  }

  if (loading) {
    return <main className="loading-shell"><div className="loading-card"><div className="spinner" /><p>Carregando o atlas...</p></div></main>;
  }

  if (!campaign) {
    return <main className="loading-shell"><div className="loading-card"><p>{error || 'Campanha não encontrada.'}</p><Link href="/campaigns">Voltar</Link></div></main>;
  }

  const tabs: LoreTab[] = ['RESUMO', 'NARRACAO', 'LOCAIS', 'RECURSOS', 'RUMORES', 'FAUNA', 'AMEACAS', 'HISTORIA', 'HORROR'];
  if (isMaster) tabs.push('ENCONTROS', 'MESTRE', 'MEMBROS');

  return (
    <main className={`campaign-shell${isPlayerView ? ' player-view-shell' : ''}`}>
      <header className="campaign-topbar">
        <div className="campaign-title-area">
          <Link className="back-link" href="/campaigns">← Campanhas</Link>
          <div>
            <p className="eyebrow">{isPlayerView ? 'Visão dos jogadores' : 'Mesa do mestre'}</p>
            <h1>{campaign.name}</h1>
          </div>
        </div>
        <div className="time-controls">
          <div className="time-display"><span>Dia</span><strong>{campaign.currentDay}</strong></div>
          <div className="time-display"><span>Período</span><strong>{periodLabels[campaign.currentPeriod]}</strong></div>
          {isMaster && <button className="primary-button compact-button" onClick={() => void advancePeriod()} disabled={busy}>Avançar período</button>}
          {session?.user.role === 'ADMIN' && <Link className="ghost-button button-link" href="/users">Usuários</Link>}
          <button className="ghost-button" onClick={logout}>Sair</button>
        </div>
      </header>

      {error && <p className="global-error">{error}</p>}
      {visit && (
        <section className="visit-banner">
          <div>
            <p className="eyebrow">Resultado da travessia</p>
            <h3>{visit.encounter?.title ?? 'Travessia concluída'}</h3>
            <p>{visit.description || visit.encounter?.text || 'O grupo concluiu a travessia.'}</p>
            {visit.consequence && isMaster && <small className="secret-line">Consequência: {visit.consequence}</small>}
          </div>
          <div className="visit-tags">{visit.weather && <span>{visit.weather}</span>}{visit.visibility && <span>Visibilidade {visit.visibility.toLowerCase()}</span>}</div>
          <button className="ghost-button" onClick={() => setVisit(null)}>Fechar</button>
        </section>
      )}

      <section className="campaign-layout">
        <aside className="campaign-sidebar left-sidebar">
          <section className="sidebar-section">
            <p className="eyebrow">Expedição</p>
            <dl className="info-list">
              <div><dt>Posição</dt><dd>{campaign.currentQ}, {campaign.currentR}</dd></div>
              <div><dt>Conhecidos</dt><dd>{isPlayerView ? discoveredCount : `${discoveredCount}/${hexes.length}`}</dd></div>
              <div><dt>Participantes</dt><dd>{campaign.memberCount}</dd></div>
              <div><dt>Acesso</dt><dd>{isMaster ? 'Mestre' : 'Jogador'}</dd></div>
            </dl>
          </section>

          {isMaster && selectedHex && (
            <section className="sidebar-section action-stack">
              <p className="eyebrow">Ações</p>
              <button className="primary-button" onClick={() => void moveParty()} disabled={!canMove || busy}>Mover grupo para cá</button>
              <button className="ghost-button" onClick={() => void exploreCurrentHex()} disabled={!isCurrentHex || busy}>Explorar hexágono atual</button>
              <button className="ghost-button" onClick={() => setActiveTab('ENCONTROS')} disabled={busy}>Gerar encontro secreto</button>
              {!canMove && !isCurrentHex && <p className="helper-text">Escolha um hexágono adjacente à posição do grupo.</p>}
            </section>
          )}

          <section className="sidebar-section">
            <p className="eyebrow">Legenda</p>
            <div className="legend-list">
              {isMaster && <Legend color="#383d3f" label="Não percorrido" />}
              <Legend color="#7b8063" label="Planície conhecida" />
              <Legend color="#425d48" label="Floresta" />
              <Legend color="#67666c" label="Montanha" />
              <Legend color="#495b55" label="Pântano" />
              <Legend color="#6c5a58" label="Ruínas" />
              <Legend color="#57435e" label="Contaminado" />
            </div>
          </section>
        </aside>

        <section className="map-panel">
          <div className="map-toolbar">
            <div><p className="eyebrow">Mapa persistente</p><h2>{isPlayerView ? 'Terras conhecidas' : 'Região completa'}</h2></div>
            <div className="map-toolbar-status">
              {isPlayerView && <span className="live-sync-indicator"><i /> Atualização automática</span>}
              <span className="map-hint">Clique para selecionar. Arraste para mover. Use a roda para ampliar.</span>
            </div>
          </div>
          <HexMap
            hexes={hexes}
            selectedHex={selectedHex}
            currentQ={campaign.currentQ}
            currentR={campaign.currentR}
            playerView={isPlayerView}
            onSelect={(hex) => void selectHex(hex)}
          />
        </section>

        <aside className="campaign-sidebar right-sidebar lore-sidebar">
          {selectedHex ? (
            <>
              <section className="sidebar-section hex-header">
                <p className="eyebrow">Hexágono {selectedHex.q}, {selectedHex.r}</p>
                <h2>{selectedHex.publicName || selectedLore?.title || (selectedHex.biome === 'DESCONHECIDO' ? 'Território desconhecido' : formatEnum(selectedHex.biome))}</h2>
                <span className={`status-badge status-${selectedHex.discoveryStatus.toLowerCase()}`}>{discoveryLabels[selectedHex.discoveryStatus]}</span>
                {detailLoading && <small className="muted">Carregando detalhes...</small>}
              </section>

              {selectedHex.discoveryStatus === 'DESCONHECIDO' && isPlayerView ? (
                <section className="sidebar-section unknown-panel"><h3>Névoa de guerra</h3><p>O grupo ainda não possui informações confiáveis sobre este lugar.</p></section>
              ) : (
                <>
                  <nav className="lore-tabs">
                    {tabs.map((tab) => <button key={tab} className={activeTab === tab ? 'active' : ''} onClick={() => setActiveTab(tab)}>{tabLabel(tab)}</button>)}
                  </nav>

                  {activeTab === 'RESUMO' && <SummaryTab lore={selectedLore} hex={selectedHex} isMaster={Boolean(isMaster)} />}
                  {activeTab === 'NARRACAO' && <NarrationTab lore={selectedLore} onCopy={copyNarration} />}
                  {activeTab === 'LOCAIS' && <LocationsTab lore={selectedLore} isMaster={Boolean(isMaster)} />}
                  {activeTab === 'RECURSOS' && <ResourcesTab lore={selectedLore} isMaster={Boolean(isMaster)} />}
                  {activeTab === 'RUMORES' && <RumorsTab lore={selectedLore} isMaster={Boolean(isMaster)} />}
                  {activeTab === 'FAUNA' && <NatureTab lore={selectedLore} isMaster={Boolean(isMaster)} />}
                  {activeTab === 'AMEACAS' && <ThreatsTab lore={selectedLore} isMaster={Boolean(isMaster)} />}
                  {activeTab === 'HISTORIA' && <HistoryTab lore={selectedLore} isMaster={Boolean(isMaster)} />}
                  {activeTab === 'HORROR' && <HorrorTab lore={selectedLore} isMaster={Boolean(isMaster)} />}
                  {activeTab === 'ENCONTROS' && isMaster && <EncountersPanel campaignId={campaignId} hex={selectedHex} />}
                  {activeTab === 'MESTRE' && isMaster && <MasterTab lore={selectedLore} masterNotes={selectedHex.masterNotes} />}
                  {activeTab === 'MEMBROS' && isMaster && (
                    <section className="sidebar-section member-panel">
                      <p className="helper-text">Qualquer pessoa pode criar uma conta em “Criar conta”. Depois, adicione o e-mail aqui como jogador ou mestre.</p>
                      <form className="form-stack" onSubmit={addMember}>
                        <label>E-mail do usuário<input type="email" value={memberEmail} onChange={(event) => setMemberEmail(event.target.value)} required /></label>
                        <label>Função<select value={memberRole} onChange={(event) => setMemberRole(event.target.value as 'MASTER' | 'PLAYER')}><option value="PLAYER">Jogador</option><option value="MASTER">Mestre</option></select></label>
                        <button className="primary-button" disabled={busy}>Adicionar à campanha</button>
                      </form>
                      <div className="member-list">
                        {members.map((member) => (
                          <article className="member-card" key={member.id}>
                            <div><strong>{member.displayName}</strong><small>{member.email}</small></div>
                            <select value={member.role} disabled={member.userId === campaign.ownerId || busy} onChange={(event) => void changeMemberRole(member, event.target.value as 'MASTER' | 'PLAYER')}><option value="PLAYER">Jogador</option><option value="MASTER">Mestre</option></select>
                            {member.userId !== campaign.ownerId && <button className="danger-button" onClick={() => void removeMember(member)} disabled={busy}>Remover</button>}
                          </article>
                        ))}
                      </div>
                    </section>
                  )}

                  {isMaster && activeTab !== 'MEMBROS' && activeTab !== 'ENCONTROS' && (
                    <section className="sidebar-section editor-panel">
                      <details>
                        <summary>Editar dados e lore</summary>
                        <div className="form-stack compact-form">
                          <label>Nome público<input value={publicName} onChange={(event) => setPublicName(event.target.value)} /></label>
                          <label>Notas do mestre<textarea value={masterNotes} onChange={(event) => setMasterNotes(event.target.value)} rows={4} /></label>
                          <div className="status-grid">{discoveryOrder.map((status) => <button key={status} className={selectedHex.discoveryStatus === status ? 'status-button active' : 'status-button'} onClick={() => void saveHex(status)} disabled={busy}>{discoveryLabels[status]}</button>)}</div>
                          <button className="primary-button" onClick={() => void saveHex()} disabled={busy}>Salvar hexágono</button>
                          <hr />
                          <label>Título da lore<input value={loreTitle} onChange={(event) => setLoreTitle(event.target.value)} /></label>
                          <label>Resumo<textarea value={loreOverview} onChange={(event) => setLoreOverview(event.target.value)} rows={5} /></label>
                          <label>História<textarea value={loreHistory} onChange={(event) => setLoreHistory(event.target.value)} rows={5} /></label>
                          <label>Resumo para jogadores<textarea value={lorePlayerSummary} onChange={(event) => setLorePlayerSummary(event.target.value)} rows={4} /></label>
                          <label>Segredo central<textarea value={loreSecrets} onChange={(event) => setLoreSecrets(event.target.value)} rows={5} /></label>
                          <button className="primary-button" onClick={() => void saveLore()} disabled={busy}>Salvar lore</button>
                          <button className="ghost-button" onClick={() => void regenerateLore()} disabled={busy}>Regenerar lore completa</button>
                        </div>
                      </details>
                    </section>
                  )}
                </>
              )}
            </>
          ) : <section className="sidebar-section"><p className="muted">Selecione um hexágono.</p></section>}
        </aside>
      </section>
    </main>
  );
}

function SummaryTab({ lore, hex, isMaster }: { lore?: HexLore; hex: HexData; isMaster: boolean }) {
  return <section className="sidebar-section lore-content">
    <p>{lore?.overview || 'Nenhuma informação revelada.'}</p>
    {lore?.atmosphere && <blockquote>{lore.atmosphere}</blockquote>}
    {lore?.landmark && <LoreCard title={lore.landmark.name} text={lore.landmark.description} />}
    {hex.state.lastVisit && <LoreCard title="Última visita" text={hex.state.lastVisit.description} secret={isMaster ? hex.state.lastVisit.consequence : undefined} />}
    <dl className="info-list two-column-info">
      <div><dt>Terreno</dt><dd>{formatEnum(hex.terrain)}</dd></div>
      <div><dt>Bioma</dt><dd>{formatEnum(hex.biome)}</dd></div>
      <div><dt>Perigo</dt><dd>{hex.dangerLevel || '?'}/10</dd></div>
      {isMaster && <div><dt>Influência</dt><dd>{hex.cosmicInfluence}%</dd></div>}
    </dl>
    {lore?.sensoryDetails && <div className="sensory-grid">
      <LoreCard title="O que se vê" text={lore.sensoryDetails.sights.join(' ')} />
      <LoreCard title="O que se ouve" text={lore.sensoryDetails.sounds.join(' ')} />
      <LoreCard title="Cheiros" text={lore.sensoryDetails.smells.join(' ')} />
    </div>}
  </section>;
}

function NarrationTab({ lore, onCopy }: { lore?: HexLore; onCopy: (text?: string) => Promise<void> }) {
  const blocks = [
    ['Ao se aproximar', lore?.narration?.approach],
    ['Ao entrar', lore?.narration?.arrival],
    ['Durante a travessia', lore?.narration?.crossing],
    ['Durante a exploração', lore?.narration?.exploration],
    ['Durante a noite', lore?.narration?.night],
    ['Ao encontrar o marco', lore?.narration?.landmarkDiscovery]
  ] as const;
  return <section className="sidebar-section lore-list">
    {blocks.filter(([, text]) => Boolean(text)).map(([title, text]) => <article className="lore-card narration-card" key={title}><div className="card-title-row"><h3>{title}</h3><button className="ghost-button mini-button" onClick={() => void onCopy(text)}>Copiar</button></div><p>{text}</p></article>)}
    {blocks.every(([, text]) => !text) && <p className="muted">Esta narração ainda não foi revelada.</p>}
  </section>;
}

function LocationsTab({ lore, isMaster }: { lore?: HexLore; isMaster: boolean }) {
  return <section className="sidebar-section lore-list">
    {(lore?.features ?? []).map((feature) => <LoreCard key={feature.name} title={`${feature.name} · ${formatEnum(feature.type)}`} text={`${feature.playerDescription}${feature.interaction ? ` ${feature.interaction}` : ''}`} secret={isMaster ? `${feature.masterDetails ?? ''} ${feature.suggestedCheck ?? ''}`.trim() : undefined} />)}
    {(lore?.routes ?? []).map((route) => <LoreCard key={route.name} title={route.name} text={`${route.description}${route.advantage ? ` Vantagem: ${route.advantage}` : ''}`} secret={isMaster ? route.danger : undefined} />)}
    {(lore?.inhabitants ?? []).map((npc) => <LoreCard key={npc.name} title={`${npc.name} · ${npc.role}`} text={`${npc.appearance} ${npc.manner}${npc.offer ? ` Pode oferecer: ${npc.offer}` : ''}`} secret={isMaster ? `${npc.desire ?? ''} ${npc.secret ?? ''}`.trim() : undefined} />)}
    {(lore?.features ?? []).length === 0 && <p className="muted">Nenhum local foi descoberto.</p>}
  </section>;
}

function ResourcesTab({ lore, isMaster }: { lore?: HexLore; isMaster: boolean }) {
  return <section className="sidebar-section lore-list">
    {(lore?.resources ?? []).map((resource) => <LoreCard key={resource.name} title={`${resource.name} · ${formatEnum(resource.category)}`} text={`${resource.availability ? `Disponibilidade ${formatEnum(resource.availability)}. ` : ''}${resource.access ?? ''}`} secret={isMaster ? resource.complication : undefined} />)}
    {lore?.weatherProfile && <LoreCard title="Clima local" text={`Condições comuns: ${lore.weatherProfile.common.join(', ')}.${lore.weatherProfile.clearSign ? ` Sinal de melhora: ${lore.weatherProfile.clearSign}` : ''}`} secret={isMaster ? `${lore.weatherProfile.hazard ?? ''} ${lore.weatherProfile.stormSign ?? ''}`.trim() : undefined} />}
    {(lore?.resources ?? []).length === 0 && <p className="muted">Os recursos ainda não foram avaliados.</p>}
  </section>;
}

function RumorsTab({ lore, isMaster }: { lore?: HexLore; isMaster: boolean }) {
  return <section className="sidebar-section lore-list">
    {(lore?.rumors ?? []).map((item, index) => <LoreCard key={`${item.source}-${index}`} title={item.source} text={item.text} secret={isMaster ? `${item.reliability ?? ''}. ${item.truth ?? ''}` : undefined} />)}
    {(lore?.legends ?? []).map((item) => <LoreCard key={item.title} title={item.title} text={item.text} secret={isMaster ? item.truth : undefined} />)}
    {(lore?.rumors ?? []).length === 0 && <p className="muted">Nenhum rumor conhecido.</p>}
  </section>;
}

function NatureTab({ lore, isMaster }: { lore?: HexLore; isMaster: boolean }) {
  return <section className="sidebar-section lore-list">
    {(lore?.fauna ?? []).map((item) => <LoreCard key={item.name} title={`${item.name}${item.abundance ? ` · ${formatEnum(item.abundance)}` : ''}`} text={`${item.behavior}${item.signs ? ` Sinais: ${item.signs}` : ''}${item.resource ? ` Uso: ${item.resource}` : ''}`} />)}
    {(lore?.flora ?? []).map((item) => <LoreCard key={item.name} title={`${item.name}${item.abundance ? ` · ${formatEnum(item.abundance)}` : ''}`} text={`${item.appearance}${item.use ? ` Uso: ${item.use}` : ''}`} secret={isMaster ? item.risk : undefined} />)}
    {(lore?.fauna ?? []).length === 0 && (lore?.flora ?? []).length === 0 && <p className="muted">A fauna e a flora ainda não foram observadas.</p>}
  </section>;
}

function ThreatsTab({ lore, isMaster }: { lore?: HexLore; isMaster: boolean }) {
  const threats = lore?.monsters ?? lore?.knownThreats ?? [];
  return <section className="sidebar-section lore-list">
    {threats.map((item) => <LoreCard key={item.name} title={`${item.name} · ameaça ${item.threat}`} text={`${item.appearance ? `${item.appearance} ` : ''}${item.signs} ${item.behavior}${item.motive ? ` Objetivo: ${item.motive}` : ''}${item.lair ? ` Covil: ${item.lair}` : ''}`} secret={isMaster ? `${item.tactics ?? ''} Fraqueza: ${item.weakness ?? 'desconhecida'}. Recompensa: ${item.reward ?? 'não definida'}. ${item.suggestedStatBlock ?? ''}` : undefined} />)}
    {threats.length === 0 && <p className="muted">Nenhuma ameaça identificada.</p>}
  </section>;
}

function HistoryTab({ lore, isMaster }: { lore?: HexLore; isMaster: boolean }) {
  return <section className="sidebar-section lore-content">
    <p>{lore?.history || 'A história deste lugar ainda não foi descoberta.'}</p>
    {isMaster && (lore?.clues ?? []).map((clue, index) => <LoreCard key={`${clue.clue}-${index}`} title={`Pista ${index + 1} · ${clue.location}`} text={clue.clue} secret={`Revela: ${clue.reveals}`} />)}
  </section>;
}

function HorrorTab({ lore, isMaster }: { lore?: HexLore; isMaster: boolean }) {
  if (!lore?.horror) return <section className="sidebar-section"><p className="muted">Nenhuma manifestação conhecida.</p></section>;
  return <section className="sidebar-section lore-content">
    <h3>{lore.horror.name}</h3>
    <p>{lore.horror.playerEffect ?? lore.horror.effect}</p>
    <ul>{lore.horror.omens.map((omen) => <li key={omen}>{omen}</li>)}</ul>
    {isMaster && <>
      {lore.horror.truth && <div className="secret-box"><strong>Verdade secreta</strong><p>{lore.horror.truth}</p></div>}
      {lore.horror.escalation && <LoreCard title="Escalada" text={lore.horror.escalation.join(' ')} />}
      {lore.horror.containment && <LoreCard title="Contenção" text={lore.horror.containment} />}
    </>}
  </section>;
}

function MasterTab({ lore, masterNotes }: { lore?: HexLore; masterNotes: string | null }) {
  return <section className="sidebar-section lore-list">
    {masterNotes && <LoreCard title="Notas manuais" text={masterNotes} />}
    {lore?.masterGuide && <>
      <LoreCard title="Premissa" text={lore.masterGuide.premise} />
      <LoreCard title="Verdade oculta" text={lore.masterGuide.hiddenTruth} />
      <LoreCard title="Conflito ativo" text={lore.masterGuide.activeConflict} />
      <LoreCard title="Se for ignorado" text={lore.masterGuide.whatChangesIfIgnored} />
      <LoreCard title="Conexões" text={lore.masterGuide.connections.join(' ')} />
      <LoreCard title="Como improvisar" text={lore.masterGuide.improvisationNotes.join(' ')} />
    </>}
    {(lore?.encounters ?? []).map((encounter) => <LoreCard key={encounter.title} title={`${encounter.title} · ${formatEnum(encounter.type)}`} text={`${encounter.setup} ${encounter.development}`} secret={encounter.consequence} />)}
  </section>;
}

function getLore(hex: HexData | null): HexLore | undefined {
  return hex?.state.lore ?? hex?.state.publicLore;
}

function LoreCard({ title, text, secret }: { title: string; text: string; secret?: string }) {
  return <article className="lore-card"><h3>{title}</h3><p>{text}</p>{secret && <small className="secret-line">Mestre: {secret}</small>}</article>;
}

function Legend({ color, label }: { color: string; label: string }) {
  return <div className="legend-item"><span style={{ background: color }} /><p>{label}</p></div>;
}

function formatEnum(value?: string) {
  if (!value || value === 'DESCONHECIDO') return 'Desconhecido';
  return value.toLowerCase().split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

function tabLabel(tab: LoreTab) {
  const labels: Record<LoreTab, string> = {
    RESUMO: 'RESUMO',
    NARRACAO: 'NARRAÇÃO',
    LOCAIS: 'LOCAIS',
    RECURSOS: 'RECURSOS',
    RUMORES: 'RUMORES',
    FAUNA: 'NATUREZA',
    AMEACAS: 'AMEAÇAS',
    HISTORIA: 'HISTÓRIA',
    HORROR: 'HORROR',
    ENCONTROS: 'ENCONTROS',
    MESTRE: 'MESTRE',
    MEMBROS: 'MEMBROS'
  };
  return labels[tab];
}

function hexDistance(aq: number, ar: number, bq: number, br: number) {
  return Math.max(Math.abs(aq - bq), Math.abs(ar - br), Math.abs(-aq - ar + bq + br));
}

function readError(error: unknown) {
  return error instanceof Error ? error.message : 'Não foi possível concluir a operação.';
}
