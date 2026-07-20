'use client';

import { useEffect, useState } from 'react';
import { DiceRollEntry, discardedIndex, useDice } from './dice-context';

const storageKey = 'atlas:dice-feed-open';

function formatTime(at: string) {
  const date = new Date(at);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function RollLine({ entry }: { entry: DiceRollEntry }) {
  const discarded = discardedIndex(entry);
  return (
    <li className={entry.local ? 'is-local' : undefined}>
      <div className="dice-feed-line">
        <strong>{entry.total}</strong>
        <div className="dice-feed-body">
          <p className="dice-feed-who">
            {entry.rolledBy}
            <span className="dice-feed-time">{formatTime(entry.at)}</span>
          </p>
          <p className="dice-feed-detail">
            {entry.notation}
            {entry.mode !== 'NORMAL' && (
              <em className="dice-history-mode">{entry.mode === 'VANTAGEM' ? 'vantagem' : 'desvantagem'}</em>
            )}
            <span className="dice-history-rolls">
              {entry.rolls.map((value, index) => (
                <b key={index} className={index === discarded ? 'is-discarded' : undefined}>{value}</b>
              ))}
            </span>
          </p>
          {entry.local && <p className="dice-feed-local">Sem conexão com a mesa — visível só para você.</p>}
        </div>
      </div>
    </li>
  );
}

/**
 * Feed de rolagens sempre à vista, fora do modal: encolhe para uma barra com a
 * última rolagem e expande num histórico rolável, sem ocupar espaço do layout.
 */
export function DiceFeed() {
  const { history, unseen, markSeen } = useDice();
  const [open, setOpen] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  // A preferência é lida depois da montagem para o HTML do servidor e o do
  // cliente combinarem; até lá o painel usa o estado padrão.
  useEffect(() => {
    setHydrated(true);
    const stored = window.localStorage.getItem(storageKey);
    if (stored !== null) setOpen(stored === 'true');
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(storageKey, String(open));
  }, [hydrated, open]);

  useEffect(() => {
    if (open && unseen > 0) markSeen();
  }, [open, unseen, markSeen, history]);

  const latest = history[0];

  return (
    <section className={`dice-feed${open ? ' is-open' : ''}`} aria-label="Rolagens da mesa">
      <header className="dice-feed-header">
        <button
          type="button"
          className="dice-feed-toggle"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="dice-feed-title">Rolagens</span>
          {!open && unseen > 0 && <span className="dice-feed-badge">{unseen > 99 ? '99+' : unseen}</span>}
          <span className="dice-feed-chevron" aria-hidden="true">{open ? '▾' : '▴'}</span>
        </button>
      </header>

      {open ? (
        <ul className="dice-feed-list">
          {history.length === 0 && <li className="dice-feed-empty">Nenhuma rolagem ainda. As rolagens da mesa aparecem aqui.</li>}
          {history.map((entry) => <RollLine key={entry.id} entry={entry} />)}
        </ul>
      ) : (
        <p className="dice-feed-collapsed">
          {latest
            ? <><strong>{latest.total}</strong> {latest.rolledBy} · {latest.notation}</>
            : 'Nenhuma rolagem ainda.'}
        </p>
      )}
    </section>
  );
}
