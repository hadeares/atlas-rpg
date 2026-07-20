'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getRealtimeSocket } from '@/lib/socket';

interface DiceRollEntry {
  id: string;
  notation: string;
  total: number;
  rolls: number[];
  rolledBy: string;
  at: string;
}

const quickDice = ['1d4', '1d6', '1d8', '1d10', '1d12', '1d20', '1d100'];

function rollNotation(notation: string): { rolls: number[]; total: number } | null {
  const match = notation.trim().match(/^(\d{1,2})?d(\d{1,3})([+-]\d{1,3})?$/i);
  if (!match) return null;
  const count = match[1] ? Number(match[1]) : 1;
  const sides = Number(match[2]);
  const modifier = match[3] ? Number(match[3]) : 0;
  if (count < 1 || count > 20 || sides < 2 || sides > 1000) return null;
  const rolls = Array.from({ length: count }, () => 1 + Math.floor(Math.random() * sides));
  const total = rolls.reduce((sum, value) => sum + value, 0) + modifier;
  return { rolls, total };
}

export function DiceRoller({ campaignId, displayName }: { campaignId: string; displayName: string }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [notation, setNotation] = useState('1d20');
  const [history, setHistory] = useState<DiceRollEntry[]>([]);
  const [error, setError] = useState('');

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const socket = getRealtimeSocket();
    const handleRolled = (payload: DiceRollEntry & { campaignId: string }) => {
      if (payload.campaignId !== campaignId) return;
      setHistory((current) => [{ ...payload, id: `${payload.at}-${Math.random().toString(36).slice(2)}` }, ...current].slice(0, 30));
    };
    socket.on('dice:rolled', handleRolled);
    return () => {
      socket.off('dice:rolled', handleRolled);
    };
  }, [campaignId]);

  function roll(value: string) {
    const parsed = rollNotation(value);
    if (!parsed) {
      setError('Notação inválida. Use o formato 1d20, 2d6+3, etc.');
      return;
    }
    setError('');
    getRealtimeSocket().emit('dice:roll', {
      campaignId,
      notation: value,
      total: parsed.total,
      rolls: parsed.rolls,
      rolledBy: displayName
    });
  }

  const modal = mounted && open ? createPortal(
    <div className="encounter-modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) setOpen(false);
    }}>
      <section className="encounter-modal dice-modal" role="dialog" aria-modal="true" aria-labelledby="dice-modal-title">
        <header className="encounter-modal-header">
          <div>
            <p className="eyebrow">Ferramenta de mestre</p>
            <h2 id="dice-modal-title">Rolador de dados</h2>
          </div>
          <button type="button" className="ghost-button encounter-modal-close" onClick={() => setOpen(false)}>Fechar</button>
        </header>
        <div className="encounter-modal-form">
          <div className="dice-quick-row">
            {quickDice.map((value) => (
              <button key={value} type="button" className="ghost-button compact-button" onClick={() => roll(value)}>{value}</button>
            ))}
          </div>
          <form className="dice-custom-row" onSubmit={(event) => { event.preventDefault(); roll(notation); }}>
            <input value={notation} onChange={(event) => setNotation(event.target.value)} placeholder="Ex.: 2d6+3" />
            <button className="primary-button compact-button">Rolar</button>
          </form>
          {error && <p className="global-error compact-error">{error}</p>}
          <ul className="dice-history">
            {history.length === 0 && <li className="helper-text">Nenhuma rolagem ainda nesta sessão.</li>}
            {history.map((entry) => (
              <li key={entry.id}>
                <strong>{entry.total}</strong>
                <span>{entry.notation} ({entry.rolls.join(', ')})</span>
                <small>{entry.rolledBy}</small>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>,
    document.body
  ) : null;

  return (
    <>
      {modal}
      <button type="button" className="ghost-button compact-button" onClick={() => setOpen(true)}>Dados</button>
    </>
  );
}
