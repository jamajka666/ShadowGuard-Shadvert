import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Monitor,
  Building2,
  FileSearch,
  CheckCircle2,
  XCircle,
  Sparkles,
  Info,
} from 'lucide-react';
import { AdCheckResult, ThemeMode } from '../types';

interface EshopVisualTrustCardProps {
  result: AdCheckResult;
  themeMode?: ThemeMode;
  uiMode?: 'senior' | 'cyber' | 'contrast' | 'shadowguard';
  fontSize: 'normal' | 'large' | 'xlarge';
}

export const EshopVisualTrustCard: React.FC<EshopVisualTrustCardProps> = ({
  result,
  themeMode,
  uiMode,
  fontSize,
}) => {
  const visualData = result.eshopVisualAnalysis;

  if (!visualData) {
    return null;
  }

  const isShadowGuard = themeMode === 'shadowguard' || uiMode === 'shadowguard';
  const isCyber = themeMode === 'cyberpunk' || uiMode === 'cyber';
  const isContrast = themeMode === 'highContrast' || uiMode === 'contrast';

  const grade = visualData.visualTrustGrade || 'PODROBNOSTI_CHYBI';

  const gradeBadgeInfo = {
    VYBORNE: {
      bg: isShadowGuard
        ? 'bg-[#1C1C1E] text-emerald-400 border-emerald-500/50'
        : isCyber
        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
        : 'bg-emerald-600 text-white',
      title: '🟢 VIZUÁLNĚ DŮVĚRYHODNÝ E-SHOP',
      desc: 'Snímek obsahuje standardní prvky českého obchodu.',
    },
    USPOKOJIVE: {
      bg: isShadowGuard
        ? 'bg-[#1C1C1E] text-cyan-300 border-cyan-500/50'
        : isCyber
        ? 'bg-blue-500/20 text-blue-300 border-blue-500/50'
        : 'bg-blue-600 text-white',
      title: '🔵 BEŽNÝ VZHLED E-SHOPU',
      desc: 'Web vypadá standardně, ale doporučujeme vždy zkontrolovat IČO.',
    },
    PODROBNOSTI_CHYBI: {
      bg: isCyber
        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
        : 'bg-amber-500 text-slate-950 font-black',
      title: '🟡 NEJASNÝ / CHYBĚJÍCÍ PRODEJCE (POZOR)',
      desc: 'Na snímku chybí jasné kontaktní údaje nebo česká adresa.',
    },
    PODVODNE: {
      bg: isCyber
        ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse'
        : 'bg-rose-600 text-white animate-pulse',
      title: '🚨 PODVODNÝ / PODEZŘELÝ DESIGN E-SHOPU',
      desc: 'Snímek obsahuje typické vizuální prvky podvodných čínských klonů nebo anonymních e-shopů.',
    },
  }[grade];

  return (
    <div
      className={`rounded-3xl p-6 sm:p-8 border-2 shadow-2xl my-6 transition-all ${
        grade === 'PODVODNE'
          ? isShadowGuard || isCyber
            ? 'bg-[#121214] border-rose-500/80 text-rose-100 shadow-[0_0_35px_rgba(244,63,94,0.25)]'
            : isContrast
            ? 'bg-black border-yellow-400 text-white'
            : 'bg-rose-50/90 border-rose-300 text-slate-900'
          : isShadowGuard
          ? 'bg-[#121214] border-[#CD7F32]/80 text-slate-100 shadow-[0_0_25px_rgba(212,160,23,0.2)] shadowguard-bronze-border'
          : isCyber
          ? 'bg-slate-950 border-cyan-500/50 text-slate-100 shadow-[0_0_25px_rgba(6,182,212,0.15)]'
          : isContrast
          ? 'bg-black border-yellow-400 text-white'
          : 'bg-white border-slate-200 text-slate-900'
      }`}
    >
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-700/60">
        <div className="flex items-center gap-3">
          <div
            className={`p-3 rounded-2xl ${
              grade === 'PODVODNE'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                : isCyber
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-emerald-600 text-white'
            }`}
          >
            <Monitor className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
              <span>Vizuální analýza snímku e-shopu</span>
              <Sparkles className="w-5 h-5 text-amber-400 inline" />
            </h3>
            <p className={`text-xs sm:text-sm font-medium ${isCyber ? 'text-cyan-300/80' : 'text-slate-500'}`}>
              Hodnocení grafické úpravy, certifikátů, IČO a důvěryhodnosti stránek
            </p>
          </div>
        </div>

        {/* Grade Badge */}
        <div className={`px-3.5 py-1.5 rounded-2xl text-xs sm:text-sm font-black border uppercase tracking-wider self-start sm:self-auto ${gradeBadgeInfo.bg}`}>
          {gradeBadgeInfo.title}
        </div>
      </div>

      {/* Main Comment */}
      {visualData.designComment && (
        <div className="mt-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-200 text-sm leading-relaxed">
          <p className="font-semibold">{visualData.designComment}</p>
        </div>
      )}

      {/* Contact Info Visibility Section */}
      {visualData.contactInfoVisibility && (
        <div className="mt-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-700 text-slate-100 flex items-start gap-3">
          <Building2 className="w-6 h-6 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-xs uppercase tracking-wider text-cyan-300 block mb-1">
              🏢 Kontrola firmy a IČO v patičce:
            </span>
            <p className="text-xs sm:text-sm text-slate-200">
              {visualData.contactInfoVisibility}
            </p>
          </div>
        </div>
      )}

      {/* Detected Visual Flags */}
      {visualData.detectedVisualFlags && visualData.detectedVisualFlags.length > 0 && (
        <div className="mt-4 space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            🔍 Zjištěné vizuální prvky na snímku obrazovky:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {visualData.detectedVisualFlags.map((flag, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2.5 ${
                  grade === 'PODVODNE'
                    ? 'bg-rose-950/40 text-rose-200 border-rose-500/40'
                    : 'bg-slate-900 text-slate-200 border-slate-800'
                }`}
              >
                {grade === 'PODVODNE' ? (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
                <span>{flag}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Senior Tip Box for Checking E-shops */}
      <div className="mt-5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs sm:text-sm space-y-1">
        <div className="flex items-center gap-2 font-black text-amber-300">
          <Info className="w-4 h-4" />
          <span>💡 Jak bezpečně nakupovat v neznámém e-shopu:</span>
        </div>
        <p>
          1. Na spodku stránky (v tzv. patičce) vždy hledejte <strong>8místné IČO</strong> a <strong>název české firmy</strong>.
        </p>
        <p>
          2. Zadejte IČO na oficiálním webu <strong>rzp.cz</strong> (Živnostenský rejstřík) nebo vyhlašovaný Seznam ČOI pro rizikové e-shopy.
        </p>
        <p>
          3. Pokud e-shop nemá uvedený český telefon ani adresi a přijímá pouze platby kartou předem, <strong>NENAKUPUJTE!</strong>
        </p>
      </div>
    </div>
  );
};
