import React from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert, ChevronRight } from 'lucide-react';
import type { SimpleResultCardProps } from './simpleResultTypes';
import { calmTokens, statusTokens } from './tokens';

/**
 * Simple-mode result card — same layout for all three safety states.
 * Design-v2 only; not wired as First Creation default.
 * Polish: contrast (caution/danger), air, action hierarchy (Grok + Gemini review).
 */
export function SimpleResultCard({
  model,
  onShowMore,
  onReset,
  showMoreLabel = 'Zobrazit více podrobností',
}: SimpleResultCardProps) {
  const st = statusTokens[model.status];
  const isScam = model.status === 'PODVOD';
  const isCaution = model.status === 'OPATRNOSTI';

  const Icon =
    st.icon === 'check' ? ShieldCheck : st.icon === 'caution' ? AlertTriangle : ShieldAlert;

  return (
    <article
      className="w-full max-w-lg mx-auto rounded-2xl border shadow-sm overflow-hidden"
      style={{
        background: calmTokens.cardBg,
        borderColor: isScam ? st.badgeBorder : calmTokens.border,
        color: calmTokens.text,
      }}
      aria-label={`Výsledek: ${model.badgeLabel}`}
    >
      {/* Slightly roomier vertical rhythm (+8–12px air) */}
      <div className="p-5 sm:p-7 flex flex-col gap-6 sm:gap-7">
        {/* 1. Status badge — stronger fill on caution/scam */}
        <div
          className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full border-2 text-sm sm:text-base font-extrabold self-start"
          style={{
            background: st.badgeBg,
            color: st.badgeText,
            borderColor: st.badgeBorder,
          }}
        >
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" strokeWidth={2.5} aria-hidden />
          <span>{model.badgeLabel}</span>
        </div>

        {/* 2. Main verdict — extra weight on Podvod (severityity without size jump) */}
        <h2
          className={`text-2xl sm:text-3xl leading-snug tracking-tight ${
            isScam ? 'font-black' : 'font-extrabold'
          }`}
          style={{
            color: calmTokens.text,
            // Subtle letter-spacing tighten for black weight readability
            letterSpacing: isScam ? '-0.02em' : '-0.01em',
          }}
        >
          {model.mainVerdict}
        </h2>

        {/* 3. Reasons — extra top separation from verdict */}
        <div className="pt-1">
          <h3
            className="text-xs font-bold uppercase tracking-wide mb-3"
            style={{ color: calmTokens.textMuted }}
          >
            Proč
          </h3>
          <ul className="space-y-2.5">
            {model.reasons.map((reason, i) => (
              <li key={i} className="flex gap-3 text-base sm:text-lg leading-snug">
                <span
                  className="mt-2 w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: st.accent }}
                  aria-hidden
                />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 4. Advice — Podvod / Opatrnost: stronger calm emphasis */}
        <div
          className="rounded-xl px-4 py-4 border-2"
          style={{
            background: st.adviceBg,
            borderColor: st.adviceBorder,
            // Podvod: slightly thicker visual weight via left accent bar feel
            boxShadow: isScam ? `inset 4px 0 0 0 ${st.accent}` : undefined,
          }}
        >
          <h3
            className="text-xs font-extrabold uppercase tracking-wide mb-1.5"
            style={{ color: st.accent }}
          >
            Co teď
          </h3>
          <p
            className={`text-base sm:text-lg leading-snug ${
              isScam || isCaution ? 'font-bold' : 'font-semibold'
            }`}
            style={{ color: calmTokens.text }}
          >
            {model.advice}
          </p>
        </div>

        {/* 5. Actions — primary clear; secondary one step quieter */}
        <div className="flex flex-col gap-1 pt-1">
          {onShowMore && (
            <button
              type="button"
              onClick={onShowMore}
              className="w-full inline-flex items-center justify-center gap-1.5 min-h-[48px] px-4 rounded-xl text-base font-bold border-2 transition hover:opacity-90"
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
              className="w-full min-h-[44px] px-4 rounded-xl text-sm font-medium underline-offset-2 hover:underline"
              style={{ color: calmTokens.textFaint }}
            >
              Zkontrolovat jiný inzerát
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
