import React, { useEffect, useState } from 'react';
import { Shield, CheckCircle2, Loader2, Search, Lock, AlertTriangle, Cpu } from 'lucide-react';

interface ScanningAnimationProps {
  fontSize: 'normal' | 'large' | 'xlarge';
  themeMode?: 'cyberpunk' | 'highContrast' | 'classic';
  highContrast?: boolean;
}

const STEPS = [
  'Kontrola webové domény a bezpečnostních certifikátů SSL...',
  'Detekce známých podvodných postupů (falešné kurýrní služby DPD, Zásilkovna)...',
  'Porovnání tržní ceny a vyhodnocení manipulativních frází...',
  'Prohledávání internetových databází nahlášených podvodů a ČOI...',
  'Sestavování srozumitelného doporučení a bezpečných kroků pro tátu...',
];

export const ScanningAnimation: React.FC<ScanningAnimationProps> = ({
  fontSize,
  themeMode = 'cyberpunk',
  highContrast,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(5);

  const isCyber = themeMode === 'cyberpunk';
  const isContrast = themeMode === 'highContrast' || highContrast;

  useEffect(() => {
    const interval = setInterval(() => {
      setProgressPercent((prev) => {
        if (prev >= 95) return 95;
        const next = prev + Math.floor(Math.random() * 8) + 4;
        return next > 95 ? 95 : next;
      });
    }, 400);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 2200);

    return () => clearInterval(stepInterval);
  }, []);

  const textClasses = {
    normal: 'text-base',
    large: 'text-lg',
    xlarge: 'text-xl',
  }[fontSize];

  return (
    <div
      className={`rounded-3xl p-8 sm:p-12 text-center shadow-2xl border transition-all my-6 ${
        isCyber
          ? 'bg-slate-950 border-cyan-500/40 text-slate-100 shadow-[0_0_35px_rgba(6,182,212,0.2)]'
          : isContrast
          ? 'bg-black border-yellow-400 text-white'
          : 'bg-slate-900 border-slate-800 text-white'
      }`}
    >
      <div className="max-w-xl mx-auto flex flex-col items-center">
        {/* Animated Cyber Shield Icon */}
        <div className="relative mb-6">
          <div className="absolute -inset-4 rounded-full bg-cyan-500/20 animate-ping opacity-75" />
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-emerald-500 via-cyan-600 to-blue-700 flex items-center justify-center shadow-2xl text-slate-950 border border-cyan-400/50">
            <Shield className="w-12 h-12 stroke-[2.5]" />
          </div>
        </div>

        <h3 className="text-2xl sm:text-3xl font-black mb-2 tracking-tight flex items-center justify-center gap-2">
          <Cpu className="w-6 h-6 text-cyan-400 animate-pulse" />
          <span>Probíhá bezpečnostní prověrka...</span>
        </h3>
        <p className="text-slate-300 text-sm sm:text-base mb-8">
          Vyčkejte cca 10 vteřin. Prověřujeme odkaz i text přes umělou inteligenci Google Gemini.
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-slate-900 rounded-full h-4 mb-8 overflow-hidden p-1 border border-slate-800">
          <div
            className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 h-full rounded-full transition-all duration-300 ease-out shadow-[0_0_15px_rgba(16,185,129,0.6)]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Step-by-step checklist */}
        <div className="w-full bg-slate-900/90 rounded-2xl p-5 border border-slate-800 text-left space-y-3">
          {STEPS.map((stepText, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div
                key={idx}
                className={`flex items-start gap-3 transition-all ${
                  isCompleted
                    ? 'text-emerald-400 font-semibold'
                    : isCurrent
                    ? 'text-cyan-300 font-bold scale-[1.01]'
                    : 'text-slate-600'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : isCurrent ? (
                    <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-slate-700" />
                  )}
                </div>
                <span className={textClasses}>{stepText}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
