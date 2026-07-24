import React, { useEffect, useState } from 'react';
import { Shield, X } from 'lucide-react';

const SPLASH_KEY = 'sg_splash_seen_v1';

interface WelcomeSplashProps {
  onDone?: () => void;
}

export const WelcomeSplash: React.FC<WelcomeSplashProps> = ({ onDone }) => {
  const [visible, setVisible] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SPLASH_KEY)) return;
    } catch {
      /* ignore */
    }
    setVisible(true);
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => dismiss(), 4500);
    return () => clearTimeout(t);
  }, [visible]);

  const dismiss = () => {
    try {
      sessionStorage.setItem(SPLASH_KEY, '1');
    } catch {
      /* ignore */
    }
    setVisible(false);
    onDone?.();
  };

  if (!visible) return null;

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
        {!reduceMotion && (
          <video
            className="absolute inset-0 w-full h-full object-cover rounded-3xl opacity-40 pointer-events-none"
            src="/brand/splash.mp4"
            poster="/brand/logo-shadvert.png"
            autoPlay
            muted
            playsInline
            loop={false}
            onError={(e) => {
              (e.target as HTMLVideoElement).style.display = 'none';
            }}
          />
        )}

        <div className="relative z-10 rounded-3xl border-2 border-[#D4A017]/60 bg-[#121214]/90 p-8 shadow-[0_0_60px_rgba(212,160,23,0.35)]">
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
