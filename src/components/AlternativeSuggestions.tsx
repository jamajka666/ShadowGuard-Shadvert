import React from 'react';
import { ShoppingBag, Building2, ExternalLink, ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { AdCheckResult, TrustedAlternative, ThemeMode } from '../types';

interface AlternativeSuggestionsProps {
  result: AdCheckResult;
  themeMode?: ThemeMode;
  uiMode?: 'senior' | 'cyber' | 'contrast' | 'shadowguard';
}

// Fallback default trusted alternatives if AI or server didn't generate explicit custom ones
const DEFAULT_FALLBACK_ALTERNATIVES: TrustedAlternative[] = [
  {
    name: 'Heureka.cz (Srovnání cen & Garance nákupu)',
    url: 'https://www.heureka.cz',
    description: 'Porovnejte ceny stejného zboží u stovek ověřených českých e-shopů se zákaznickými recenzemi a garancí vrácení peněz.',
    badge: 'Srovnávač & Garance',
    estimatedPrice: 'Ověřené tržní ceny',
  },
  {
    name: 'Alza.cz / Datart.cz (Oficiální prodejci)',
    url: 'https://www.alza.cz',
    description: 'Bezpečný nákup nového i zánovního či rozbaleného zboží s plnou 2letou zárukou, fakturou a osobním odběrem.',
    badge: 'Oficiální obchody',
    estimatedPrice: 'Plná 2letá záruka',
  },
  {
    name: 'Bazoš.cz / Sbazar.cz (Pouze osobní předání)',
    url: 'https://www.bazos.cz',
    description: 'Při nákupu z druhé ruky vždy vyhledejte nabídky ve vašem okrese a trvejte výhradně na osobním převzetí s vyzkoušením.',
    badge: 'Osobní odběr',
    estimatedPrice: 'Nákup z druhé ruky',
  },
];

export const AlternativeSuggestions: React.FC<AlternativeSuggestionsProps> = ({ result, themeMode, uiMode }) => {
  const isScam = result.safetyLevel === 'PODVOD';
  const isCaution = result.safetyLevel === 'OPATRNOSTI';

  // Only render if result is risky/scam or has trustedAlternatives
  const isRiskyOrScam = isScam || isCaution;
  const alternativesToDisplay =
    result.trustedAlternatives && result.trustedAlternatives.length > 0
      ? result.trustedAlternatives
      : isRiskyOrScam
      ? DEFAULT_FALLBACK_ALTERNATIVES
      : [];

  if (alternativesToDisplay.length === 0) {
    return null;
  }

  const isShadowGuard = themeMode === 'shadowguard' || uiMode === 'shadowguard';
  const isCyber = themeMode === 'cyberpunk' || uiMode === 'cyber';
  const isContrast = themeMode === 'highContrast' || uiMode === 'contrast';

  return (
    <div
      className={`p-6 sm:p-8 rounded-3xl border-2 shadow-2xl transition-all ${
        isShadowGuard
          ? 'bg-[#121214] border-[#CD7F32]/80 text-slate-100 shadow-[0_0_25px_rgba(212,160,23,0.2)] shadowguard-bronze-border'
          : isCyber
          ? 'bg-slate-950 border-cyan-500/60 text-slate-100 cyber-card-glow'
          : isContrast
          ? 'bg-black border-yellow-400 text-white'
          : 'bg-emerald-50/90 border-emerald-300 text-slate-900'
      }`}
    >
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div
            className={`p-3 rounded-2xl shrink-0 ${
              isCyber
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                : isContrast
                ? 'bg-yellow-400 text-black font-bold'
                : 'bg-emerald-600 text-white shadow-md'
            }`}
          >
            <ShoppingBag className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
              <span>Bezpečné a ověřené alternativy nákupu</span>
            </h3>
            <p
              className={`text-xs sm:text-sm font-medium ${
                isShadowGuard || isCyber
                  ? isCyber
                    ? 'text-cyan-300'
                    : 'text-slate-300'
                  : isContrast
                  ? 'text-yellow-100'
                  : 'text-slate-700'
              }`}
            >
              {isScam
                ? '⚠️ Tento inzerát vykazuje známky podvodu. Nereagujte na něj a zvolte prověřený obchod:'
                : isCaution
                ? '⚡ Nabídka vyžaduje zvýšenou opatrnost. Pro bezpečný nákup využijte tyto prověřené zdroje:'
                : 'Kde jinde můžete toto zboží zakoupit se zárukou a garancí:'}
            </p>
          </div>
        </div>

        <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 self-start sm:self-auto shrink-0 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>PROVĚŘENÉ ZDROJE</span>
        </span>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {alternativesToDisplay.map((alt, index) => (
          <div
            key={index}
            className={`p-5 rounded-2xl border flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${
              isCyber
                ? 'bg-slate-900/90 border-cyan-500/30 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                : isContrast
                ? 'bg-slate-900 border-yellow-400 text-white'
                : 'bg-white border-slate-300 shadow-sm hover:shadow-md hover:border-emerald-400 text-slate-950'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span
                  className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md ${
                    isCyber
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                      : isContrast
                      ? 'bg-yellow-400 text-black border border-yellow-300'
                      : 'bg-emerald-100 text-emerald-900 border border-emerald-400'
                  }`}
                >
                  {alt.badge || 'Prověřený obchod'}
                </span>
                {alt.estimatedPrice && (
                  <span
                    className={`text-xs font-bold font-mono ${
                      isCyber
                        ? 'text-cyan-400 neon-text-cyan'
                        : isContrast
                        ? 'text-yellow-300'
                        : 'text-emerald-800'
                    }`}
                  >
                    {alt.estimatedPrice}
                  </span>
                )}
              </div>

              <h4
                className={`text-base font-black mb-2 flex items-center gap-1.5 ${
                  isCyber || isContrast ? 'text-white' : 'text-slate-950'
                }`}
              >
                <Building2
                  className={`w-4 h-4 shrink-0 ${
                    isCyber ? 'text-cyan-400' : isContrast ? 'text-yellow-400' : 'text-emerald-700'
                  }`}
                />
                <span>{alt.name}</span>
              </h4>

              <p
                className={`text-xs leading-relaxed mb-4 ${
                  isCyber
                    ? 'text-slate-300'
                    : isContrast
                    ? 'text-slate-200'
                    : 'text-slate-800'
                }`}
              >
                {alt.description}
              </p>
            </div>

            <a
              href={alt.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                isCyber
                  ? 'bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-200 border border-cyan-500/50 cyber-button-glow'
                  : isContrast
                  ? 'bg-yellow-400 hover:bg-yellow-300 text-black font-black'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
              }`}
            >
              <span>Otevřít oficiální portál</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        ))}
      </div>

      {/* Advice banner for buying safely */}
      <div
        className={`p-4 rounded-2xl border text-xs sm:text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
          isCyber
            ? 'bg-slate-900/80 border-slate-800 text-slate-300'
            : isContrast
            ? 'bg-slate-900 border-yellow-400/50 text-slate-200'
            : 'bg-white border-emerald-400 text-slate-800 shadow-sm'
        }`}
      >
        <div className="flex items-start gap-2.5">
          <CheckCircle2
            className={`w-5 h-5 shrink-0 mt-0.5 ${
              isCyber ? 'text-emerald-400' : isContrast ? 'text-yellow-400' : 'text-emerald-700'
            }`}
          />
          <div>
            <span
              className={`font-bold block ${
                isCyber || isContrast ? 'text-white' : 'text-slate-950'
              }`}
            >
              Zlaté pravidlo bezpečného nákupu z druhé ruky:
            </span>
            <span
              className={
                isCyber
                  ? 'text-slate-300'
                  : isContrast
                  ? 'text-slate-200'
                  : 'text-slate-800'
              }
            >
              Trvejte na osobním převzetí v místě bydliště a vyzkoušení zboží před zaplacením. Nikdy neplatíte předem přes neznámé odkazy.
            </span>
          </div>
        </div>

        <a
          href="https://www.coi.cz/pro-spotrebitele/rizikove-e-shopy/"
          target="_blank"
          rel="noopener noreferrer"
          className={`text-xs font-bold underline underline-offset-2 shrink-0 flex items-center gap-1 self-end sm:self-auto ${
            isCyber
              ? 'text-emerald-400 hover:text-emerald-300'
              : isContrast
              ? 'text-yellow-300 hover:text-yellow-200'
              : 'text-emerald-800 hover:text-emerald-950'
          }`}
        >
          <span>Seznam rizikových e-shopů ČOI</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
