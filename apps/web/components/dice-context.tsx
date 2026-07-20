'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getRealtimeSocket } from '@/lib/socket';

export type RollMode = 'NORMAL' | 'VANTAGEM' | 'DESVANTAGEM';

export interface DiceRollEntry {
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

export const diceTypes = [4, 6, 8, 10, 12, 20, 100];
export const maximumCount = 20;
export const maximumModifier = 99;
const historyLimit = 50;

export function rollDie(sides: number) {
  return 1 + Math.floor(Math.random() * sides);
}

export function formatModifier(modifier: number) {
  if (modifier === 0) return '';
  return modifier > 0 ? `+${modifier}` : String(modifier);
}

export function buildNotation(count: number, sides: number, modifier: number, mode: RollMode) {
  const base = mode === 'NORMAL' ? `${count}d${sides}` : '1d20';
  return `${base}${formatModifier(modifier)}`;
}

/**
 * Vantagem e desvantagem em D&D 5e rolam dois d20 e descartam um deles, então
 * o par inteiro vai para o histórico e o descartado é marcado na exibição.
 */
export function rollPool(count: number, sides: number, modifier: number, mode: RollMode) {
  if (mode !== 'NORMAL') {
    const rolls = [rollDie(20), rollDie(20)];
    const kept = mode === 'VANTAGEM' ? Math.max(...rolls) : Math.min(...rolls);
    return { rolls, total: kept + modifier };
  }

  const rolls = Array.from({ length: count }, () => rollDie(sides));
  return { rolls, total: rolls.reduce((sum, value) => sum + value, 0) + modifier };
}

/** Índice do dado descartado pela vantagem/desvantagem, ou -1 quando não há descarte. */
export function discardedIndex(entry: DiceRollEntry) {
  if (entry.mode === 'NORMAL' || entry.rolls.length !== 2) return -1;
  const [first, second] = entry.rolls;
  if (first === second) return -1;
  const discarded = entry.mode === 'VANTAGEM' ? Math.min(first, second) : Math.max(first, second);
  return entry.rolls.indexOf(discarded);
}

export function parseNotation(value: string) {
  const match = value.trim().match(/^(\d{1,2})?\s*d\s*(\d{1,3})\s*([+-]\s*\d{1,2})?$/i);
  if (!match) return null;
  const count = match[1] ? Number(match[1]) : 1;
  const sides = Number(match[2]);
  const modifier = match[3] ? Number(match[3].replace(/\s+/g, '')) : 0;
  if (count < 1 || count > maximumCount) return null;
  if (sides < 2 || sides > 1000) return null;
  return { count, sides, modifier };
}

export function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

interface DiceContextValue {
  history: DiceRollEntry[];
  /** Rolagens recebidas desde a última vez que o feed foi lido. */
  unseen: number;
  markSeen: () => void;
  publish: (notation: string, rolls: number[], total: number, mode: RollMode) => void;
}

const DiceContext = createContext<DiceContextValue | null>(null);

/**
 * Dono único do histórico de rolagens: o modal e o feed flutuante leem a mesma
 * lista, evitando dois listeners de socket e duas versões da mesma sessão.
 */
export function DiceProvider({
  campaignId,
  displayName,
  children
}: {
  campaignId: string;
  displayName: string;
  children: ReactNode;
}) {
  const [history, setHistory] = useState<DiceRollEntry[]>([]);
  const [unseen, setUnseen] = useState(0);
  const displayNameRef = useRef(displayName);
  displayNameRef.current = displayName;

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
      setUnseen((value) => value + 1);
    };
    socket.on('dice:rolled', handleRolled);
    return () => {
      socket.off('dice:rolled', handleRolled);
    };
  }, [campaignId]);

  // Trocar de campanha não pode arrastar as rolagens da mesa anterior.
  useEffect(() => {
    setHistory([]);
    setUnseen(0);
  }, [campaignId]);

  const publish = useCallback((notation: string, rolls: number[], total: number, mode: RollMode) => {
    const socket = getRealtimeSocket();
    const rolledBy = displayNameRef.current;

    // Com a sala conectada o histórico é preenchido pelo eco do servidor, que
    // chega para a mesa inteira. Sem conexão guardamos localmente para quem
    // rolou não ficar sem resposta na tela.
    if (socket.connected) {
      socket.emit('dice:roll', { campaignId, notation, total, rolls, mode, rolledBy });
      return;
    }

    setHistory((current) => [
      {
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        notation,
        total,
        rolls,
        mode,
        rolledBy,
        at: new Date().toISOString(),
        local: true
      },
      ...current
    ].slice(0, historyLimit));
    setUnseen((value) => value + 1);
  }, [campaignId]);

  const markSeen = useCallback(() => setUnseen(0), []);

  const value = useMemo<DiceContextValue>(
    () => ({ history, unseen, markSeen, publish }),
    [history, unseen, markSeen, publish]
  );

  return <DiceContext.Provider value={value}>{children}</DiceContext.Provider>;
}

export function useDice() {
  const context = useContext(DiceContext);
  if (!context) throw new Error('useDice precisa estar dentro de DiceProvider.');
  return context;
}
