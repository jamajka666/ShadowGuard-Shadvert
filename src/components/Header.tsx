import React, { useEffect, useState } from 'react';
import { Mic, Settings, Wifi, WifiOff } from 'lucide-react';
import { ThemeMode, UserRoleMode } from '../types';
import { ShadowGuardLogo } from './ShadowGuardLogo';
import { SettingsModal } from './SettingsModal';

interface HeaderProps {
  fontSize: 'normal' | 'large' | 'xlarge'; setFontSize: (size: 'normal' | 'large' | 'xlarge') => void;
  themeMode: ThemeMode; setThemeMode: (mode: ThemeMode) => void;
  userRoleMode: UserRoleMode; setUserRoleMode: (role: UserRoleMode) => void;
  autoRead: boolean; setAutoRead: (val: boolean) => void;
  onOpenCriteria: () => void; onOpenFatherGuide: () => void; onOpenSendToSon: () => void;
  onOpenInstallPwa?: () => void; onOpenGuide: () => void; onOpenQuiz: () => void; onOpenVoiceControls: () => void;
}

export const Header: React.FC<HeaderProps> = (props) => {
  const [isOnline, setIsOnline] = useState(() => typeof navigator === 'undefined' || navigator.onLine);
  const [settingsOpen, setSettingsOpen] = useState(false);
  useEffect(() => {
    const online = () => setIsOnline(true); const offline = () => setIsOnline(false);
    window.addEventListener('online', online); window.addEventListener('offline', offline);
    return () => { window.removeEventListener('online', online); window.removeEventListener('offline', offline); };
  }, []);
  return <>
    <header className="safe-area-pad-top border-b border-[#CD7F32]/40 bg-[#121214] text-slate-100 shadow-[0_4px_20px_rgba(212,160,23,0.12)]">
      {!isOnline && <p className="bg-rose-700 px-4 py-2 text-center text-xs font-bold text-white">Bez připojení: novou prověrku teď nelze spustit.</p>}
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-3 min-w-0">
          <ShadowGuardLogo size="md" showSubtitle={true} className="min-w-0" />
          <div className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-black ${isOnline ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300' : 'border-rose-500 bg-rose-950 text-rose-200'}`} title={isOnline ? 'Připojení k internetu je aktivní' : 'Aplikace je offline'}>{isOnline ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}{isOnline ? 'Připojeno' : 'Offline'}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2 pb-0.5">
          <div className="flex shrink-0 rounded-xl border border-slate-700 bg-[#1C1C1E] p-1" aria-label="Úroveň zobrazených detailů">
            <button type="button" onClick={() => props.setUserRoleMode('senior')} className={`rounded-lg px-3 py-1.5 text-sm font-bold ${props.userRoleMode === 'senior' ? 'bg-[#D4AF37] text-black' : 'text-slate-300'}`}>Stručný</button>
            <button type="button" onClick={() => props.setUserRoleMode('expert')} className={`rounded-lg px-3 py-1.5 text-sm font-bold ${props.userRoleMode === 'expert' ? 'bg-cyan-400 text-slate-950' : 'text-slate-300'}`}>Detailní</button>
          </div>
          <button type="button" onClick={() => { window.dispatchEvent(new Event('shadowguard:voice-controls')); props.onOpenVoiceControls(); }} className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-cyan-500/40 bg-[#1C1C1E] px-3 py-2 text-sm font-bold text-cyan-300"><Mic className="h-4 w-4" /> Hlasové ovládání</button>
          <button type="button" onClick={() => setSettingsOpen(true)} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#D4AF37] px-3 py-2 text-sm font-black text-black"><Settings className="h-4 w-4" /> Nastavení</button>
        </div>
      </div>
    </header>
    <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} {...props} />
  </>;
};
