'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getRealtimeSocket } from '@/lib/socket';

type RollMode = 'NORMAL' | 'VANTAGEM' | 'DESVANTAGEM';

interface DiceRollEntry {
  id: string;
  notation: string;
  total: number;
  rolls: number[];
  mode: RollMode;
  rolledBy: string;
  at: string;
  /** Rolagem que não chegou à mesa por falta de conexão; visível só para quem rolou. */
  local?: boolean;
}

const diceTypes = [4, 6, 8, 10, 12, 20, 100];
const maximumCount = 20;
const maximumModifier = 99;
const historyLimit = 30;

function rollDie(sides: number) {
  return 1 + Math.floor(Math.random() * sides);
}

function formatModifier(modifier: number) {
  if (modifier === 0) return '';
  return modifier > 0 ? `+${modifier}` : String(modifier);
}

function buildNotation(count: number, sides: number, modifier: number, mode: RollMode) {
  const base = mode === 'NORMAL' ? `${count}d${sides}` : '1d20';
  return `${base}${formatModifier(modifier)}`;
}

/**
 * Vantagem e desvantagem em D&D 5e rolam dois d20 e descartam um deles, então
 * o par inteiro vai para o histórico e o descartado é marcado na exibição.
 */
function rollPool(count: number, sides: number, modifier: number, mode: RollMode) {
  if (mode !== 'NORMAL') {
    const rolls = [rollDie(20), rollDie(20)];
    const kept = mode === 'VANTAGEM' ? Math.max(...rolls) : Math.min(...rolls);
    return { rolls, total: kept + modifier };
  }

  const rolls = Array.from({ length: count }, () => rollDie(sides));
  return { rolls, total: rolls.reduce((sum, value) => sum + value, 0) + modifier };
}

/** Índice do dado descartado pela vantagem/desvantagem, ou -1 quando não há descarte. */
function discardedIndex(entry: DiceRollEntry) {
  if (entry.mode === 'NORMAL' || entry.rolls.length !== 2) return -1;
  const [first, second] = entry.rolls;
  if (first === second) return -1;
  const discarded = entry.mode === 'VANTAGEM' ? Math.min(first, second) : Math.max(first, second);
  return entry.rolls.indexOf(discarded);
}

