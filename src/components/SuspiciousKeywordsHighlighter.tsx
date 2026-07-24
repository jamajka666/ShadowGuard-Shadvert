import React, { useState } from 'react';
import { AlertTriangle, Tag, Search, ShieldAlert, Sparkles, CheckCircle2, Info } from 'lucide-react';

interface SuspiciousKeywordsHighlighterProps {
  text: string;
  uiMode: 'senior' | 'cyber' | 'contrast';
}

export interface KeywordCategory {
  category: string;
  colorClass: string;
  badgeBg: string;
  icon: string;
  description: string;
}

// Map of words/regexes to category metadata
const SUSPICIOUS_DICTIONARY: Array<{
  pattern: RegExp;
  label: string;
  category: string;
  reason: string;
}> = [
  {
    pattern: /\b(záloh[auy]|zálohou|rezervaci|rezervační|rezervacni)\b/gi,
    label: 'Požadavek na zálohu',
    category: 'platba',
    reason: 'Podvodníci často žádají zálohu předem pod výmluvou velkého zájmu.',
  },
  {
    pattern: /\b(předem|predem|platba předem|poštovné předem|postovne predem|poplatek předem)\b/gi,
    label: 'Platba před převzetím',
    category: 'platba',
    reason: 'Zaplacení předem neznámému člověku na bazoši téměř vždy vede ke ztrátě peněz.',
  },
  {
    pattern: /\b(ihned|spěchá|specha|rychle|dnes|do hodiny)\b/gi,
    label: 'Tlak na rychlost',
    category: 'tlak',
    reason: 'Vyvolání časové tísně brání oběti v klidném rozmyšlení a poradě s rodinou.',
  },
  {
    pattern: /\b(neuvěřitelná cena|směšná cena|super cena|výhodná cena|neuvěřitelná|neuvěřitelné|super nabídka)\b/gi,
    label: 'Podezřele výhodná cena',
    category: 'cena',
    reason: 'Cena hluboko pod tržní hodnotou slouží jako neodolatelná návnada.',
  },
  {
    pattern: /\b(kurýr|kuryr|dpd|zásilkovna|zasilkovna|ppl|balíkovna|balikovna)\b/gi,
    label: 'Falešný kurýr / DPD',
    category: 'doprava',
    reason: 'Podvodníci posílají falešné odkazy na kurýrní služby k okradení platební karty.',
  },
  {
    pattern: /\b(whatsapp|viber|telegram|mimo bazoš|mimo bazos)\b/gi,
    label: 'Nespolehlivý komunikátor',
    category: 'komunikace',
    reason: 'Přechod na WhatsApp slouží k obcházení ochranných filtrů inzertního portálu.',
  },
  {
    pattern: /\b(dárková karta|darkova karta|paysafecard|psc|kupon|kupón|kryptoměna|bitcoin|usdt)\b/gi,
    label: 'Anonymní platba',
    category: 'platba',
    reason: 'Anonymní kupony a kryptoměny nelze zpětně dohledat ani reklamovat u banky.',
  },
  {
    pattern: /\b(číslo karty|cislo karty|kód z sms|kod z sms|pin|přihlášení do banky|heslo|cvv|cvc)\b/gi,
    label: 'Žádost o citlivé údaje',
    category: 'banka',
    reason: 'Nikdy nikomu nesdělujte údaje z bankovní karty ani SMS kódy!',
  },
  {
    pattern: /\b(odkaz|link|potvrdit platbu|ověřit účet|overit ucet|klikněte zde)\b/gi,
    label: 'Rizikový odkaz',
    category: 'odkaz',
    reason: 'Odkazy poslané cizí osobou vedou na podvodné stránky napodobující banky.',
  },
  {
    pattern: /\b(sleva|zadarmo|zdarma|daruji za odvoz)\b/gi,
    label: 'Atraktivní lákadlo',
    category: 'cena',
    reason: 'Věci zdarma nebo v neuvěřitelné slevě bývají zneužity k vylákání poštovného.',
  },
];

