'use client';

import { HexData, HexLore } from '@/lib/types';

/**
 * Só é exibido quando a página está sendo impressa (ver `@media print` em
 * globals.css, que também esconde o resto da interface). Assim o botão
 * "Exportar PDF" reaproveita o print-to-PDF do navegador em vez de trazer
 * uma dependência nova de geração de PDF.
 */
export function PrintSheet({ hex, lore }: { hex: HexData; lore?: HexLore }) {
  if (!lore) return null;

  return (
    <div className="print-sheet">
      <h1>{hex.publicName || lore.title}</h1>
      <p className="print-meta">Hexágono {hex.q}, {hex.r}{lore.region?.name ? ` · ${lore.region.name}` : ''}</p>

      <section><h2>Visão geral</h2><p>{lore.overview}</p></section>
      {lore.atmosphere && <section><h2>Atmosfera</h2><p>{lore.atmosphere}</p></section>}
      {lore.landmark && (
        <section><h2>Marco</h2><p><strong>{lore.landmark.name}</strong> — {lore.landmark.description}</p></section>
      )}
      {lore.history && <section><h2>História</h2><p>{lore.history}</p></section>}

      {lore.legends?.length ? (
        <section>
          <h2>Lendas</h2>
          {lore.legends.map((legend) => <p key={legend.title}><strong>{legend.title}:</strong> {legend.text}</p>)}
        </section>
      ) : null}

      {lore.rumors?.length ? (
        <section>
          <h2>Rumores</h2>
          <ul>{lore.rumors.map((rumor, index) => <li key={index}>{rumor.text}</li>)}</ul>
        </section>
      ) : null}

      {lore.fauna?.length ? (
        <section>
          <h2>Fauna</h2>
          <ul>{lore.fauna.map((item) => <li key={item.name}>{item.name} — {item.behavior}</li>)}</ul>
        </section>
      ) : null}

      {(lore.monsters ?? lore.knownThreats)?.length ? (
        <section>
          <h2>Ameaças conhecidas</h2>
          {(lore.monsters ?? lore.knownThreats ?? []).map((monster) => (
            <p key={monster.name}><strong>{monster.name}</strong>{monster.appearance ? ` — ${monster.appearance}` : ''}</p>
          ))}
        </section>
      ) : null}

      {lore.playerSummary && <section><h2>Resumo</h2><p>{lore.playerSummary}</p></section>}
    </div>
  );
}
