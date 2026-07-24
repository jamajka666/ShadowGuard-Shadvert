import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, Zap, Flame, Sparkles } from 'lucide-react';

interface EnergyAuraVisualizerProps {
  score: number; // 0 - 100
  className?: string;
}

export const EnergyAuraVisualizer: React.FC<EnergyAuraVisualizerProps> = ({
  score,
  className = '',
}) => {
  const normalized = Math.min(100, Math.max(0, score));

  // Determine theme mode: red (high risk), gold (caution), green (safe)
  let variant: 'red' | 'gold' | 'green' = 'green';
  if (normalized <= 40) variant = 'red';
  else if (normalized <= 70) variant = 'gold';

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-4 sm:p-5 flex flex-col items-center justify-center text-center transition-all ${
        variant === 'red'
          ? 'bg-slate-950 border-rose-600/80 shadow-[0_0_35px_rgba(225,29,72,0.4)]'
          : variant === 'gold'
          ? 'bg-slate-950 border-amber-500/80 shadow-[0_0_35px_rgba(245,158,11,0.35)]'
          : 'bg-slate-950 border-emerald-500/80 shadow-[0_0_35px_rgba(16,185,129,0.35)]'
      } ${className}`}
    >
      {/* Background Energy Aura Canvas Animations (Simulates the MP4 effects) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40">
        {variant === 'red' && (
          <>
            {/* Fiery Red Swirl & Rays */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] rounded-full bg-gradient-to-tr from-rose-700 via-red-600 to-amber-600 blur-2xl animate-pulse" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full border-4 border-rose-500/40 animate-ping opacity-20" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(225,29,72,0.25)_0%,transparent_70%)] animate-pulse" />
          </>
        )}

        {variant === 'gold' && (
          <>
            {/* Gold & White Radiant Light Rays */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-white blur-2xl opacity-60 animate-pulse" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px] rounded-full border-2 stroke-dashed border-amber-400/50 animate-spin" style={{ animationDuration: '12s' }} />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.25)_0%,transparent_70%)]" />
          </>
        )}

        {variant === 'green' && (
          <>
            {/* Green Emerald Swirling Energy Vortex */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] rounded-full bg-gradient-to-tr from-emerald-600 via-teal-400 to-cyan-400 blur-2xl opacity-60 animate-pulse" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[210px] h-[210px] rounded-full border-2 border-emerald-400/40 animate-ping opacity-25" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.25)_0%,transparent_70%)]" />
          </>
        )}
      </div>

      {/* Header Tag */}
      <div className="relative z-10 flex items-center gap-2 mb-3 px-3 py-1 rounded-full bg-black/60 border border-slate-700/80 text-slate-200 text-xs font-mono font-bold tracking-wider uppercase">
        {variant === 'red' ? (
          <>
            <Flame className="w-4 h-4 text-rose-500 animate-bounce" />
            <span className="text-rose-400 font-black">OHNI VÝSTRAHA - VYSOKÉ RIZIKO</span>
          </>
        ) : variant === 'gold' ? (
          <>
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
            <span className="text-amber-300 font-black">ZLATÁ ZÓNA - PROVĚŘENO A POZOR</span>
          </>
        ) : (
          <>
            <Zap className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-emerald-300 font-black">ZELENÝ ŠTÍT - BEZPEČNÝ INZERÁT</span>
          </>
        )}
      </div>

      {/* Center Animated Shield & Score Display */}
      <div className="relative z-10 flex flex-col items-center justify-center my-2">
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
          {/* Outer ring */}
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="42"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              stroke={variant === 'red' ? '#F43F5E' : variant === 'gold' ? '#F59E0B' : '#10B981'}
              strokeWidth="8"
              fill="none"
              strokeDasharray={264}
              strokeDashoffset={264 - (264 * normalized) / 100}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Center icon */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {variant === 'red' ? (
              <ShieldAlert className="w-9 h-9 text-rose-500 drop-shadow-[0_0_12px_rgba(244,63,94,0.9)] animate-pulse" />
            ) : variant === 'gold' ? (
              <AlertTriangle className="w-9 h-9 text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.9)]" />
            ) : (
              <ShieldCheck className="w-9 h-9 text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.9)]" />
            )}
            <span
              className={`text-2xl sm:text-3xl font-black mt-0.5 tracking-tight ${
                variant === 'red'
                  ? 'text-rose-400'
                  : variant === 'gold'
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {normalized}%
            </span>
          </div>
        </div>

        <p className="mt-2 text-xs sm:text-sm font-black uppercase text-slate-200 tracking-wide">
          {variant === 'red'
            ? '🛑 Nekompromisní varování AI před podvodem'
            : variant === 'gold'
            ? '🟡 Doporučeno ověřit detaily a platbu'
            : '🟢 Prověřeno bezpečnostním filtrem ShadowGuard'}
        </p>
      </div>
    </div>
  );
};
