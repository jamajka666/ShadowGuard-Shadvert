import React, { useEffect, useState } from 'react';
import { Palette, ClipboardList, X, Download, Check, Copy, Share2, Mail } from 'lucide-react';
import { shareOrDownloadFile, copyTextToClipboard } from '../utils/shareFile';
import { exportFileNameFlat } from '../utils/exportPaths';
import {
  mapSwatchIdToLookOption,
  openSurveyMailto,
} from '../utils/emailReport';

/** First Creation lab: color swatchbook + short feedback questionnaire (non-breaking for dad's main path). */

export type ColorSwatch = {
  id: string;
  name: string;
  tag: string;
  bg: string;
  card: string;
  accent: string;
  text: string;
  note: string;
};

/** 15 simple CSS “how it could look” chips — including unexpected combos */
export const COLOR_SWATCHES: ColorSwatch[] = [
  {
    id: 'fc-cyber',
    name: 'First Creation (live)',
    tag: 'současná',
    bg: '#020617',
    card: '#0f172a',
    accent: '#22d3ee',
    text: '#e2e8f0',
    note: 'Cyber dark + cyan — to, co teď běží',
  },
  {
    id: 'calm-green',
    name: 'Klidná zelená',
    tag: 'favorit debaty',
    bg: '#f4f7f4',
    card: '#ffffff',
    accent: '#2f6f4e',
    text: '#1a2332',
    note: 'Světlá, důvěra, default pro tátu (návrh)',
  },
  {
    id: 'dark-blue',
    name: 'Moderní tmavá',
    tag: 'volba',
    bg: '#0b1220',
    card: '#151d2e',
    accent: '#60a5fa',
    text: '#e8eef8',
    note: 'Tmavá jako přepínač, ne homepage',
  },
  {
    id: 'warm-gold',
    name: 'Teplá zlatá',
    tag: 'brand',
    bg: '#faf6ef',
    card: '#fffdf8',
    accent: '#b8860b',
    text: '#2a2114',
    note: 'Teplá, lidská; opatrně se semaforem',
  },
  {
    id: 'high-contrast',
    name: 'Vysoký kontrast',
    tag: 'a11y',
    bg: '#000000',
    card: '#111111',
    accent: '#facc15',
    text: '#ffffff',
    note: 'Pro slabší zrak',
  },
  {
    id: 'soft-mint',
    name: 'Mátová pastela',
    tag: 'měkká',
    bg: '#f0fdf9',
    card: '#ffffff',
    accent: '#0d9488',
    text: '#134e4a',
    note: 'Velmi klidná, méně „security product“',
  },
  {
    id: 'ocean',
    name: 'Oceánská',
    tag: 'chladná',
    bg: '#f0f9ff',
    card: '#ffffff',
    accent: '#0284c7',
    text: '#0c4a6e',
    note: 'Čistá, institucionální',
  },
  {
    id: 'forest',
    name: 'Lesní',
    tag: 'hluboká',
    bg: '#f1f5f0',
    card: '#ffffff',
    accent: '#166534',
    text: '#14532d',
    note: 'Silnější zelená, stále světlá',
  },
  {
    id: 'sand',
    name: 'Písek / papír',
    tag: 'senior',
    bg: '#f7f3ea',
    card: '#fffcf5',
    accent: '#a16207',
    text: '#292524',
    note: 'Teplý papír, rodinný dojem',
  },
  {
    id: 'lavender',
    name: 'Levandule',
    tag: 'neočekávaná',
    bg: '#faf5ff',
    card: '#ffffff',
    accent: '#7c3aed',
    text: '#1e1b4b',
    note: 'Nečekaná, klidná, méně „banka“',
  },
  {
    id: 'rose',
    name: 'Růžovo-šedá',
    tag: 'neočekávaná',
    bg: '#fff1f2',
    card: '#ffffff',
    accent: '#e11d48',
    text: '#4c0519',
    note: 'Teplá; červená jen pro podvod stavy',
  },
  {
    id: 'slate-green',
    name: 'Břidlice + green',
    tag: 'hybrid',
    bg: '#e8eef2',
    card: '#ffffff',
    accent: '#059669',
    text: '#0f172a',
    note: 'Světlá šedomodrá plocha + zelený akcent',
  },
  {
    id: 'midnight-amber',
    name: 'Půlnoc + jantar',
    tag: 'dark alt',
    bg: '#0f1115',
    card: '#1a1d24',
    accent: '#ffb020',
    text: '#f8fafc',
    note: 'ChatGPT koncept 1 — dark, méně červené',
  },
  {
    id: 'stealth-green',
    name: 'Stealth green',
    tag: 'dark alt',
    bg: '#121619',
    card: '#1a2226',
    accent: '#00e676',
    text: '#ecfdf5',
    note: 'ChatGPT/Gemini dark green SOC-feel',
  },
  {
    id: 'classic-white',
    name: 'Klasická bílá',
    tag: 'neutrální',
    bg: '#ffffff',
    card: '#f8fafc',
    accent: '#2563eb',
    text: '#0f172a',
    note: 'Úplně obyčejná webová app — málo brandu',
  },
];

