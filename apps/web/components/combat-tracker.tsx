'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { apiRequest } from '@/lib/api';
import { CombatParticipant, RandomEncounter } from '@/lib/types';

function sortByInitiative(participants: CombatParticipant[]) {
  return [...participants].sort((a, b) => b.initiative - a.initiative);
}

export function CombatTracker({ campaignId, encounter, onUpdate }: {
  campaignId: string;
  encounter: RandomEncounter;
  onUpdate: (updated: RandomEncounter) => void;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState('');
  const [initiative, setInitiative] = useState(10);
  const [isPlayerCharacter, setIsPlayerCharacter] = useState(true);
  const [maxHitPoints, setMaxHitPoints] = useState<number | ''>('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => setMounted(true), []);

  const participants = encounter.initiativeOrder;

  async function save(nextParticipants: CombatParticipant[], round: number, turnIndex: number) {
    setBusy(true);
    setError('');
    try {
      const updated = await apiRequest<RandomEncounter>(`/campaigns/${campaignId}/encounters/${encounter.id}/combat`, {
        method: 'PATCH',
        body: JSON.stringify({ participants: nextParticipants, combatRound: round, currentTurnIndex: turnIndex })
      });
      onUpdate(updated);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Não foi possível atualizar o combate.');
    } finally {
      setBusy(false);
    }
  }

  function addParticipant() {
    if (!name.trim()) return;
    const participant: CombatParticipant = {
      id: crypto.randomUUID(),
      name: name.trim(),
      initiative,
      isPlayerCharacter,
      maxHitPoints: maxHitPoints === '' ? undefined : maxHitPoints,
      hitPoints: maxHitPoints === '' ? undefined : maxHitPoints
    };
    void save(sortByInitiative([...participants, participant]), encounter.combatRound, encounter.currentTurnIndex);
    setName('');
    setInitiative(10);
    setMaxHitPoints('');
  }

  function removeParticipant(id: string) {
    const next = participants.filter((item) => item.id !== id);
    void save(next, encounter.combatRound, 0);
  }

  function adjustHitPoints(id: string, delta: number) {
    const next = participants.map((item) => item.id === id && item.hitPoints !== undefined
      ? { ...item, hitPoints: Math.max(0, item.hitPoints + delta) }
      : item);
    void save(next, encounter.combatRound, encounter.currentTurnIndex);
  }

  function nextTurn() {
    if (participants.length === 0) return;
    const nextIndex = (encounter.currentTurnIndex + 1) % participants.length;
    const nextRound = nextIndex === 0 ? encounter.combatRound + 1 : encounter.combatRound;
    void save(participants, nextRound, nextIndex);
  }

  function resetCombat() {
    if (!window.confirm('Encerrar o combate e limpar a ordem de iniciativa?')) return;
    void save([], 0, 0);
  }

  const modal = mounted && open ? createPortal(
    <div className="encounter-modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !busy) setOpen(false);
    }}>
      <section className="encounter-modal combat-modal" role="dialog" aria-modal="true" aria-labelledby="combat-modal-title">
        <header className="encounter-modal-header">
          <div>
            <p className="eyebrow">{encounter.title}</p>
            <h2 id="combat-modal-title">Rastreador de combate · Rodada {encounter.combatRound + 1}</h2>
          </div>
          <button type="button" className="ghost-button encounter-modal-close" disabled={busy} onClick={() => setOpen(false)}>Fechar</button>
        </header>
        <div className="encounter-modal-form">
          <div className="combat-add-row">
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome" />
            <input type="number" value={initiative} onChange={(event) => setInitiative(Number(event.target.value))} placeholder="Iniciativa" />
            <input type="number" min={0} value={maxHitPoints} onChange={(event) => setMaxHitPoints(event.target.value === '' ? '' : Number(event.target.value))} placeholder="PV (opcional)" />
            <label className="checkbox-row compact-checkbox">
              <input type="checkbox" checked={isPlayerCharacter} onChange={(event) => setIsPlayerCharacter(event.target.checked)} />
              <span>Personagem</span>
            </label>
            <button type="button" className="ghost-button compact-button" disabled={busy} onClick={addParticipant}>Adicionar</button>
          </div>

          {error && <p className="global-error compact-error">{error}</p>}

          <ul className="combat-order-list">
            {participants.length === 0 && <li className="helper-text">Nenhum participante na ordem de iniciativa ainda.</li>}
            {participants.map((participant, index) => (
              <li key={participant.id} className={index === encounter.currentTurnIndex ? 'combat-turn-active' : ''}>
                <strong>{participant.initiative}</strong>
                <span className={`combat-participant-name${participant.isPlayerCharacter ? ' is-pc' : ''}`}>{participant.name}</span>
                {participant.maxHitPoints !== undefined && (
                  <span className="combat-hp">
                    <button type="button" className="ghost-button mini-button" disabled={busy} onClick={() => adjustHitPoints(participant.id, -1)}>−</button>
                    {participant.hitPoints ?? participant.maxHitPoints}/{participant.maxHitPoints}
                    <button type="button" className="ghost-button mini-button" disabled={busy} onClick={() => adjustHitPoints(participant.id, 1)}>+</button>
                  </span>
                )}
                <button type="button" className="ghost-button mini-button" disabled={busy} onClick={() => removeParticipant(participant.id)}>Remover</button>
              </li>
            ))}
          </ul>

          <footer className="encounter-modal-footer">
            <button type="button" className="ghost-button" disabled={busy || participants.length === 0} onClick={resetCombat}>Encerrar combate</button>
            <button type="button" className="primary-button" disabled={busy || participants.length === 0} onClick={nextTurn}>Próximo turno</button>
          </footer>
        </div>
      </section>
    </div>,
    document.body
  ) : null;

  return (
    <>
      {modal}
      <button type="button" className="ghost-button" disabled={busy} onClick={() => setOpen(true)}>Rastreador de combate</button>
    </>
  );
}
