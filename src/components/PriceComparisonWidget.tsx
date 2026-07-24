import React, { useState } from 'react';
import {
  Tag,
  Search,
  ExternalLink,
  AlertTriangle,
  ShoppingBag,
  TrendingUp,
  CheckCircle2,
  HelpCircle,
  ArrowUpRight,
} from 'lucide-react';
import { AdCheckResult, ThemeMode } from '../types';

interface PriceComparisonWidgetProps {
  result: AdCheckResult;
  themeMode?: ThemeMode;
  uiMode?: 'senior' | 'cyber' | 'contrast' | 'shadowguard';
  fontSize: 'normal' | 'large' | 'xlarge';
}

export const PriceComparisonWidget: React.FC<PriceComparisonWidgetProps> = ({
  result,
  themeMode,
  uiMode,
  fontSize,
}) => {
  // Derive default clean product search term
  const deriveProductTerm = () => {
    if (result.priceEvaluation.suggestedSearchTerm) {
      return result.priceEvaluation.suggestedSearchTerm;
    }
    const cleanText = (result.headline || result.inputSnippet || '')
      .replace(/http[s]?:\/\/\S+/gi, '')
      .replace(/(inzerát|prodej|prodám|prodame|levně|sleva|nový|stavy|nabídka|koupeno|výhodně|podvod)/gi, '')
      .trim();
    return cleanText.slice(0, 50) || 'Elektronika';
  };

  const [searchTerm, setSearchTerm] = useState<string>(deriveProductTerm());
  const [showGuide, setShowGuide] = useState(false);

  const isShadowGuard = themeMode === 'shadowguard' || uiMode === 'shadowguard';
  const isCyber = themeMode === 'cyberpunk' || uiMode === 'cyber';
  const isContrast = themeMode === 'highContrast' || uiMode === 'contrast';

  const isSuspiciousPrice = result.priceEvaluation.isPriceSuspicious;

  const encodedQuery = encodeURIComponent(searchTerm.trim() || 'zbozi');
  const heurekaUrl = `https://www.heureka.cz/srozumitelne-vyhledavani/?h=${encodedQuery}`;
  const zboziUrl = `https://www.zbozi.cz/hledani/?q=${encodedQuery}`;
  const googleShoppingUrl = `https://www.google.cz/search?tbm=shop&q=${encodedQuery}`;

  const textClasses = {
    normal: 'text-sm',
    large: 'text-base',
    xlarge: 'text-lg',
  }[fontSize];

  return (
    <div
      className={`rounded-3xl p-6 sm:p-8 border-2 shadow-2xl my-6 transition-all ${
        isSuspiciousPrice
          ? isShadowGuard || isCyber
            ? 'bg-[#121214] border-amber-500/80 text-amber-100 shadow-[0_0_35px_rgba(245,158,11,0.25)]'
            : isContrast
            ? 'bg-black border-yellow-400 text-white'
            : 'bg-amber-50/90 border-amber-300 text-slate-900'
          : isShadowGuard
          ? 'bg-[#121214] border-[#CD7F32]/80 text-slate-100 shadow-[0_0_25px_rgba(212,160,23,0.2)] shadowguard-bronze-border'
          : isCyber
          ? 'bg-slate-950 border-cyan-500/40 text-slate-100 shadow-[0_0_25px_rgba(6,182,212,0.15)]'
          : isContrast
          ? 'bg-black border-yellow-400 text-white'
          : 'bg-white border-slate-200 text-slate-900'
      }`}
    >
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-700/60">
        <div className="flex items-center gap-3">
          <div
            className={`p-3 rounded-2xl ${
              isSuspiciousPrice
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse'
                : isCyber
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-emerald-600 text-white'
            }`}
          >
            <TrendingUp className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                Ověření tržní ceny na Heurece a Zboží.cz
              </h3>
              {isSuspiciousPrice && (
                <span className="bg-rose-600 text-white text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                  ⚠ Nízká cena
                </span>
              )}
            </div>
            <p className={`text-xs sm:text-sm font-medium ${isCyber ? 'text-cyan-300/80' : 'text-slate-500'}`}>
              Porovnejte cenu z inzerátu s reálnou hodnotou u ověřených českých prodejců
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowGuide(!showGuide)}
          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all self-start sm:self-auto border ${
            isCyber
              ? 'bg-slate-900 text-cyan-300 border-cyan-500/40 hover:bg-slate-800'
              : isContrast
              ? 'bg-yellow-400 text-black border-yellow-500 font-black'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300'
          }`}
        >
          <HelpCircle className="w-4 h-4 text-amber-500" />
          <span>Jak poznat podvodnou cenu?</span>
        </button>
      </div>

      {/* Suspicious Price Warning Box */}
      {isSuspiciousPrice && (
        <div className="mt-4 p-4 rounded-2xl bg-rose-950/40 border border-rose-500/60 text-rose-100 flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-black text-sm block text-rose-300 uppercase tracking-wider">
              🚨 PODEZŘENÍ NA FALEŠNOU CENU (TRIK PODVODNÍKŮ)
            </span>
            <p className="text-xs sm:text-sm leading-relaxed text-rose-200">
              {result.priceEvaluation.priceComment}
            </p>
            {result.priceEvaluation.estimatedMarketPrice && (
              <p className="text-xs sm:text-sm font-black text-amber-300 mt-1">
                💡 Očekávaná běžná cena v českých e-shopech: {result.priceEvaluation.estimatedMarketPrice}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Guide section if toggled */}
      {showGuide && (
        <div className="mt-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-700 text-slate-200 text-xs sm:text-sm space-y-2">
          <span className="font-bold text-amber-400 block text-sm">
            💡 Proč podvodníci nabízejí věci extrémně levně?
          </span>
          <p>
            1. <strong>Návnada na emoce:</strong> Nabídkou zánovního telefonu či nářadí se slevou 60 % až 80 % vyvolají v kupujícím pocit, že musí jednat ihned, než mu to někdo vyfoukne.
          </p>
          <p>
            2. <strong>Falešný požadavek na zálohu nebo poštovné:</strong> Požádají o zaplacení poštovného předem nebo pošlou odkaz na "rezervaci přes kurýra DPD/Zásilkovny".
          </p>
          <p>
            3. <strong>Pravidlo zdravého rozumu:</strong> Pokud zboží na Heurece stojí 15 000 Kč a neznámý prodávající ho na WhatsAppu nabízí za 3 500 Kč, nejde o náhodné štěstí, ale o zloděje.
          </p>
        </div>
      )}

      {/* Search Query Editor for Senior */}
      <div className="mt-5 space-y-3">
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
          Hledaný název zboží pro srovnání cen:
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Zadejte název produktu (např. iPhone 13, Makita vrtačka)"
              className={`w-full pl-11 pr-4 py-3 rounded-2xl font-bold text-sm sm:text-base border transition-all focus:outline-none focus:ring-2 ${
                isCyber
                  ? 'bg-slate-900 border-slate-700 text-white focus:ring-cyan-500'
                  : isContrast
                  ? 'bg-black border-yellow-400 text-white focus:ring-yellow-400'
                  : 'bg-slate-50 border-slate-300 text-slate-900 focus:ring-emerald-500'
              }`}
            />
          </div>
        </div>

        {/* Action Direct Links to Comparison Portals */}
        <div className="pt-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Otevřít výsledky v českých srovnávačích (v novém okně):
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* HEUREKA BUTTON */}
            <a
              href={heurekaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`p-4 rounded-2xl border font-black text-sm sm:text-base flex items-center justify-between gap-2 shadow-lg transition-all hover:scale-[1.02] ${
                isCyber
                  ? 'bg-gradient-to-r from-amber-600/30 to-orange-600/30 hover:from-amber-600/50 hover:to-orange-600/50 text-amber-300 border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                  : isContrast
                  ? 'bg-yellow-400 text-black border-yellow-500 font-black'
                  : 'bg-gradient-to-r from-orange-500 to-amber-600 text-white border-orange-400 hover:from-orange-600 hover:to-amber-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-lg">🟠</span>
                <div>
                  <span className="block leading-tight">Heureka.cz</span>
                  <span className="text-[10px] font-normal opacity-90 block">Oficiální srovnávač</span>
                </div>
              </div>
              <ArrowUpRight className="w-5 h-5 shrink-0" />
            </a>

            {/* ZBOZI.CZ BUTTON */}
            <a
              href={zboziUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`p-4 rounded-2xl border font-black text-sm sm:text-base flex items-center justify-between gap-2 shadow-lg transition-all hover:scale-[1.02] ${
                isCyber
                  ? 'bg-gradient-to-r from-blue-600/30 to-cyan-600/30 hover:from-blue-600/50 hover:to-cyan-600/50 text-cyan-300 border-cyan-500/60'
                  : isContrast
                  ? 'bg-yellow-400 text-black border-yellow-500 font-black'
                  : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-blue-500 hover:from-blue-700 hover:to-cyan-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-lg">🔵</span>
                <div>
                  <span className="block leading-tight">Zboží.cz</span>
                  <span className="text-[10px] font-normal opacity-90 block">Srovnávač od Seznamu</span>
                </div>
              </div>
              <ArrowUpRight className="w-5 h-5 shrink-0" />
            </a>

            {/* GOOGLE SHOPPING BUTTON */}
            <a
              href={googleShoppingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`p-4 rounded-2xl border font-black text-sm sm:text-base flex items-center justify-between gap-2 shadow-lg transition-all hover:scale-[1.02] ${
                isCyber
                  ? 'bg-gradient-to-r from-emerald-600/30 to-teal-600/30 text-emerald-300 border-emerald-500/60'
                  : isContrast
                  ? 'bg-yellow-400 text-black border-yellow-500 font-black'
                  : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-lg">🛍️</span>
                <div>
                  <span className="block leading-tight">Google Nákupy</span>
                  <span className="text-[10px] font-normal opacity-90 block">Vyhledání v e-shopech</span>
                </div>
              </div>
              <ArrowUpRight className="w-5 h-5 shrink-0" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