const QUESTIONS: { id: string; q: string; options: string[] }[] = [
  {
    id: 'overall',
    q: 'Jak na vás Shadvert celkově působí?',
    options: ['Velmi příjemně', 'Spíš příjemně', 'Neutrálně', 'Spíš nepřehledně', 'Nepříjemně'],
  },
  {
    id: 'clarity',
    q: 'Je jasné, co máte udělat jako první?',
    options: ['Ano, hned', 'Po chvilce', 'Spíš ne', 'Vůbec ne'],
  },
  {
    id: 'result',
    q: 'Rozumíte výsledku kontroly (verdikt)?',
    options: ['Ano, hned', 'Částečně', 'Spíš ne', 'Ne'],
  },
  {
    id: 'look',
    q: 'Který vzhled byste preferovali jako hlavní?',
    options: [
      'Jak to je teď (tmavé cyber)',
      'Světlé s klidnou zelenou',
      'Tmavé, ale klidnější',
      'Teplé zlaté / pískové',
      'Je mi to jedno',
    ],
  },
  {
    id: 'dark',
    q: 'Tmavý vzhled by měl být…',
    options: ['Hlavní (default)', 'Jen volba v nastavení', 'Vůbec ne', 'Nevím'],
  },
  {
    id: 'features',
    q: 'Je na hlavní stránce spíš…',
    options: ['Akorát funkcí', 'Trochu moc věcí', 'Málo věcí', 'Nevím'],
  },
  {
    id: 'trust',
    q: 'Důvěřovali byste doporučení aplikace?',
    options: ['Ano', 'Spíš ano', 'Spíš ne', 'Ne', 'Záleží na situaci'],
  },
  {
    id: 'recommend',
    q: 'Doporučili byste to rodiči / známému?',
    options: ['Určitě ano', 'Spíš ano', 'Spíš ne', 'Ne'],
  },
  {
    id: 'swatch',
    q: 'Která barva ze vzorkovnice se vám líbí nejvíc? (napište název nebo ID)',
    options: [], // free text
  },
  {
    id: 'note',
    q: 'Jedna věta navíc (volitelné)',
    options: [], // free text
  },
];

const STORAGE_KEY = 'shadvert_first_creation_lab_feedback';
const SWATCH_VOTE_KEY = 'shadvert_swatch_vote';