function parseNotation(value: string) {
  const match = value.trim().match(/^(\d{1,2})?\s*d\s*(\d{1,3})\s*([+-]\s*\d{1,2})?$/i);
  if (!match) return null;
  const count = match[1] ? Number(match[1]) : 1;
  const sides = Number(match[2]);
  const modifier = match[3] ? Number(match[3].replace(/\s+/g, '')) : 0;
  if (count < 1 || count > maximumCount) return null;
  if (sides < 2 || sides > 1000) return null;
  return { count, sides, modifier };
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function DiceRoller({ campaignId, displayName }: { campaignId: string; displayName: string }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [sides, setSides] = useState(20);
  const [count, setCount] = useState(1);
  const [modifier, setModifier] = useState(0);
  const [mode, setMode] = useState<RollMode>('NORMAL');
  const [notation, setNotation] = useState('');
  const [history, setHistory] = useState<DiceRollEntry[]>([]);
  const [error, setError] = useState('');

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const socket = getRealtimeSocket();
    const handleRolled = (payload: Omit<DiceRollEntry, 'id' | 'mode'> & { campaignId: string; mode?: RollMode }) => {
      if (payload.campaignId !== campaignId) return;
      setHistory((current) => [
        {
          ...payload,
          mode: payload.mode ?? 'NORMAL',
          id: `${payload.at}-${Math.random().toString(36).slice(2)}`
        },
        ...current
      ].slice(0, historyLimit));
    };
    socket.on('dice:rolled', handleRolled);
    return () => {
      socket.off('dice:rolled', handleRolled);
    };
  }, [campaignId]);

  // Vantagem só existe para o d20; trocar de dado volta a rolagem para o normal.
  function selectSides(value: number) {
    setSides(value);
    if (value !== 20) setMode('NORMAL');
  }

  function publish(rollNotation: string, rolls: number[], total: number, rollMode: RollMode) {
    setError('');
    const socket = getRealtimeSocket();
    const payload = {
      campaignId,
      notation: rollNotation,
      total,
      rolls,
      mode: rollMode,
      rolledBy: displayName
    };

    // Com a sala conectada o histórico é preenchido pelo eco do servidor, que
    // chega para a mesa inteira. Sem conexão guardamos localmente para quem
    // rolou não ficar sem resposta na tela.
    if (socket.connected) {
      socket.emit('dice:roll', payload);
      return;
    }

    setHistory((current) => [
      {
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        notation: rollNotation,
        total,
        rolls,
        mode: rollMode,
        rolledBy: displayName,
        at: new Date().toISOString(),
        local: true
      },
      ...current
    ].slice(0, historyLimit));
  }

  function rollFromControls() {
    const safeCount = clamp(count, 1, maximumCount);
    const safeModifier = clamp(modifier, -maximumModifier, maximumModifier);
    const { rolls, total } = rollPool(safeCount, sides, safeModifier, mode);
    publish(buildNotation(safeCount, sides, safeModifier, mode), rolls, total, mode);
  }

  function rollFromNotation() {
    const parsed = parseNotation(notation);
    if (!parsed) {
      setError('Notação inválida. Use o formato 1d20, 2d6+3 ou 1d20-4.');
      return;
    }
    const { rolls, total } = rollPool(parsed.count, parsed.sides, parsed.modifier, 'NORMAL');
    publish(buildNotation(parsed.count, parsed.sides, parsed.modifier, 'NORMAL'), rolls, total, 'NORMAL');
  }

  const preview = buildNotation(clamp(count, 1, maximumCount), sides, clamp(modifier, -maximumModifier, maximumModifier), mode);

  const modal = mounted && open ? createPortal(
    <div className="encounter-modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) setOpen(false);
    }}>
      <section className="encounter-modal dice-modal" role="dialog" aria-modal="true" aria-labelledby="dice-modal-title">
        <header className="encounter-modal-header">
          <div>
            <p className="eyebrow">Ferramenta de mesa</p>
            <h2 id="dice-modal-title">Rolador de dados</h2>
          </div>
          <button type="button" className="ghost-button encounter-modal-close" onClick={() => setOpen(false)}>Fechar</button>
        </header>

        <div className="encounter-modal-form">
          <div className="dice-field">
            <span className="dice-field-label">Tipo de dado</span>
            <div className="dice-type-row">
              {diceTypes.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`dice-type-button${sides === value ? ' is-selected' : ''}`}
                  aria-pressed={sides === value}
                  onClick={() => selectSides(value)}
                >
                  d{value}
                </button>
              ))}
            </div>
          </div>

          <div className="dice-steppers">
            <div className="dice-field">
              <span className="dice-field-label">Quantidade</span>
              <div className="dice-stepper">
                <button type="button" className="ghost-button compact-button" aria-label="Diminuir quantidade" onClick={() => setCount((value) => clamp(value - 1, 1, maximumCount))} disabled={mode !== 'NORMAL'}>−</button>
                <input
                  type="number"
                  min={1}
                  max={maximumCount}
                  value={count}
                  disabled={mode !== 'NORMAL'}
                  onChange={(event) => setCount(clamp(Number(event.target.value) || 1, 1, maximumCount))}
                  aria-label="Quantidade de dados"
                />
                <button type="button" className="ghost-button compact-button" aria-label="Aumentar quantidade" onClick={() => setCount((value) => clamp(value + 1, 1, maximumCount))} disabled={mode !== 'NORMAL'}>+</button>
              </div>
            </div>

            <div className="dice-field">
              <span className="dice-field-label">Modificador</span>
              <div className="dice-stepper">
                <button type="button" className="ghost-button compact-button" aria-label="Diminuir modificador" onClick={() => setModifier((value) => clamp(value - 1, -maximumModifier, maximumModifier))}>−</button>
                <input
                  type="number"
                  min={-maximumModifier}
                  max={maximumModifier}
                  value={modifier}
                  onChange={(event) => setModifier(clamp(Number(event.target.value) || 0, -maximumModifier, maximumModifier))}
                  aria-label="Modificador somado ou subtraído do resultado"
                />
                <button type="button" className="ghost-button compact-button" aria-label="Aumentar modificador" onClick={() => setModifier((value) => clamp(value + 1, -maximumModifier, maximumModifier))}>+</button>
              </div>
            </div>
          </div>

          {sides === 20 && (
            <div className="dice-field">
              <span className="dice-field-label">Rolagem de d20</span>
              <div className="dice-mode-row">
                {([
                  ['NORMAL', 'Normal'],
                  ['VANTAGEM', 'Vantagem'],
                  ['DESVANTAGEM', 'Desvantagem']
                ] as [RollMode, string][]).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={`dice-mode-button${mode === value ? ' is-selected' : ''}`}
                    aria-pressed={mode === value}
                    onClick={() => setMode(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {mode !== 'NORMAL' && (
                <p className="helper-text">Rola dois d20 e mantém o {mode === 'VANTAGEM' ? 'maior' : 'menor'} resultado.</p>
              )}
            </div>
          )}

          <button type="button" className="primary-button dice-roll-button" onClick={rollFromControls}>
            Rolar {preview}
            {mode !== 'NORMAL' && <span className="dice-mode-tag">{mode === 'VANTAGEM' ? 'vantagem' : 'desvantagem'}</span>}
          </button>

          <form className="dice-custom-row" onSubmit={(event) => { event.preventDefault(); rollFromNotation(); }}>
            <input
              value={notation}
              onChange={(event) => setNotation(event.target.value)}
              placeholder="Ou digite a notação: 2d6+3"
              aria-label="Notação livre de dados"
            />
            <button className="ghost-button compact-button">Rolar</button>
          </form>

          {error && <p className="global-error compact-error">{error}</p>}

          <div className="dice-field">
            <span className="dice-field-label">Histórico da sessão</span>
            <ul className="dice-history">
              {history.length === 0 && <li className="helper-text">Nenhuma rolagem ainda nesta sessão.</li>}
              {history.map((entry) => {
                const discarded = discardedIndex(entry);
                return (
                  <li key={entry.id}>
                    <strong>{entry.total}</strong>
                    <span>
                      {entry.notation}
                      {entry.mode !== 'NORMAL' && (
                        <em className="dice-history-mode">{entry.mode === 'VANTAGEM' ? 'vantagem' : 'desvantagem'}</em>
                      )}
                      <span className="dice-history-rolls">
                        {entry.rolls.map((value, index) => (
                          <b key={index} className={index === discarded ? 'is-discarded' : undefined}>{value}</b>
                        ))}
                      </span>
                    </span>
                    <small>{entry.local ? `${entry.rolledBy} · só para você` : entry.rolledBy}</small>
                  </li>
                );
              })}
            </ul>
          </div>
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
