'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { clearSession, readSession } from '@/lib/auth';
import { AuthSession, Campaign } from '@/lib/types';

const minimumRadius = 3;
const maximumRadius = 40;
const radiusPresets = [6, 12, 20, 30, 40];

export function CampaignsDashboard() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [name, setName] = useState('As Cinzas Sob o Céu Morto');
  const [description, setDescription] = useState('Exploração hexagonal, sobrevivência e horror cósmico.');
  const [seed, setSeed] = useState('CINZAS-117');
  const [radius, setRadius] = useState(6);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [session, setSession] = useState<AuthSession | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [joinBusy, setJoinBusy] = useState(false);
  const [joinError, setJoinError] = useState('');

  const hexCount = useMemo(() => 1 + 3 * radius * (radius + 1), [radius]);
  const mapSizeLabel = useMemo(() => {
    if (radius <= 12) return 'Mapa compacto';
    if (radius <= 24) return 'Mapa grande';
    if (radius <= 32) return 'Mapa muito grande';
    return 'Mapa colossal';
  }, [radius]);

  useEffect(() => {
    const currentSession = readSession();
    setSession(currentSession);
    setAuthReady(true);

    if (!currentSession) {
      router.replace('/login');
      return;
    }

    void loadCampaigns();
  }, [router]);

  async function loadCampaigns() {
    setLoading(true);
    setError('');
    try {
      setCampaigns(await apiRequest<Campaign[]>('/campaigns'));
    } catch (caughtError) {
      setError(readError(caughtError));
    } finally {
      setLoading(false);
    }
  }

  async function createCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const campaign = await apiRequest<Campaign>('/campaigns', {
        method: 'POST',
        body: JSON.stringify({ name, description, seed, radius })
      });
      router.push(`/campaigns/${campaign.id}`);
    } catch (caughtError) {
      setError(readError(caughtError));
    } finally {
      setBusy(false);
    }
  }

  function startEdit(campaign: Campaign) {
    setEditingId(campaign.id);
    setEditName(campaign.name);
    setEditDescription(campaign.description ?? '');
  }

  async function saveEdit(campaignId: string) {
    setBusy(true);
    setError('');
    try {
      const updated = await apiRequest<Campaign>(`/campaigns/${campaignId}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: editName, description: editDescription })
      });
      setCampaigns((current) => current.map((campaign) => campaign.id === campaignId ? { ...campaign, ...updated } : campaign));
      setEditingId(null);
    } catch (caughtError) {
      setError(readError(caughtError));
    } finally {
      setBusy(false);
    }
  }

  async function removeCampaign(campaign: Campaign) {
    if (!window.confirm(`Excluir a campanha “${campaign.name}” e todos os seus hexágonos?`)) return;
    setBusy(true);
    setError('');
    try {
      await apiRequest(`/campaigns/${campaign.id}`, { method: 'DELETE' });
      setCampaigns((current) => current.filter((item) => item.id !== campaign.id));
    } catch (caughtError) {
      setError(readError(caughtError));
    } finally {
      setBusy(false);
    }
  }

  async function joinCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setJoinBusy(true);
    setJoinError('');
    try {
      const campaign = await apiRequest<Campaign>('/campaigns/join', {
        method: 'POST',
        body: JSON.stringify({ inviteCode: inviteCodeInput.trim() })
      });
      router.push(`/campaigns/${campaign.id}`);
    } catch (caughtError) {
      setJoinError(readError(caughtError));
    } finally {
      setJoinBusy(false);
    }
  }

  function updateRadius(value: number) {
    setRadius(Math.min(maximumRadius, Math.max(minimumRadius, Math.round(value))));
  }

  function logout() {
    clearSession();
    setSession(null);
    router.replace('/login');
  }

  if (!authReady) {
    return <main className="loading-shell"><div className="loading-card"><div className="spinner" /><p>Validando sessão...</p></div></main>;
  }

  return (
    <main className="dashboard-shell">
      <header className="topbar">
        <div><p className="eyebrow">Atlas das Cinzas</p><h1>Painel de campanhas</h1></div>
        <div className="topbar-actions">
          <span>{session?.user.displayName ?? 'Usuário'}</span>
          {session?.user.role === 'ADMIN' && <Link className="ghost-button button-link" href="/users">Gerenciar usuários</Link>}
          <button className="ghost-button" onClick={logout}>Sair</button>
        </div>
      </header>

      {error && <p className="global-error">{error}</p>}

      <section className="dashboard-grid">
        <div className="panel">
          <div className="section-heading">
            <div><p className="eyebrow">Mundos ativos</p><h2>Campanhas disponíveis</h2></div>
            <button className="ghost-button" onClick={() => void loadCampaigns()}>Atualizar</button>
          </div>

          {loading && <p className="muted">Carregando campanhas...</p>}
          {!loading && campaigns.length === 0 && <div className="empty-state"><h3>Nenhuma campanha</h3><p>Crie uma campanha ou peça para um mestre adicionar você.</p></div>}

          <div className="campaign-list">
            {campaigns.map((campaign) => (
              <article className="campaign-card campaign-card-manage" key={campaign.id}>
                {editingId === campaign.id ? (
                  <div className="form-stack compact-form campaign-inline-editor">
                    <label>Nome<input value={editName} onChange={(event) => setEditName(event.target.value)} /></label>
                    <label>Descrição<textarea value={editDescription} onChange={(event) => setEditDescription(event.target.value)} rows={3} /></label>
                    <div className="row-actions"><button className="primary-button" onClick={() => void saveEdit(campaign.id)} disabled={busy}>Salvar</button><button className="ghost-button" onClick={() => setEditingId(null)}>Cancelar</button></div>
                  </div>
                ) : (
                  <>
                    <Link className="campaign-card-main" href={`/campaigns/${campaign.id}`}>
                      <div><h3>{campaign.name}</h3><p>{campaign.description || 'Sem descrição.'}</p></div>
                      <div className="campaign-meta">
                        <span>Dia {campaign.currentDay}</span>
                        <span>{formatPeriod(campaign.currentPeriod)}</span>
                        <span>{campaign.hexCount.toLocaleString('pt-BR')} hexágonos</span>
                        <span>{campaign.memberCount} participantes</span>
                        <span>{campaign.accessRole === 'MASTER' ? 'Mestre' : 'Jogador'}</span>
                      </div>
                    </Link>
                    {campaign.accessRole === 'MASTER' && (
                      <div className="campaign-card-actions">
                        <button className="ghost-button" onClick={() => startEdit(campaign)}>Editar</button>
                        {campaign.isOwner && <button className="danger-button" onClick={() => void removeCampaign(campaign)} disabled={busy}>Excluir</button>}
                      </div>
                    )}
                  </>
                )}
              </article>
            ))}
          </div>
        </div>

        <aside className="panel create-panel">
          <p className="eyebrow">Já tem um convite?</p>
          <h2>Entrar com código</h2>
          <form className="form-stack compact-form join-code-form" onSubmit={joinCampaign}>
            <label>Código de convite<input value={inviteCodeInput} onChange={(event) => setInviteCodeInput(event.target.value.toUpperCase())} placeholder="Ex.: 7F3K9QZ" required minLength={4} maxLength={12} /></label>
            {joinError && <p className="global-error compact-error">{joinError}</p>}
            <button className="ghost-button" disabled={joinBusy}>{joinBusy ? 'Entrando...' : 'Entrar na campanha'}</button>
          </form>

          <p className="eyebrow">Nova simulação</p>
          <h2>Criar campanha</h2>
          <p className="helper-text">Todos os hexágonos recebem terreno, história, lendas, rumores, fauna, ameaças e horror no momento da criação.</p>

          <form className="form-stack" onSubmit={createCampaign}>
            <label>Nome<input value={name} onChange={(event) => setName(event.target.value)} required minLength={3} /></label>
            <label>Descrição<textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} /></label>
            <label>Semente<input value={seed} onChange={(event) => setSeed(event.target.value)} required minLength={3} /></label>

            <div className="radius-heading"><label htmlFor="campaign-radius">Raio do mapa</label><input className="radius-number-input" type="number" min={minimumRadius} max={maximumRadius} value={radius} onChange={(event) => updateRadius(Number(event.target.value))} /></div>
            <input id="campaign-radius" type="range" min={minimumRadius} max={maximumRadius} value={radius} onChange={(event) => updateRadius(Number(event.target.value))} />
            <div className="radius-presets">{radiusPresets.map((preset) => <button key={preset} type="button" className={radius === preset ? 'active' : ''} onClick={() => updateRadius(preset)}>{preset}</button>)}</div>

            <div className={`map-size-summary radius-${getRadiusTier(radius)}`}><strong>{mapSizeLabel}</strong><span>{hexCount.toLocaleString('pt-BR')} hexágonos com lore</span><small>{radius * 2 + 1} hexágonos de largura máxima</small></div>
            {radius > 24 && <p className="map-size-warning">A primeira criação pode levar mais tempo porque cada hexágono recebe conteúdo persistente. A navegação posterior usa renderização seletiva.</p>}
            <button className="primary-button" disabled={busy}>{busy ? `Gerando ${hexCount.toLocaleString('pt-BR')} hexágonos e suas histórias...` : 'Criar campanha completa'}</button>
          </form>
        </aside>
      </section>
    </main>
  );
}

function getRadiusTier(radius: number) {
  if (radius <= 12) return 'compact';
  if (radius <= 24) return 'large';
  if (radius <= 32) return 'very-large';
  return 'colossal';
}

function formatPeriod(period: string) {
  return ({ MANHA: 'Manhã', TARDE: 'Tarde', ANOITECER: 'Anoitecer', NOITE: 'Noite' } as Record<string, string>)[period] ?? period;
}

function readError(error: unknown) {
  return error instanceof Error ? error.message : 'Não foi possível concluir a operação.';
}