/** Persist swatch pick into lab feedback answers (swatch free-text + look radio). */
export function applySwatchToSurveyAnswers(swatch: ColorSwatch): void {
  try {
    localStorage.setItem(SWATCH_VOTE_KEY, swatch.id);
    const raw = localStorage.getItem(STORAGE_KEY);
    const prev: Record<string, string> = raw ? JSON.parse(raw) : {};
    const next: Record<string, string> = {
      ...prev,
      swatch: `${swatch.name} (${swatch.id})`,
    };
    const look = mapSwatchIdToLookOption(swatch.id);
    // Click on a color is an explicit choice for the look / motif question
    if (look) {
      next.look = look;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

type Props = {
  themeMode?: string;
};

export function DesignLabFooter({ themeMode }: Props) {
  const [swatchOpen, setSwatchOpen] = useState(false);
  const [surveyOpen, setSurveyOpen] = useState(false);
  const [swatchHint, setSwatchHint] = useState<string | null>(null);
  const isLight = themeMode === 'classic';
  const isContrast = themeMode === 'highContrast';
  const btn =
    isContrast
      ? 'border-yellow-400 bg-black text-yellow-300 hover:bg-yellow-950'
      : isLight
        ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900'
        : 'border-slate-600/50 bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white';
  const hint = isLight ? 'text-slate-400' : 'text-slate-600';

  return (
    <>
      <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
        <button
          type="button"
          onClick={() => setSwatchOpen(true)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${btn}`}
        >
          <Palette className="w-3.5 h-3.5" />
          Vzorkovnice barev
        </button>
        <button
          type="button"
          onClick={() => setSurveyOpen(true)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${btn}`}
        >
          <ClipboardList className="w-3.5 h-3.5" />
          Krátký dotazník
        </button>
      </div>
      <p className={`text-[10px] mt-2 max-w-md mx-auto leading-snug ${hint}`}>
        First Creation lab — jen nápady a zpětná vazba. Nemění hlavní vzhled pro tátu.
      </p>
      {swatchHint && (
        <p className="text-[11px] mt-1.5 text-center text-emerald-400/90 max-w-md mx-auto">
          {swatchHint}{' '}
          <button
            type="button"
            className="underline font-semibold"
            onClick={() => {
              setSwatchHint(null);
              setSurveyOpen(true);
            }}
          >
            Otevřít dotazník
          </button>
        </p>
      )}

      {swatchOpen && (
        <SwatchModal
          onClose={() => setSwatchOpen(false)}
          onPicked={(s) => {
            setSwatchHint(`Barva „${s.name}“ je propsaná do otázky o barevném motivu.`);
          }}
        />
      )}
      {surveyOpen && <SurveyModal onClose={() => setSurveyOpen(false)} />}
    </>
  );
}

function SwatchModal({
  onClose,
  onPicked,
}: {
  onClose: () => void;
  onPicked?: (s: ColorSwatch) => void;
}) {
  const [picked, setPicked] = useState<string | null>(() => {
    try {
      return localStorage.getItem(SWATCH_VOTE_KEY);
    } catch {
      return null;
    }
  });

  const vote = (s: ColorSwatch) => {
    setPicked(s.id);
    applySwatchToSurveyAnswers(s);
    onPicked?.(s);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-3 bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Vzorkovnice barev">
      <div className="w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-2xl bg-slate-950 border border-slate-700 shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-800 bg-slate-950/95">
          <div>
            <h2 className="text-base font-bold text-white">Vzorkovnice barev</h2>
            <p className="text-xs text-slate-400">
              15 nápadů — kliknutím označíte favorita a propsání do dotazníku (vzhled appky se nemění)
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-800" aria-label="Zavřít">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {COLOR_SWATCHES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => vote(s)}
              className={`text-left rounded-xl border overflow-hidden transition ${
                picked === s.id ? 'border-emerald-400 ring-2 ring-emerald-500/40' : 'border-slate-700 hover:border-slate-500'
              }`}
            >
              <div className="p-3" style={{ background: s.bg }}>
                <div
                  className="rounded-lg p-3 shadow-sm"
                  style={{ background: s.card, color: s.text, border: `1px solid ${s.accent}33` }}
                >
                  <div className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: s.accent }}>
                    {s.tag}
                  </div>
                  <div className="text-sm font-black leading-tight mb-2">Tento inzerát vypadá v pořádku.</div>
                  <div className="flex gap-1 mb-2">
                    <span className="w-6 h-2 rounded-full" style={{ background: s.accent }} />
                    <span className="w-6 h-2 rounded-full opacity-40" style={{ background: s.accent }} />
                    <span className="w-6 h-2 rounded-full opacity-20" style={{ background: s.text }} />
                  </div>
                  <div
                    className="text-center text-[11px] font-bold py-1.5 rounded-lg"
                    style={{ background: s.accent, color: s.bg === '#f4f7f4' || s.bg.startsWith('#f') || s.bg === '#ffffff' || s.bg === '#faf6ef' || s.bg === '#f0fdf9' || s.bg === '#f0f9ff' || s.bg === '#f1f5f0' || s.bg === '#f7f3ea' || s.bg === '#faf5ff' || s.bg === '#fff1f2' || s.bg === '#e8eef2' ? '#fff' : '#0a0a0a' }}
                  >
                    Ověřit
                  </div>
                </div>
              </div>
              <div className="px-3 py-2 bg-slate-900 flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-bold text-slate-100 flex items-center gap-1">
                    {picked === s.id && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    {s.name}
                  </div>
                  <div className="text-[11px] text-slate-400 leading-snug">{s.note}</div>
                  <div className="text-[10px] text-slate-600 font-mono mt-0.5">{s.id}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function loadSurveyAnswers(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const answers: Record<string, string> = raw ? JSON.parse(raw) : {};
    // Prefill swatch free-text from last color vote if empty
    if (!answers.swatch) {
      const voteId = localStorage.getItem(SWATCH_VOTE_KEY);
      if (voteId) {
        const sw = COLOR_SWATCHES.find((c) => c.id === voteId);
        if (sw) {
          answers.swatch = `${sw.name} (${sw.id})`;
          const look = mapSwatchIdToLookOption(sw.id);
          if (look && !answers.look) answers.look = look;
        } else {
          answers.swatch = voteId;
        }
      }
    }
    return answers;
  } catch {
    return {};
  }
}

function SurveyModal({ onClose }: { onClose: () => void }) {
  const [answers, setAnswers] = useState<Record<string, string>>(() => loadSurveyAnswers());
  const [saved, setSaved] = useState(false);
  const [exportHint, setExportHint] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
    } catch {
      /* ignore */
    }
  }, [answers]);

  const setA = (id: string, v: string) => {
    setAnswers((prev) => ({ ...prev, [id]: v }));
    setSaved(false);
    setExportHint(null);
  };

  const buildPayload = () => ({
    versionLabel: 'First Creation',
    savedAt: new Date().toISOString(),
    swatchVote: (() => {
      try {
        return localStorage.getItem(SWATCH_VOTE_KEY);
      } catch {
        return null;
      }
    })(),
    answers,
  });

  const download = async () => {
    const payload = buildPayload();
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const fileName = exportFileNameFlat('feedback-dotaznik', 'json');
    const result = await shareOrDownloadFile(blob, fileName, {
      mimeType: 'application/json',
      title: 'ShadowGuard feedback',
      text: 'Odpovědi z dotazníku First Creation',
      saveToAppServer: true,
      preferAppFolder: true,
    });
    setSaved(true);
    if (result === 'shared') {
      setExportHint('Sdíleno — např. do Souborů, Mailu nebo AirDrop. Kopie i do data/exports na serveru (s kódem).');
    } else if (result === 'opened') {
      setExportHint('Soubor otevřen — na iPhonu použijte Sdílet → Uložit do Souborů.');
    } else if (result === 'saved-local') {
      setExportHint('Uloženo do složky ShadowGuard-exports (a na server data/exports, pokud máte rodinný kód).');
    } else if (result === 'downloaded') {
      setExportHint('JSON stažen · na Lenovu se ukládá i do data/exports (s rodinným kódem).');
    } else {
      setExportHint('Export se nepodařil — zkuste „Zkopírovat odpovědi“.');
    }
  };

  const copyAnswers = async () => {
    const json = JSON.stringify(buildPayload(), null, 2);
    const ok = await copyTextToClipboard(json);
    setSaved(true);
    setExportHint(
      ok
        ? 'Odpovědi zkopírovány do schránky — vložte je do e-mailu / zprávy zakladateli.'
        : 'Kopírování selhalo. Zkuste Sdílet / stáhnout JSON.'
    );
  };

  const sendEmail = () => {
    const result = openSurveyMailto(buildPayload());
    setSaved(true);
    if (result.ok === true) {
      setExportHint(
        result.truncated
          ? 'E-mailová appka se otevřela (tělo zkráceno kvůli limitu). Zkontrolujte a odešlete. Nic nešlo přes server Shadvert.'
          : 'E-mailová appka se otevřela s předvyplněným reportem. Stačí zkontrolovat a odeslat. Nic neposíláme přes server Shadvert.'
      );
    } else {
      const why = result.ok === false ? result.reason : 'blocked';
      setExportHint(
        why === 'empty'
          ? 'Není co odeslat — vyplňte aspoň jednu odpověď.'
          : 'E-mail se nepodařilo otevřít. Zkuste Sdílet JSON nebo Zkopírovat odpovědi.'
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-3 bg-black/70 backdrop-blur-sm safe-area-inset"
      role="dialog"
      aria-modal="true"
      aria-label="Dotazník"
    >
      <div className="w-full max-w-lg modal-max-h overflow-y-auto rounded-2xl bg-slate-950 border border-slate-700 shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-800 bg-slate-950/95">
          <div>
            <h2 className="text-base font-bold text-white">Krátký dotazník</h2>
            <p className="text-xs text-slate-400">
              Volitelná zpětná vazba · zůstává v tomto zařízení, dokud sami nesdílíte / neodešlete e-mail
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-800" aria-label="Zavřít">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-5">
          {QUESTIONS.map((item, i) => (
            <div key={item.id}>
              <label className="block text-sm font-bold text-slate-200 mb-2">
                {i + 1}. {item.q}
              </label>
              {item.options.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  {item.options.map((opt) => (
                    <label
                      key={opt}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer text-sm ${
                        answers[item.id] === opt
                          ? 'border-emerald-500 bg-emerald-950/40 text-emerald-100'
                          : 'border-slate-700 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      <input
                        type="radio"
                        name={item.id}
                        value={opt}
                        checked={answers[item.id] === opt}
                        onChange={() => setA(item.id, opt)}
                        className="accent-emerald-500"
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              ) : (
                <input
                  type="text"
                  value={answers[item.id] || ''}
                  onChange={(e) => setA(item.id, e.target.value)}
                  placeholder="Vaše odpověď…"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm"
                />
              )}
            </div>
          ))}

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={sendEmail}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm bg-sky-600 hover:bg-sky-500 text-white"
            >
              <Mail className="w-4 h-4" />
              Odeslat na e-mail (volitelné)
            </button>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => void download()}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                <Share2 className="w-4 h-4" />
                <Download className="w-4 h-4" />
                {saved ? 'Sdílet / stáhnout znovu' : 'Sdílet nebo stáhnout (JSON)'}
              </button>
              <button
                type="button"
                onClick={() => void copyAnswers()}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-600"
              >
                <Copy className="w-4 h-4" />
                Zkopírovat odpovědi
              </button>
            </div>
          </div>
          {exportHint && (
            <p className="text-xs text-emerald-300/90 text-center bg-emerald-950/40 border border-emerald-800/50 rounded-xl px-3 py-2">
              {exportHint}
            </p>
          )}
          <p className="text-[11px] text-slate-500 text-center">
            First Creation lab · neposíláme data automaticky · e-mail jde jen přes vaši poštovní appku (ne přes server Shadvert)
          </p>
        </div>
      </div>
    </div>
  );
}
