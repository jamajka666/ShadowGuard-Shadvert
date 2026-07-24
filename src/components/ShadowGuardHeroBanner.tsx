import React from 'react';
import { ShadowGuardLogo } from './ShadowGuardLogo';
import { Shield, Sparkles, Mic, Smartphone, CheckCircle2, Lock } from 'lucide-react';
import { ThemeMode } from '../types';

interface ShadowGuardHeroBannerProps {
  themeMode?: ThemeMode;
  onOpenMicGuide?: () => void;
  className?: string;
}

export const ShadowGuardHeroBanner: React.FC<ShadowGuardHeroBannerProps> = ({
  themeMode = 'shadowguard',
  onOpenMicGuide,
  className = '',
}) => {
  const isCyber = themeMode === 'cyberpunk';
  const isContrast = themeMode === 'highContrast';

  return (
    <div
      className={`rounded-3xl p-6 sm:p-8 border shadow-2xl relative overflow-hidden mb-8 transition-all ${
        isCyber
          ? 'bg-slate-950 border-cyan-500/50 text-slate-100 shadow-[0_0_40px_rgba(6,182,212,0.2)]'
          : isContrast
          ? 'bg-black border-yellow-400 text-white'
          : 'bg-[#121214] border-[#B8860B] text-slate-100 shadow-[0_0_35px_rgba(184,134,11,0.25)]'
      } ${className}`}
    >
      {/* Background Marble Aura Accent */}
      <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-gradient-to-br from-[#B8860B]/20 via-[#D4AF37]/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-gradient-to-tr from-cyan-500/10 via-emerald-500/10 to-transparent blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left: ShadowGuard Large Logo & Title */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5">
          <div className="p-3 rounded-3xl bg-[#1C1C1E] border-2 border-[#D4AF37]/60 shadow-[0_0_25px_rgba(212,175,55,0.3)] shrink-0">
            <ShadowGuardLogo size="lg" showSubtitle={false} />
          </div>

          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B8860B]/20 border border-[#D4AF37]/40 text-[#00F5FF] text-xs font-mono font-black tracking-wider uppercase mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
              <span>Rodinný AI Bezpečnostní Štít v3.0</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              SHADOWGUARD <span className="text-[#D4AF37] font-serif">Shadvert</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl font-medium leading-relaxed">
              Ochrana před internetovými podvody, falešnými e-shopy a manipulativními inzeráty. Navrženo s důrazem na přístupnost pro seniory i snadnou kontrolu v rodině.
            </p>
          </div>
        </div>

        {/* Right: Quick Security Feature Badges */}
        <div className="flex flex-col gap-2 w-full md:w-auto shrink-0">
          <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-[#1C1C1E] border border-slate-800 text-xs font-bold text-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>AI prověrka podvodného textu a zpráv</span>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-[#1C1C1E] border border-slate-800 text-xs font-bold text-slate-200">
            <Lock className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Živá kontrola SSL certifikátu a domén</span>
          </div>

          {onOpenMicGuide && (
            <button
              type="button"
              onClick={onOpenMicGuide}
              className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-gradient-to-r from-[#B8860B]/30 to-[#D4AF37]/20 border border-[#D4AF37]/60 text-xs font-black text-amber-300 hover:brightness-125 transition-all text-left"
            >
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-amber-300 shrink-0" />
                <span>Povolení mikrofonu pro hlasový diktát</span>
              </div>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-black/60 text-[#00F5FF]">Návod 🔒</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