export const SuspiciousKeywordsHighlighter: React.FC<SuspiciousKeywordsHighlighterProps> = ({
  text,
  uiMode,
}) => {
  const [selectedWord, setSelectedWord] = useState<{ word: string; reason: string; label: string } | null>(null);

  if (!text || text.trim().length === 0) {
    return null;
  }

  const isCyber = uiMode === 'cyber';
  const isContrast = uiMode === 'contrast';

  // Find all matched keywords in the text
  const matches: Array<{
    start: number;
    end: number;
    word: string;
    label: string;
    reason: string;
  }> = [];

  SUSPICIOUS_DICTIONARY.forEach((dict) => {
    // Reset regex index
    const regex = new RegExp(dict.pattern.source, 'gi');
    let m;
    while ((m = regex.exec(text)) !== null) {
      matches.push({
        start: m.index,
        end: m.index + m[0].length,
        word: m[0],
        label: dict.label,
        reason: dict.reason,
      });
    }
  });

  // Sort matches by start position and eliminate overlapping ranges
  matches.sort((a, b) => a.start - b.start);
  const filteredMatches: typeof matches = [];
  let lastEnd = 0;
  for (const match of matches) {
    if (match.start >= lastEnd) {
      filteredMatches.push(match);
      lastEnd = match.end;
    }
  }

  // Construct text elements
  const renderHighlightedText = () => {
    if (filteredMatches.length === 0) {
      return <span>{text}</span>;
    }

    const elements: React.ReactNode[] = [];
    let currentIndex = 0;

    filteredMatches.forEach((match, idx) => {
      // Non-matched text before
      if (match.start > currentIndex) {
        elements.push(
          <span key={`text-${currentIndex}`}>
            {text.slice(currentIndex, match.start)}
          </span>
        );
      }

      // Matched word
      elements.push(
        <button
          key={`match-${idx}`}
          type="button"
          onClick={() => setSelectedWord({ word: match.word, reason: match.reason, label: match.label })}
          className={`inline-flex items-center gap-1 font-black px-2 py-0.5 mx-0.5 rounded-lg border transition-all hover:scale-105 cursor-pointer ${
            isCyber
              ? 'bg-rose-500/30 text-rose-300 border-rose-500/80 shadow-[0_0_12px_rgba(244,63,94,0.5)]'
              : isContrast
              ? 'bg-yellow-400 text-black border-black font-black underline'
              : 'bg-amber-300 text-slate-950 border-amber-500 shadow-sm'
          }`}
          title={`${match.label}: Kliknutím zobrazíte proč jde o riziko`}
        >
          <span>{match.word}</span>
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 inline shrink-0" />
        </button>
      );

      currentIndex = match.end;
    });

    // Remaining text after last match
    if (currentIndex < text.length) {
      elements.push(
        <span key={`text-end`}>
          {text.slice(currentIndex)}
        </span>
      );
    }

    return elements;
  };

  return (
    <div
      className={`p-6 rounded-3xl border-2 shadow-xl my-6 transition-all ${
        isCyber
          ? 'bg-slate-950 border-rose-500/50 text-slate-100 shadow-[0_0_30px_rgba(225,29,72,0.15)]'
          : isContrast
          ? 'bg-black border-yellow-400 text-white'
          : 'bg-amber-50/70 border-amber-300 text-slate-900'
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-700/60">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-2xl ${
              isCyber
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                : 'bg-amber-500 text-slate-950 font-black'
            }`}
          >
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black flex items-center gap-2">
              <span>Zvýraznění rizikových slov v textu inzerátu</span>
              {filteredMatches.length > 0 && (
                <span className="bg-rose-600 text-white text-xs font-black px-2.5 py-0.5 rounded-full">
                  {filteredMatches.length} {filteredMatches.length === 1 ? 'nález' : filteredMatches.length < 5 ? 'nálezy' : 'nálezů'}
                </span>
              )}
            </h3>
            <p className={`text-xs sm:text-sm ${isCyber ? 'text-slate-400' : 'text-slate-600'}`}>
              Rizikové výrazy používané podvodníky k manipulaci a nátlaku jsou zvýrazněny níže
            </p>
          </div>
        </div>

        <span className="text-[11px] font-bold text-slate-400 bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-800 self-start sm:self-auto">
          💡 Klikněte na zvýrazněné slovo pro vysvětlení
        </span>
      </div>

      {/* Main text box with highlights */}
      <div
        className={`mt-4 p-5 rounded-2xl border font-sans leading-relaxed text-sm sm:text-base ${
          isCyber
            ? 'bg-slate-900/80 border-slate-800 text-slate-200'
            : isContrast
            ? 'bg-black border-yellow-400 text-white'
            : 'bg-white border-slate-200 text-slate-800 shadow-inner'
        }`}
      >
        {renderHighlightedText()}
      </div>

      {/* Explanatory callout for clicked word */}
      {selectedWord && (
        <div className="mt-4 p-4 rounded-2xl bg-slate-900 border-2 border-amber-400 text-slate-100 flex items-start gap-3 animate-in fade-in">
          <Info className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-black text-amber-300 text-sm">
                Proč je výraz "{selectedWord.word}" nebezpečný?
              </span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-500/40 uppercase">
                {selectedWord.label}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              {selectedWord.reason}
            </p>
          </div>
        </div>
      )}

      {/* Summary of findings if any */}
      {filteredMatches.length > 0 ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-slate-400">Nalezené typy varovných signálů:</span>
          {Array.from(new Set(filteredMatches.map((m) => m.label))).map((label, idx) => (
            <span
              key={idx}
              className={`px-2.5 py-1 rounded-lg font-bold border ${
                isCyber
                  ? 'bg-slate-900 text-rose-300 border-rose-500/40'
                  : 'bg-amber-100 text-amber-950 border-amber-300'
              }`}
            >
              ⚠ {label}
            </span>
          ))}
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-2 text-xs text-emerald-400 font-bold">
          <CheckCircle2 className="w-4 h-4" />
          <span>V textu nebyla detekována žádná prvoplánová varovná slova (např. záloha, WhatsApp, DPD).</span>
        </div>
      )}
    </div>
  );
};
