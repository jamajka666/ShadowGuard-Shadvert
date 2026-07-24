import React, { useEffect, useState } from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle, X } from 'lucide-react';
import { SafetyLevel } from '../types';

interface RiskLevelToastProps {
  safetyLevel: SafetyLevel | null;
  headline?: string;
  onClose?: () => void;
  autoHideMs?: number;
}

const CONFIG: Record<
  SafetyLevel,
  {
    title: string;
    color: string;
    border: string;
    bg: string;
    video: string;
    Icon: typeof ShieldCheck;
  }
> = {
  DUVERYHODNE: {
    title: 'Vypadá to bezpečně',
    color: 'text-emerald-300',
    border: 'border-emerald-400',
    bg: 'bg-emerald-950/95',
    video: '/brand/notify-safe.mp4',
    Icon: ShieldCheck,
  },
  OPATRNOSTI: {
    title: 'Zvýšená opatrnost',
    color: 'text-amber-300',
    border: 'border-amber-400',
    bg: 'bg-amber-950/95',
    video: '/brand/notify-caution.mp4',
    Icon: AlertTriangle,
  },
  PODVOD: {
    title: 'POZOR — riziko podvodu!',
    color: 'text-rose-300',
    border: 'border-rose-500',
    bg: 'bg-rose-950/95',
    video: '/brand/notify-danger.mp4',
    Icon: ShieldAlert,
  },
};

export const RiskLevelToast: React.FC<RiskLevelToastProps> = ({
  safetyLevel,
  headline,
  onClose,
  autoHideMs = 5200,
}) => {
  const [open, setOpen] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    if (!safetyLevel) {
      setOpen(false);
      return;
    }
    setOpen(true);
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
    const t = setTimeout(() => {
      setOpen(false);
      onClose?.();
    }, autoHideMs);
    return () => clearTimeout(t);
  }, [safetyLevel, autoHideMs, onClose]);

  if (!open || !safetyLevel) return null;

  const cfg = CONFIG[safetyLevel];
  const Icon = cfg.Icon;

  return (
    <div className="fixed inset-x-0 top-4 z-[90] flex justify-center px-4 pointer-events-none">
      <div
        className={`pointer-events-auto w-full max-w-md overflow-hidden rounded-2xl border-2 ${cfg.border} ${cfg.bg} shadow-2xl text-white relative`}
        role="alert"
      >
        {!reduceMotion && (
          <video
            className="absolute inset-0 w-full h-full object-cover opacity-30"
            src={cfg.video}
            autoPlay
            muted
            playsInline
            onError={(e) => {
              (e.target as HTMLVideoElement).style.display = 'none';
            }}
          />
        )}
        <div className="relative z-10 p-4 sm:p-5 flex items-start gap-3">
          <div
            className={`p-2.5 rounded-xl shrink-0 ${
              safetyLevel === 'PODVOD'
                ? 'bg-rose-600 animate-pulse'
                : safetyLevel === 'OPATRNOSTI'
                ? 'bg-amber-600'
                : 'bg-emerald-600'
            }`}
          >
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`font-black text-sm sm:text-base ${cfg.color}`}>{cfg.title}</p>
            {headline && (
              <p className="text-xs sm:text-sm text-slate-200 mt-1 line-clamp-3 font-medium">{headline}</p>
            )}
          </div>
          <button
            type="button"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 shrink-0"
            onClick={() => {
              setOpen(false);
              onClose?.();
            }}
            aria-label="Zavřít"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Color bar */}
        <div
          className={`h-1.5 w-full ${
            safetyLevel === 'PODVOD'
              ? 'bg-gradient-to-r from-rose-600 via-red-500 to-orange-500'
              : safetyLevel === 'OPATRNOSTI'
              ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-400'
              : 'bg-gradient-to-r from-emerald-500 via-green-400 to-cyan-400'
          }`}
        />
      </div>
    </div>
  );
};
