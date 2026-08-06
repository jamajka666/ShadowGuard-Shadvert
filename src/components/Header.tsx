import React, { useState, useEffect } from 'react';
import { ShieldCheck, Eye, Sun, Volume2, Cpu, Smartphone, Send, Sparkles, VolumeX, Download, Wifi, WifiOff, User, ShieldAlert, CheckCircle, Settings, UserCheck } from 'lucide-react';
import { speakText, stopSpeech } from '../utils/tts';
import { ThemeMode, UserRoleMode } from '../types';
import { ShadowGuardLogo } from './ShadowGuardLogo';

interface HeaderProps {
  fontSize: 'normal' | 'large' | 'xlarge';
  setFontSize: (size: 'normal' | 'large' | 'xlarge') => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  userRoleMode: UserRoleMode;
  setUserRoleMode: (role: UserRoleMode) => void;
  autoRead: boolean;
  setAutoRead: (val: boolean) => void;
  onOpenCriteria: () => void;
  onOpenFatherGuide: () => void;
  onOpenSendToSon: () => void;
  onOpenInstallPwa?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  fontSize,
  setFontSize,
  themeMode,
  setThemeMode,
  userRoleMode,
  setUserRoleMode,
  autoRead,
  setAutoRead,
  onOpenCriteria,
  onOpenFatherGuide,
  onOpenSendToSon,
  onOpenInstallPwa,
}) => {
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleTestVoice = () => {
    if (isTestingVoice) {
      stopSpeech();
      setIsTestingVoice(false);
      return;
    }

    setIsTestingVoice(true);
    speakText(
      'Vítá vás bezpečnostní systém ShadowGuard Shadvert. Hlasové čtení výsledků je zapnuté a v pořádku funguje.',
      () => setIsTestingVoice(false),
      () => setIsTestingVoice(false)
    );
  };

  const isShadowGuard = themeMode === 'shadowguard';
  const isCyber = themeMode === 'cyberpunk';
  const isContrast = themeMode === 'highContrast';

  return (
    <header
      className={`border-b shadow-xl transition-all safe-area-pad-top ${
        isShadowGuard
          ? 'bg-[#121214] text-slate-100 border-[#CD7F32]/40 shadow-[0_4px_30px_rgba(212,160,23,0.15)]'
          : isCyber
          ? 'bg-slate-950 text-slate-100 border-cyan-500/30 shadow-[0_4px_25px_rgba(6,182,212,0.15)]'
          : isContrast
          ? 'bg-black text-white border-yellow-400'
          : 'bg-slate-900 text-white border-slate-800'
      }`}
    >
      {/* Offline Alert Banner */}
      {!isOnline && (
        <div className="bg-rose-600 text-white px-4 py-2 text-xs sm:text-sm font-black flex items-center justify-center gap-2 text-center border-b border-rose-400 animate-pulse">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>Aplikace je aktuálně offline. Pro novou prověrku inzerátu nebo SSL certifikátu se prosím připojte k internetu.</span>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Brand Logo & Tagline */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full lg:w-auto">
            <div>
              <ShadowGuardLogo size="md" showSubtitle={true} />
              <p className={`text-xs sm:text-sm font-medium mt-1.5 ${isShadowGuard ? 'text-slate-300' : isCyber ? 'text-cyan-300' : 'text-slate-300'}`}>
                Bezpečnostní štít a prověrka inzerátů a e-shopů pro celou rodinu
              </p>
            </div>

            {/* Connection Status Badge */}
            <div
              className={`px-3 py-1 rounded-full border text-[11px] sm:text-xs font-black flex items-center gap-1.5 transition-all shrink-0 ${
                isOnline
                  ? isShadowGuard
                    ? 'bg-[#D4A017]/20 text-[#F5D061] border-[#D4A017]/50 shadow-[0_0_10px_rgba(212,160,23,0.3)]'
                    : isCyber
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                    : isContrast
                    ? 'bg-yellow-400 text-black border-yellow-500 font-black'
                    : 'bg-emerald-900/80 text-emerald-300 border-emerald-600'
                  : 'bg-rose-950 text-rose-200 border-rose-500 animate-pulse'
              }`}
              title={
                isOnline
                  ? 'Připojení k internetu je aktivní. Prověrka inzerátů i SSL certifikátů je dostupná.'
                  : 'Režim offline: Pro prověření nového inzerátu je vyžadováno internetové připojení.'
              }
            >
              <span className="relative flex h-2 w-2">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isOnline ? 'bg-emerald-400' : 'bg-rose-400'
                  }`}
                ></span>
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    isOnline ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                ></span>
              </span>
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Připojeno</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>Bez připojení</span>
                </>
              )}
            </div>
          </div>

          {/* User Profile & Role Switcher + Quick Actions */}
          <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 w-full lg:w-auto pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
            {/* User Profile Card */}
            <div
              className={`p-2 rounded-2xl border flex items-center gap-3 transition-all ${
                isShadowGuard
                  ? 'bg-[#1C1C1E] border-[#CD7F32]/50 shadow-[0_0_15px_rgba(205,127,50,0.2)]'
                  : isCyber
                  ? 'bg-slate-900/90 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                  : isContrast
                  ? 'bg-black border-yellow-400'
                  : 'bg-slate-800 border-slate-700'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-sm border ${
                  userRoleMode === 'senior'
                    ? isShadowGuard
                      ? 'bg-gradient-to-br from-[#D4A017] to-[#CD7F32] text-black border-yellow-300'
                      : isCyber
                      ? 'bg-emerald-500 text-slate-950 border-emerald-300'
                      : 'bg-emerald-600 text-white border-emerald-400'
                    : isShadowGuard
                    ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-slate-950 border-cyan-300 shadow-[0_0_10px_rgba(0,245,255,0.4)]'
                    : isCyber
                    ? 'bg-cyan-500 text-slate-950 border-cyan-300'
                    : 'bg-sky-600 text-white border-sky-400'
                }`}
              >
                {userRoleMode === 'senior' ? '👵' : '👨‍💻'}
              </div>

              <div className="flex flex-col pr-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
                  <User className="w-3 h-3 text-cyan-400" /> Profil uživatele
                </span>
                <span className="text-xs sm:text-sm font-black text-slate-100 flex items-center gap-1.5">
                  {userRoleMode === 'senior' ? 'Režim seniora' : 'Režim experta'}
                </span>
                <span className="text-[10px] text-slate-500 font-medium leading-tight max-w-[11rem]">
                  {userRoleMode === 'senior'
                    ? 'Jednoduchý start: kontrola hned nahoře'
                    : 'Víc detailů, skóre, historie a audit'}
                </span>

                {/* Role Switch Toggle — testery / rodina můžou porovnat oba pohledy */}
                <div className="flex items-center gap-1 mt-1 bg-slate-950/80 p-0.5 rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setUserRoleMode('senior')}
                    title="Přehledné rozhraní pro tátu a starší generaci"
                    className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                      userRoleMode === 'senior'
                        ? isShadowGuard
                          ? 'bg-[#D4A017] text-black font-black'
                          : 'bg-emerald-500 text-slate-950 font-black'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Senior
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserRoleMode('expert')}
                    title="Technické detaily, týdenní skóre, historie a audit výsledku"
                    className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                      userRoleMode === 'expert'
                        ? isShadowGuard
                          ? 'bg-cyan-400 text-slate-950 font-black shadow-[0_0_8px_rgba(0,245,255,0.5)]'
                          : 'bg-cyan-500 text-slate-950 font-black'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Expert
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Helper Actions Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {onOpenInstallPwa && (
                <button
                  type="button"
                  onClick={onOpenInstallPwa}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all border ${
                    isShadowGuard
                      ? 'bg-[#CD7F32]/20 text-[#F5D061] border-[#D4A017]/50 hover:bg-[#CD7F32]/30'
                      : isCyber
                      ? 'bg-gradient-to-r from-emerald-500/30 to-cyan-500/30 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/40 cyber-button-glow'
                      : isContrast
                      ? 'bg-yellow-400 text-black border-yellow-500 font-black'
                      : 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-700 shadow-sm'
                  }`}
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Aplikace PWA</span>
                </button>
              )}

              <button
                type="button"
                onClick={onOpenCriteria}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all border ${
                  isShadowGuard
                    ? 'bg-[#1C1C1E] text-cyan-400 border-cyan-500/40 hover:bg-cyan-950/40'
                    : isCyber
                    ? 'bg-slate-900/90 text-cyan-400 border-cyan-500/40 hover:bg-cyan-500/20'
                    : isContrast
                    ? 'bg-yellow-400 text-black border-yellow-500'
                    : 'bg-slate-800 text-emerald-400 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>Kritéria</span>
              </button>

              <button
                type="button"
                onClick={onOpenFatherGuide}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all border ${
                  isShadowGuard
                    ? 'bg-[#1C1C1E] text-amber-300 border-amber-500/40 hover:bg-amber-950/40'
                    : isCyber
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30'
                    : isContrast
                    ? 'bg-yellow-400 text-black border-yellow-500'
                    : 'bg-emerald-700 text-white border-emerald-600 hover:bg-emerald-600'
                }`}
              >
                <Smartphone className="w-4 h-4 text-amber-400" />
                <span>Pro tátu</span>
              </button>

              <button
                type="button"
                onClick={onOpenSendToSon}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all border ${
                  isShadowGuard
                    ? 'bg-[#1C1C1E] text-sky-300 border-sky-500/40 hover:bg-sky-950/40'
                    : isCyber
                    ? 'bg-blue-500/20 text-sky-400 border-sky-500/40 hover:bg-blue-500/30'
                    : isContrast
                    ? 'bg-yellow-400 text-black border-yellow-500'
                    : 'bg-slate-800 text-sky-300 border-slate-700'
                }`}
              >
                <Send className="w-4 h-4 text-sky-400" />
                <span>Poslat synovi</span>
              </button>
            </div>
          </div>
        </div>

        {/* Accessibility & Visual Styling Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
          {/* Theme Switcher */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-xs font-semibold px-2">Vzhled:</span>
            <button
              type="button"
              onClick={() => setThemeMode('shadowguard')}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all ${
                isShadowGuard
                  ? 'bg-gradient-to-r from-[#D4A017] to-[#CD7F32] text-black font-black shadow-[0_0_12px_rgba(212,160,23,0.5)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🛡️ ShadowGuard
            </button>
            <button
              type="button"
              onClick={() => setThemeMode('cyberpunk')}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all ${
                isCyber
                  ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-black shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ⚡ Cyberpunk
            </button>
            <button
              type="button"
              onClick={() => setThemeMode('highContrast')}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all ${
                isContrast
                  ? 'bg-yellow-400 text-black font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ☀️ Kontrast
            </button>
            <button
              type="button"
              onClick={() => setThemeMode('classic')}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all ${
                themeMode === 'classic'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ⚪ Klasický
            </button>
          </div>

          {/* Font size & Voice test */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Font size picker */}
            <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-xs font-semibold px-1">Písmo:</span>
              <button
                type="button"
                onClick={() => setFontSize('normal')}
                className={`px-2 py-0.5 rounded font-bold ${
                  fontSize === 'normal' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                }`}
              >
                A
              </button>
              <button
                type="button"
                onClick={() => setFontSize('large')}
                className={`px-2 py-0.5 rounded font-bold ${
                  fontSize === 'large' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                }`}
              >
                A+
              </button>
              {/* A++ jen na širších obrazovkách — na telefonu max A+ (layout) */}
              <button
                type="button"
                onClick={() => setFontSize('xlarge')}
                className={`hidden sm:inline-block px-2 py-0.5 rounded font-black ${
                  fontSize === 'xlarge' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                }`}
                title="Největší písmo (jen na počítači / tabletu na šířku)"
              >
                A++
              </button>
            </div>

            {/* Test Voice Button */}
            <button
              type="button"
              onClick={handleTestVoice}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all border ${
                isTestingVoice
                  ? 'bg-rose-600 text-white animate-pulse border-rose-500'
                  : 'bg-slate-800 text-emerald-400 border-slate-700 hover:bg-slate-700'
              }`}
              title="Vyzkoušet hlasový výstup na tomto zařízení"
            >
              {isTestingVoice ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              <span>{isTestingVoice ? 'Zastavit' : '🔊 Hlas'}</span>
            </button>

            {/* Auto-read toggle */}
            <button
              type="button"
              onClick={() => setAutoRead(!autoRead)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all border ${
                autoRead
                  ? 'bg-emerald-500 text-slate-950 font-black border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <span>Auto-čtení: {autoRead ? 'ZAP' : 'VYP'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

