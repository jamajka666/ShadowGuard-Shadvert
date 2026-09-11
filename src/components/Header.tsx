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
  const connectedClass = `inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-sm font-black min-h-11 md:min-h-9 ${isOnline ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300' : 'border-rose-500 bg-rose-950 text-rose-200'}`;
  const connected = (
    <div className={connectedClass} title={isOnline ? 'Připojení k internetu je aktivní' : 'Aplikace je offline'}>
      {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
      {isOnline ? 'Připojeno' : 'Offline'}
    </div>
  );
  const ctrl = 'inline-flex items-center justify-center gap-2 rounded-xl min-h-11 px-3 text-base md:text-sm font-bold';
  return <>
    <header className="sg-header shrink-0 safe-area-pad-top border-b border-[#CD7F32]/40 bg-[#121214] text-slate-100 shadow-[0_4px_20px_rgba(212,160,23,0.12)]">
      {!isOnline && <p className="bg-rose-700 px-4 py-2 text-center text-sm font-bold text-white">Bez připojení: novou prověrku teď nelze spustit.</p>}
      <div className="mx-auto w-full max-w-[1100px] min-[1920px]:max-w-[1200px] px-3 py-2 md:px-5 md:py-2.5">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center justify-between gap-2 lg:justify-start">
            <ShadowGuardLogo size="md" showSubtitle={true} className="min-w-0" />
            <div className="lg:hidden">{connected}</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex min-h-11 shrink-0 rounded-xl border border-slate-700 bg-[#1C1C1E] p-1" aria-label="Úroveň zobrazených detailů">
              <button type="button" onClick={() => props.setUserRoleMode('senior')} className={`rounded-lg px-3 min-h-9 text-base md:text-sm font-bold ${props.userRoleMode === 'senior' ? 'bg-[#D4AF37] text-black' : 'text-slate-300'}`}>Stručný</button>
              <button type="button" onClick={() => props.setUserRoleMode('expert')} className={`rounded-lg px-3 min-h-9 text-base md:text-sm font-bold ${props.userRoleMode === 'expert' ? 'bg-cyan-400 text-slate-950' : 'text-slate-300'}`}>Detailní</button>
            </div>
            <button type="button" onClick={() => { window.dispatchEvent(new Event('shadowguard:voice-controls')); props.onOpenVoiceControls(); }} className={`${ctrl} border border-cyan-500/40 bg-[#1C1C1E] text-cyan-300`}><Mic className="h-4 w-4" /> Hlasové ovládání</button>
            <button type="button" onClick={() => setSettingsOpen(true)} className={`${ctrl} bg-[#D4AF37] text-black font-black`}><Settings className="h-4 w-4" /> Nastavení</button>
            <div className="hidden lg:inline-flex">{connected}</div>
          </div>
        </div>
      </div>
    </header>
    <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} {...props} />
  </>;
};
