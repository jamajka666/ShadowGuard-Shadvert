import React from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert, ChevronRight } from 'lucide-react';
import type { SimpleResultCardProps } from './simpleResultTypes';
import { calmTokens, statusTokens } from './tokens';

/**
 * Simple-mode result card — same layout for all three safety states.
 * Design-v2 only; not wired as First Creation default.
 */
export function SimpleResultCard({
  model,
  onShowMore,
  onReset,
  showMoreLabel = 'Zobrazit více podrobností',
}: SimpleResultCardProps) {
  const st = statusTokens[model.status];

  const Icon =
    st.icon === 'check' ? ShieldCheck : st.icon === 'caution' ? AlertTriangle : ShieldAlert;

  return (
    <article
      className="w-full max-w-lg mx-auto rounded-2xl border shadow-sm overflow-hidden"
      style={{
        background: calmTokens.cardBg,
        borderColor: calmTokens.border,
        color: calmTokens.text,
      }}
      aria-label={`Výsledek: ${model.badgeLabel}`}
    >
      <div className="p-5 sm:p-6 space-y-5">
        {/* 1. Status badge */}
        <div
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border text-sm sm:text-base font-bold"
          style={{
            background: st.badgeBg,
            color: st.badgeText,
            borderColor: st.badgeBorder,
          }}
        >
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" aria-hidden />
          <span>{model.badgeLabel}</span>
        </div>

        {/* 2. Main verdict — largest text */}
        <h2
          className="text-2xl sm:text-3xl font-black leading-snug tracking-tight"
          style={{ color: calmTokens.text }}
        >
          {model.mainVerdict}
        </h2>

        {/* 3. Reasons */}
        <div>
          <h3
            className="text-xs font-bold uppercase tracking-wide mb-2"
            style={{ color: calmTokens.textMuted }}
          >
            Proč
          </h3>
          <ul className="space-y-2">
            {model.reasons.map((reason, i) => (
              <li key={i} className="flex gap-2.5 text-base sm:text-lg leading-snug">
                <span
                  className="mt-2 w-2 h-2 rounded-full shrink-0"
                  style={{ background: st.accent }}
                  aria-hidden
                />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 4. Advice */}
        <div
          className="rounded-xl px-4 py-3 border"
          style={{
            background: calmTokens.accentSoft,
            borderColor: calmTokens.border,
          }}
        >
          <h3
            className="text-xs font-bold uppercase tracking-wide mb-1"
            style={{ color: st.accent }}
          >
            Co teď
          </h3>
          <p className="text-base sm:text-lg font-semibold leading-snug">{model.advice}</p>
        </div>

        {/* 5. Show more */}
        <div className="flex flex-col gap-2 pt-1">
          {onShowMore && (
            <button
              type="button"
              onClick={onShowMore}
              className="w-full inline-flex items-center justify-center gap-1.5 min-h-[48px] px-4 rounded-xl text-base font-bold border transition hover:opacity-90"
              style={{
                borderColor: calmTokens.accent,
                color: calmTokens.accent,
                background: calmTokens.cardBg,
              }}
            >
              {showMoreLabel}
              <ChevronRight className="w-5 h-5" aria-hidden />
            </button>
          )}
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="w-full min-h-[48px] px-4 rounded-xl text-base font-semibold"
              style={{ color: calmTokens.textMuted }}
            >
              Zkontrolovat jiný inzerát
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
