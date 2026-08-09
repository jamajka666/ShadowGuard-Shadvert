/**
 * Expandable "Proč?" panel — Trust UX for OPATRNOSTI / NEVÍME / PODVOD.
 * NO-VERDICT ≠ NO-HELP: always show what we know, what we don't, what to do.
 */
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import type { AdCheckResult } from '../types';

interface WhyPanelCardProps {
  result: AdCheckResult;
  fontSize?: 'normal' | 'large' | 'xlarge';
}

const STATUS_LABEL: Record<string, string> = {
  OVERENO: 'Ověřeno',
  NEOVERENO: 'Neověřeno',
  SELHALO: 'Selhalo / riziko',
  SIGNAL: 'Varovný signál',
  NEPROVEDENO: 'Neproběhlo',
};

const STATUS_CLASS: Record<string, string> = {
  OVERENO: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  NEOVERENO: 'text-amber-300 bg-amber-500/10 border-amber-500/30',
  SELHALO: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
  SIGNAL: 'text-orange-300 bg-orange-500/10 border-orange-500/30',
  NEPROVEDENO: 'text-slate-400 bg-slate-500/10 border-slate-500/30',
};

export function WhyPanelCard({ result, fontSize = 'normal' }: WhyPanelCardProps) {
  const panel = result.whyPanel;
  const [open, setOpen] = useState(
    () => result.safetyLevel === 'OPATRNOSTI' || result.internalVerdict === 'NEVIME'
  );

  if (!panel?.show) return null;

  const textSize =
    fontSize === 'xlarge' ? 'text-lg' : fontSize === 'large' ? 'text-base' : 'text-sm';

  return (
    <div className="rounded-2xl border border-amber-500/25 bg-slate-900/80 overflow-hidden shadow-lg">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 font-bold text-amber-200">
          <HelpCircle className="w-5 h-5 shrink-0" aria-hidden />
          {panel.title}
        </span>
        {open ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>

      {open && (
        <div className={`px-4 pb-4 space-y-4 ${textSize} text-slate-200`}>
          <p className="text-slate-300 leading-relaxed border-l-2 border-amber-400/50 pl-3">
            {panel.lead}
          </p>

          {/* Table of checks */}
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 text-slate-400 text-xs uppercase tracking-wide">
                  <th className="p-2 font-semibold">Kontrola</th>
                  <th className="p-2 font-semibold">Stav</th>
                  <th className="p-2 font-semibold">Co to znamená</th>
                </tr>
              </thead>
              <tbody>
                {panel.checks.map((c) => (
                  <tr key={c.id} className="border-t border-white/5 align-top">
                    <td className="p-2 whitespace-nowrap">
                      <span className="mr-1" aria-hidden>
                        {c.icon}
                      </span>
                      {c.label}
                    </td>
                    <td className="p-2">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md border text-xs font-semibold ${STATUS_CLASS[c.status] || STATUS_CLASS.NEOVERENO}`}
                      >
                        {STATUS_LABEL[c.status] || c.status}
                      </span>
                    </td>
                    <td className="p-2 text-slate-300 leading-snug">{c.meaning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl bg-slate-800/80 border border-white/10 p-3 space-y-2">
            <p className="font-bold text-slate-100">💡 Co z toho plyne?</p>
            <p className="text-slate-300 leading-relaxed">{panel.doesNotMean}</p>
            <p className="text-slate-400 text-xs leading-relaxed">
              {panel.structure.whyBlocksStrongerVerdict}
            </p>
          </div>

          <div className="rounded-xl bg-emerald-950/40 border border-emerald-500/20 p-3 space-y-2">
            <p className="font-bold text-emerald-200">✅ Co doporučujeme</p>
            <ul className="list-disc list-inside space-y-1 text-slate-200">
              {(panel.recommendations || []).map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
