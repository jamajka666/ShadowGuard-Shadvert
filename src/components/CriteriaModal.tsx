import React from 'react';
import {
  ShieldAlert,
  Globe,
  CreditCard,
  TrendingDown,
  Building2,
  Cpu,
  CheckCircle2,
  XCircle,
  HelpCircle,
  X,
  FileCheck2,
  Lock,
  MessageSquareWarning,
} from 'lucide-react';
import { ThemeMode } from '../types';

interface CriteriaModalProps {
  isOpen: boolean;
  onClose: () => void;
  themeMode: ThemeMode;
}

export const CriteriaModal: React.FC<CriteriaModalProps> = ({ isOpen, onClose, themeMode }) => {
  if (!isOpen) return null;

  const isShadowGuard = themeMode === 'shadowguard';
  const isCyber = themeMode === 'cyberpunk';
  const isContrast = themeMode === 'highContrast';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div
        className={`relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 shadow-2xl border transition-all ${
          isShadowGuard
            ? 'bg-[#121214] border-[#CD7F32]/80 text-white shadow-[0_0_40px_rgba(212,160,23,0.3)] shadowguard-bronze-border'
            : isCyber
            ? 'bg-slate-950 border-cyan-500/40 text-slate-100 shadow-[0_0_30px_rgba(6,182,212,0.2)]'
            : isContrast
            ? 'bg-black border-yellow-400 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className={`absolute top-5 right-5 p-2 rounded-2xl transition-colors ${
            isCyber
              ? 'bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-500/30'
              : isContrast
              ? 'bg-yellow-400 text-black hover:bg-yellow-300'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <X className="w-6 h-6" />
        </button>

        {/* Modal Title */}
        <div className="mb-8 pr-12">
          <div className="flex items-center gap-3 mb-2">
            <div
              className={`p-3 rounded-2xl ${
                isCyber
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                  : isContrast
                  ? 'bg-yellow-400 text-black'
                  : 'bg-emerald-600 text-white'
              }`}
            >
              <Cpu className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                Princip a kritéria vyhodnocování hrozeb
              </h2>
              <p
                className={`text-sm font-medium ${
                  isCyber ? 'text-cyan-400/90' : isContrast ? 'text-yellow-300' : 'text-slate-600'
                }`}
              >
                Jak Strážce Inzerátů odhaluje podvody a chráni váš bankovní účet
              </p>
            </div>
          </div>
        </div>

        {/* 6 Key Pillars Grid */}
        <div className="space-y-6">
          {/* Pillar 1 */}
          <div
            className={`p-5 sm:p-6 rounded-2xl border transition-all ${
              isCyber
                ? 'bg-slate-900/90 border-slate-800 hover:border-cyan-500/50'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-400 shrink-0">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black mb-1 flex items-center gap-2">
                  <span>1. Doménová prověrka & Falešné URL adresy</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/30">
                    KRITICKÉ
                  </span>
                </h3>
                <p className="text-sm opacity-90 leading-relaxed">
                  Systém zkoumá přesnou webovou adresu. Podvodníci zakládají falešné domény, které se liší jen o pár písmen (např. <code className="bg-slate-800 px-1.5 py-0.5 rounded text-red-400 font-mono">bazos-platba.online</code> nebo <code className="bg-slate-800 px-1.5 py-0.5 rounded text-red-400 font-mono">zasilkovna-vyplata.xyz</code> místo oficiálního <code className="bg-slate-800 px-1.5 py-0.5 rounded text-emerald-400 font-mono">bazos.cz</code>).
                </p>
              </div>
            </div>
          </div>

          {/* Pillar 2 */}
          <div
            className={`p-5 sm:p-6 rounded-2xl border transition-all ${
              isCyber
                ? 'bg-slate-900/90 border-slate-800 hover:border-rose-500/50'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-rose-500/20 text-rose-400 shrink-0">
                <MessageSquareWarning className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black mb-1 flex items-center gap-2">
                  <span>2. Detekce scénáře s falešným kurýrem (DPD / Zásilkovna)</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30">
                    NEJČASTĚJŠÍ PODVOD V ČR
                  </span>
                </h3>
                <p className="text-sm opacity-90 leading-relaxed">
                  Automatická detekce frazí jako <i>„pošlu kurýra DPD / Zásilkovnu, peníze dostanete na odkaz"</i>. Žádná přepravní služba v ČR nevyžaduje po prodávajícím zadat číslo platební karty pro přijetí peněz!
                </p>
              </div>
            </div>
          </div>

          {/* Pillar 3 */}
          <div
            className={`p-5 sm:p-6 rounded-2xl border transition-all ${
              isCyber
                ? 'bg-slate-900/90 border-slate-800 hover:border-emerald-500/50'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black mb-1 flex items-center gap-2">
                  <span>3. Analýza finančních požiadavků (Účet vs. Karta)</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 text-xs sm:text-sm">
                  <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-emerald-400">Číslo bankovního účtu:</strong>
                      Poskytnout číslo účtu (např. 123456/0800) pro přijetí peněz je bezpečné.
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-200 flex items-start gap-2">
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-rose-400">Údaje z platební karty:</strong>
                      Zadání čísla karty, exspirace a CVC kódu na odkaz = PODVOD a stržení peněz!
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pillar 4 */}
          <div
            className={`p-5 sm:p-6 rounded-2xl border transition-all ${
              isCyber
                ? 'bg-slate-900/90 border-slate-800 hover:border-amber-500/50'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                <TrendingDown className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black mb-1">4. Cenová anomálie a psychologický nátlak</h3>
                <p className="text-sm opacity-90 leading-relaxed">
                  Pokud je zánovní zboží nabízeno za 10–20 % běžné tržní ceny (např. nový iPhone za 2 500 Kč) a prodejce spěchá s okamžitou zálohou předem, skóre důvěryhodnosti okamžitě klesá pod 20 %.
                </p>
              </div>
            </div>
          </div>

          {/* Pillar 5 & 6 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              className={`p-5 rounded-2xl border ${
                isCyber ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <Building2 className="w-5 h-5 text-sky-400" />
                <h4 className="font-bold text-base">5. Prověrka e-shopů & ČOI</h4>
              </div>
              <p className="text-xs opacity-80 leading-relaxed">
                U internetových obchodů kontrolujeme existenci IČO v RES/ARES, obchodní podmínky, kontaktní adresu a záznamy na černé listině České obchodní inspekce.
              </p>
            </div>

            <div
              className={`p-5 rounded-2xl border ${
                isCyber ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <Cpu className="w-5 h-5 text-emerald-400" />
                <h4 className="font-bold text-base">6. AI Heuristika Google Gemini</h4>
              </div>
              <p className="text-xs opacity-80 leading-relaxed">
                Modely Google AI prohledávají internetové diskuse v reálném čase, porovnávají styl komunikace s tisíci známých podvodných vzorů a připravují srozumitelný závěr.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
          <button
            type="button"
            onClick={onClose}
            className={`px-8 py-3 rounded-2xl font-bold transition-all ${
              isCyber
                ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : isContrast
                ? 'bg-yellow-400 text-black'
                : 'bg-slate-900 text-white'
            }`}
          >
            Rozumím, zavřít vysvětlení
          </button>
        </div>
      </div>
    </div>
  );
};
