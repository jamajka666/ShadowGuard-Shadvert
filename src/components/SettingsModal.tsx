import React from 'react';
import { BookOpen, Download, Heart, HelpCircle, Send, Smartphone, Volume2, X } from 'lucide-react';
import { ThemeMode, UserRoleMode } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  fontSize: 'normal' | 'large' | 'xlarge';
  setFontSize: (size: 'normal' | 'large' | 'xlarge') => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  userRoleMode: UserRoleMode;
  setUserRoleMode: (role: UserRoleMode) => void;
  autoRead: boolean;
  setAutoRead: (value: boolean) => void;
  onOpenCriteria: () => void;
  onOpenFatherGuide: () => void;
  onOpenSendToSon: () => void;
  onOpenInstallPwa?: () => void;
  onOpenGuide: () => void;
  onOpenQuiz: () => void;
  onOpenVoiceControls: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, ...props }) => {
  if (!isOpen) return null;
  const open = (action: () => void) => { onClose(); action(); };
  const itemClass = 'flex w-full items-center gap-3 rounded-xl border border-slate-700 bg-[#1C1C1E] px-4 py-3 text-left text-sm font-bold text-slate-100 hover:border-[#D4AF37]';
  const labels: Record<ThemeMode, string> = { shadowguard: 'ShadowGuard', cyberpunk: 'Cyberpunk', highContrast: 'Kontrast', classic: 'Klasický' };

  return (
    <div className="fixed inset-0 z-[110] flex items-end bg-black/70 p-3 backdrop-blur-sm sm:items-center sm:justify-center" role="dialog" aria-modal="true" aria-label="Nastavení">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-[#D4AF37]/60 bg-[#121214] p-5 text-slate-100 shadow-2xl">
        <div className="mb-5 flex items-center justify-between gap-3"><div><h2 className="text-xl font-black">Nastavení</h2><p className="text-sm text-slate-400">Další možnosti jsou schované tady, aby hlavní stránka zůstala přehledná.</p></div><button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-300 hover:bg-white/10" aria-label="Zavřít nastavení"><X /></button></div>
        <section className="space-y-3">
          <div className="rounded-xl border border-slate-700 bg-[#1C1C1E] p-4"><p className="mb-2 text-sm font-black">Vzhled</p><div className="flex flex-wrap gap-2">{(['shadowguard', 'cyberpunk', 'highContrast', 'classic'] as ThemeMode[]).map((mode) => <button key={mode} type="button" onClick={() => props.setThemeMode(mode)} className={`rounded-lg px-2.5 py-1.5 text-xs font-bold ${props.themeMode === mode ? 'bg-[#D4AF37] text-black' : 'bg-slate-800 text-slate-200'}`}>{labels[mode]}</button>)}</div></div>
          <div className="rounded-xl border border-slate-700 bg-[#1C1C1E] p-4"><p className="mb-2 text-sm font-black">Písmo</p><div className="flex gap-2">{(['normal', 'large', 'xlarge'] as const).map((size) => <button key={size} type="button" onClick={() => props.setFontSize(size)} className={`rounded-lg px-3 py-1.5 font-bold ${props.fontSize === size ? 'bg-cyan-400 text-slate-950' : 'bg-slate-800'}`}>{size === 'normal' ? 'A' : size === 'large' ? 'A+' : 'A++'}</button>)}</div></div>
          <button type="button" onClick={() => props.setAutoRead(!props.autoRead)} className={itemClass}><Volume2 className="h-5 w-5 text-emerald-400" /> Automatické čtení výsledků: {props.autoRead ? 'zapnuto' : 'vypnuto'}</button>
          {props.onOpenInstallPwa && <button type="button" onClick={() => open(props.onOpenInstallPwa!)} className={itemClass}><Download className="h-5 w-5 text-emerald-400" /> Aplikace do telefonu (PWA)</button>}
          <button type="button" onClick={() => open(props.onOpenCriteria)} className={itemClass}><HelpCircle className="h-5 w-5 text-cyan-400" /> Principy a kritéria kontroly</button>
          <button type="button" onClick={() => open(props.onOpenFatherGuide)} className={itemClass}><Smartphone className="h-5 w-5 text-amber-400" /> Pro tátu / jak dát do telefonu</button>
          <button type="button" onClick={() => open(props.onOpenSendToSon)} className={itemClass}><Send className="h-5 w-5 text-sky-400" /> Poslat synovi</button>
          <button type="button" onClick={() => open(props.onOpenGuide)} className={itemClass}><Heart className="h-5 w-5 text-rose-400" /> Zlatá pravidla</button>
          <button type="button" onClick={() => open(props.onOpenQuiz)} className={itemClass}><BookOpen className="h-5 w-5 text-violet-400" /> Trénink podvodů</button>
        </section>
      </div>
    </div>
  );
};
