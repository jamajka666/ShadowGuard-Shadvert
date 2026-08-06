import React, { useEffect, useState } from 'react';
import { Mail, X } from 'lucide-react';
import type { AdCheckResult } from '../types';
import {
  disableBannerPermanently,
  markStatsReportOffered,
  markStatsReportSent,
  openStatsMailto,
  setReminderPref,
  shouldOfferStatsEmailPrompt,
  snoozeStatsBanner,
  DEFAULT_REPORT_INTERVAL_MS,
} from '../utils/emailReport';

type Props = {
  history: AdCheckResult[];
  /** Soft styling for simple / classic themes */
  variant?: 'dark' | 'light';
};

/**
 * Gentle, optional prompt to e-mail local stats.
 * Default cadence weekly; fully dismissible — never auto-sends.
 */
export function StatsEmailPromptBanner({ history, variant = 'dark' }: Props) {
  const [visible, setVisible] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    setVisible(shouldOfferStatsEmailPrompt(history.length));
  }, [history.length]);

  if (!visible) return null;

  const isLight = variant === 'light';

  const dismissSnoozeWeek = () => {
    setReminderPref('7d');
    snoozeStatsBanner(DEFAULT_REPORT_INTERVAL_MS);
    markStatsReportOffered();
    setVisible(false);
  };

  const dismissForever = () => {
    disableBannerPermanently();
    setVisible(false);
  };

  const send = () => {
    const result = openStatsMailto(history);
    if (result.ok) {
      markStatsReportSent();
      setHint(
        result.truncated
          ? 'Poštovní appka otevřena (text zkrácen). Odešlete jen pokud chcete.'
          : 'Poštovní appka otevřena. Report je volitelný — nic neodešlo automaticky.'
      );
      // Hide after short delay so user can read hint, or keep until X
      setTimeout(() => setVisible(false), 4000);
    } else {
      setHint('E-mail se nepodařilo otevřít. V Historii použijte „E-mail statistika“ nebo Export CSV.');
    }
  };

  return (
    <div
      className={`w-full border-b px-3 py-2.5 ${
        isLight
          ? 'bg-slate-50 border-slate-200 text-slate-700'
          : 'bg-slate-900/95 border-slate-700/80 text-slate-200'
      }`}
      role="region"
      aria-label="Volitelná připomínka reportu"
    >
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <p className="text-xs sm:text-sm leading-snug flex-1">
          <span className="font-bold">Volitelně:</span> můžete si nechat otevřít e-mail se souhrnem
          kontrol z <em>tohoto</em> zařízení (počty podvodů). Nic se neodesílá samo a neprochází
          serverem Shadvert — jen vaše poštovní appka, pokud potvrdíte odeslání.
        </p>
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={send}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold ${
              isLight
                ? 'bg-sky-600 text-white hover:bg-sky-500'
                : 'bg-sky-600 text-white hover:bg-sky-500'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            Otevřít e-mail
          </button>
          <button
            type="button"
            onClick={dismissSnoozeWeek}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border ${
              isLight
                ? 'border-slate-300 text-slate-600 hover:bg-slate-100'
                : 'border-slate-600 text-slate-300 hover:bg-slate-800'
            }`}
          >
            Připomenout za týden
          </button>
          <button
            type="button"
            onClick={dismissForever}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold ${
              isLight ? 'text-slate-500 hover:text-slate-800' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Už nepřipomínat
          </button>
          <button
            type="button"
            onClick={() => {
              markStatsReportOffered();
              setVisible(false);
            }}
            className={`p-1.5 rounded-lg ${isLight ? 'text-slate-400 hover:bg-slate-200' : 'text-slate-500 hover:bg-slate-800'}`}
            aria-label="Zavřít"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      {hint && (
        <p
          className={`max-w-5xl mx-auto mt-1.5 text-[11px] ${
            isLight ? 'text-sky-800' : 'text-sky-300/90'
          }`}
        >
          {hint}
        </p>
      )}
    </div>
  );
}
