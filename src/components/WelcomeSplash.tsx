import React, { useEffect, useState } from 'react';
import { Shield, X } from 'lucide-react';

const SPLASH_KEY = 'sg_splash_seen_v2';
const LOGO_MS = 2500;

type Phase = 'logo' | 'guide';

interface WelcomeSplashProps {
  onDone?: () => void;
}

export const WelcomeSplash: React.FC<WelcomeSplashProps> = ({ onDone }) => {
  const [phase, setPhase] = useState<Phase | null>(null);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SPLASH_KEY)) return;
    } catch {
      /* ignore */
    }
    setPhase('logo');
  }, []);

  useEffect(() => {
    if (phase !== 'logo') return;
    const t = window.setTimeout(() => setPhase('guide'), LOGO_MS);
    return () => window.clearTimeout(t);
  }, [phase]);

  const dismiss = () => {
    try {
      sessionStorage.setItem(SPLASH_KEY, '1');
    } catch {
      /* ignore */
    }
    setPhase(null);
    onDone?.();
  };

  if (!phase) return null;

  if (phase === 'logo') {
    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050a0c]"
        role="img"
        aria-label="ShadowGuard Initiative představuje Shadvert"
        onClick={() => setPhase('guide')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') setPhase('guide');
        }}
        tabIndex={0}
      >
        <img
          src="/brand/splash-initiative.png"
          alt="ShadowGuard Initiative představuje Shadvert"
          className="max-h-full max-w-full w-auto h-auto object-contain pointer-events-none select-none"
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm">
      <button
        type="button"
        onClick={dismiss}
        className="absolute right-4 top-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
        aria-label="Zavřít"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="relative w-full max-w-md mx-4 text-center">
        <div className="relative z-10 rounded-3xl border-2 border-[#D4A017]/60 bg-[#121214] p-7 shadow-[0_0_60px_rgba(212,160,23,0.35)]">
          <div className="mx-auto mb-5 w-28 h-28 rounded-2xl overflow-hidden border border-[#CD7F32]/50 shadow-[0_0_25px_rgba(0,245,255,0.25)] bg-black">
            <img
              src="/brand/logo-shadvert.png"
              alt="ShadowGuard Shadvert"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B8860B]/20 border border-[#D4AF37]/40 text-[#00F5FF] text-[10px] font-mono font-black tracking-wider uppercase mb-3">
            <Shield className="w-3.5 h-3.5 text-amber-300" />
            Rodinný bezpečnostní štít
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            SHADOW<span className="text-[#E6B800]">GUARD</span>
          </h1>
          <p className="text-[#00F5FF] font-mono font-bold tracking-widest text-sm mt-1">Shadvert</p>
          <p className="text-slate-300 text-sm mt-3 leading-relaxed">
            Ochrana před falešnými inzeráty a podvodnými e-shopy. Pro tátu i celou rodinu.
          </p>

          <div className="mt-5 rounded-2xl border border-slate-700 bg-[#1C1C1E] p-4 text-left text-sm leading-relaxed text-slate-200">
            <p className="mb-2 font-black text-[#F5D061]">Jak to funguje</p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>Vložte odkaz, text zprávy nebo fotku inzerátu.</li>
              <li>Klepněte na „Prověřit důvěryhodnost“.</li>
              <li>Řiďte se zeleným, žlutým nebo červeným výsledkem.</li>
            </ol>
          </div>

          <button
            type="button"
            onClick={dismiss}
            className="mt-6 w-full py-3.5 rounded-2xl font-black bg-gradient-to-r from-[#B8860B] to-[#D4AF37] text-black hover:brightness-110 shadow-lg transition-all"
          >
            Pokračovat
          </button>
        </div>
      </div>
    </div>
  );
};
