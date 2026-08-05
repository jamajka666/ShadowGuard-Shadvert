import React, { useState } from 'react';
import { SimpleResultCard } from './SimpleResultCard';
import { exampleSimpleResults } from './mapSimpleResult';
import { calmTokens } from './tokens';

/**
 * Local / branch-only preview for Simple result cards.
 * Open: /design-v2  (not linked from First Creation footer)
 */
export function DesignV2Sandbox() {
  const examples = exampleSimpleResults();
  const [note, setNote] = useState<string | null>(null);

  return (
    <div
      className="min-h-screen py-8 px-4"
      style={{ background: calmTokens.pageBg, color: calmTokens.text }}
    >
      <div className="max-w-2xl mx-auto mb-8 space-y-2">
        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: calmTokens.accent }}>
          ui/design-v2 · sandbox
        </p>
        <h1 className="text-2xl sm:text-3xl font-black">Výsledková karta — režim Jednoduchý</h1>
        <p className="text-base leading-relaxed" style={{ color: calmTokens.textMuted }}>
          Statické příklady karet. Pro živou closed beta s reálnou analýzou použijte{' '}
          <a href="/?mode=simple" className="font-bold underline" style={{ color: calmTokens.accent }}>
            /?mode=simple
          </a>{' '}
          nebo <code className="text-sm">/simple</code>. Spec:{' '}
          <code className="text-sm">docs/SIMPLE-RESULT-CARD.md</code>
        </p>
        {note && (
          <p
            className="text-sm font-semibold rounded-lg px-3 py-2 border"
            style={{ background: calmTokens.accentSoft, borderColor: calmTokens.border }}
          >
            {note}
          </p>
        )}
        <div className="flex flex-wrap gap-4 text-sm font-semibold">
          <a href="/?mode=simple" className="underline" style={{ color: calmTokens.accent }}>
            Otevřít živý režim Jednoduchý →
          </a>
          <a href="/" className="underline" style={{ color: calmTokens.textMuted }}>
            ← First Creation UI
          </a>
        </div>
      </div>

      <div className="flex flex-col gap-10 max-w-2xl mx-auto pb-16">
        {examples.map((model) => (
          <section key={model.status}>
            <p
              className="text-xs font-mono mb-3"
              style={{ color: calmTokens.textMuted }}
            >
              safetyLevel = {model.status}
            </p>
            <SimpleResultCard
              model={model}
              onShowMore={() =>
                setNote(`„Zobrazit více“ u stavu ${model.badgeLabel} — později přepne do Rozšířeného.`)
              }
              onReset={() => setNote('Reset — později nová kontrola.')}
            />
          </section>
        ))}
      </div>
    </div>
  );
}
