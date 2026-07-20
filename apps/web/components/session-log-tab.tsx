'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { CampaignEventData } from '@/lib/types';

const periodLabels: Record<string, string> = {
  MANHA: 'Manhã',
  TARDE: 'Tarde',
  ANOITECER: 'Anoitecer',
  NOITE: 'Noite'
};

const typeLabels: Record<string, string> = {
  CAMPAIGN_CREATED: 'Campanha criada',
  PARTY_MOVED: 'Grupo se moveu',
  HEX_EXPLORED: 'Hexágono explorado',
  HEX_UPDATED: 'Hexágono atualizado',
  TIME_ADVANCED: 'Tempo avançou',
  SECRET_ENCOUNTER_GENERATED: 'Encontro secreto gerado',
  SECRET_ENCOUNTER_STATUS_CHANGED: 'Status de encontro alterado'
};

function describeEvent(event: CampaignEventData): string {
  const payload = event.payload;
  switch (event.type) {
    case 'PARTY_MOVED': {
      const from = payload.from as { q: number; r: number } | undefined;
      const to = payload.to as { q: number; r: number } | undefined;
      return from && to ? `De (${from.q}, ${from.r}) para (${to.q}, ${to.r})` : '';
    }
    case 'HEX_EXPLORED': {
      const position = payload as { q?: number; r?: number };
      return position.q !== undefined ? `Hexágono (${position.q}, ${position.r})` : '';
    }
    case 'HEX_UPDATED': {
      const position = payload as { q?: number; r?: number; currentStatus?: string };
      return position.q !== undefined ? `Hexágono (${position.q}, ${position.r}) · ${position.currentStatus ?? ''}` : '';
    }
    case 'TIME_ADVANCED': {
      const steps = payload.steps as number | undefined;
      return steps ? `${steps} período(s) avançado(s)` : '';
    }
    case 'SECRET_ENCOUNTER_GENERATED':
    case 'SECRET_ENCOUNTER_STATUS_CHANGED': {
      const info = payload as { q?: number; r?: number; category?: string; status?: string };
      const parts = [
        info.q !== undefined ? `hex (${info.q}, ${info.r})` : null,
        info.category ? `categoria ${info.category}` : null,
        info.status ? `status ${info.status}` : null
      ].filter(Boolean);
      return parts.join(' · ');
    }
    case 'CAMPAIGN_CREATED': {
      const info = payload as { radius?: number; generatedHexes?: number };
      return info.radius ? `Raio ${info.radius} · ${info.generatedHexes ?? 0} hexágonos` : '';
    }
    default:
      return '';
  }
}

export function SessionLogTab({ campaignId }: { campaignId: string }) {
  const [events, setEvents] = useState<CampaignEventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let disposed = false;
    setLoading(true);
    apiRequest<CampaignEventData[]>(`/campaigns/${campaignId}/events?limit=150`)
      .then((data) => { if (!disposed) setEvents(data); })
      .catch((err) => { if (!disposed) setError(err instanceof Error ? err.message : 'Não foi possível carregar o histórico.'); })
      .finally(() => { if (!disposed) setLoading(false); });
    return () => { disposed = true; };
  }, [campaignId]);

  return (
    <section className="sidebar-section lore-list">
      <p className="helper-text">Histórico de eventos registrados automaticamente pela campanha.</p>
      {loading && <p className="helper-text">Carregando histórico...</p>}
      {error && <p className="global-error compact-error">{error}</p>}
      {!loading && events.length === 0 && <p className="helper-text">Nenhum evento registrado ainda.</p>}
      {events.map((event) => (
        <article key={event.id} className="lore-card">
          <h3>{typeLabels[event.type] ?? event.type}</h3>
          <p>{describeEvent(event) || 'Sem detalhes adicionais.'}</p>
          <small className="secret-line">Dia {event.day} · {periodLabels[event.period] ?? event.period} · {new Date(event.createdAt).toLocaleString('pt-BR')}</small>
        </article>
      ))}
    </section>
  );
}
