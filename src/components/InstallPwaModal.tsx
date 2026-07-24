import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, CheckCircle2, Share, PlusSquare, ShieldCheck } from 'lucide-react';

interface InstallPwaModalProps {
  isOpen: boolean;
  onClose: () => void;
  uiMode: 'senior' | 'cyber' | 'contrast';
}

export const InstallPwaModal: React.FC<InstallPwaModalProps> = ({ isOpen, onClose, uiMode }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if running in standalone PWA mode
    if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
      setIsInstalled(true);
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(iosDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  const isShadowGuard = uiMode === 'shadowguard' as any;
  const isCyber = uiMode === 'cyber';
  const isContrast = uiMode === 'contrast';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div
        className={`w-full max-w-lg rounded-3xl p-6 sm:p-8 border-2 shadow-2xl relative transition-all animate-in fade-in zoom-in duration-200 ${
          isShadowGuard
            ? 'bg-[#121214] border-[#CD7F32]/80 text-white shadow-[0_0_50px_rgba(212,160,23,0.3)] shadowguard-bronze-border'
            : isCyber
            ? 'bg-slate-950 border-cyan-500/80 text-white shadow-[0_0_50px_rgba(6,182,212,0.3)]'
            : isContrast
            ? 'bg-black border-yellow-400 text-white'
            : 'bg-white border-slate-200 text-slate-900 shadow-2xl'
        }`}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white p-2 rounded-xl transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className={`p-3 rounded-2xl ${
              isCyber
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'bg-emerald-600 text-white'
            }`}
          >
            <Smartphone className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Nainstalovat na plochu telefonu (PWA)
            </h2>
            <p className={`text-xs sm:text-sm font-medium ${isCyber ? 'text-cyan-300' : 'text-slate-500'}`}>
              Strážce Inzerátů přímo jako ikona na vaší domovské obrazovce
            </p>
          </div>
        </div>

        {/* Already installed view */}
        {isInstalled ? (
          <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-sm flex items-start gap-3 mb-6">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-base text-emerald-300">Aplikace je již nainstalována!</span>
              <span>Spouštíte aplikaci v samostatném PWA režimu z plochy svého telefonu.</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4 mb-6 text-sm leading-relaxed">
            {/* Native browser install button if prompt available */}
            {deferredPrompt && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 space-y-3">
                <p className="font-bold text-emerald-400 text-sm">
                  ✓ Váš prohlížeč podporuje přímou instalaci na 1 kliknutí:
                </p>
                <button
                  onClick={handleInstallClick}
                  className={`w-full py-3.5 px-6 rounded-2xl font-black text-base shadow-lg transition-all flex items-center justify-center gap-2.5 ${
                    isCyber
                      ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 cyber-button-emerald'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  <Download className="w-5 h-5" />
                  <span>NAINSTALOVAT DO TELEFONU NENÍ POTŘEBA APP STORE</span>
                </button>
              </div>
            )}

            {/* Manual Instructions for iOS Safari */}
            {isIOS ? (
              <div className={`p-4 rounded-2xl border ${isCyber ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className="font-black text-sm block mb-2 text-slate-900 dark:text-white flex items-center gap-2">
                  <AppleIcon className="w-4 h-4 text-emerald-400" />
                  Návod pro iPhone / iPad (Safari):
                </span>
                <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  <li className="flex items-center gap-2">
                    1. Klepněte v Safari na tlačítko <strong>Sdílet</strong> <Share className="w-4 h-4 text-blue-400 inline" /> na spodní liště.
                  </li>
                  <li className="flex items-center gap-2">
                    2. Vyberte možnost <strong>Pridat na plochu</strong> <PlusSquare className="w-4 h-4 text-slate-400 inline" />.
                  </li>
                  <li>3. Potvrďte stisknutím tlačítka <strong>Přidat</strong> vpravo nahoře.</li>
                </ol>
              </div>
            ) : !deferredPrompt ? (
              /* Manual Instructions for Android / Chrome */
              <div className={`p-4 rounded-2xl border ${isCyber ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className="font-black text-sm block mb-2 text-slate-900 dark:text-white">
                  Návod pro Android (Chrome / Edge / Firefox):
                </span>
                <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  <li>1. Otevřete nabídku prohlížeče (3 tečky vpravo nahoře).</li>
                  <li>2. Klepněte na <strong>Přidat na plochu</strong> nebo <strong>Nainstalovat aplikaci</strong>.</li>
                  <li>3. Potvrďte přidání ikony. Strážce inzerátů se objeví na vaší domovské obrazovce.</li>
                </ol>
              </div>
            ) : null}

            {/* PWA Benefits */}
            <div className={`p-4 rounded-2xl border ${isCyber ? 'bg-slate-900/60 border-slate-800' : 'bg-emerald-50 border-emerald-200'} text-xs space-y-1.5`}>
              <span className="font-bold text-emerald-400 block mb-1">Výhody nainstalované PWA aplikace:</span>
              <p>• Rychlé spuštění přímo z ikony bez zadávání webové adresy</p>
              <p>• Plnoobrazovkový režim přizpůsobený pro starší tvořítka a telefony</p>
              <p>• Automatické ukládání do paměti a rychlá odezva bez načítání</p>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className={`w-full py-3 px-4 rounded-2xl font-bold text-sm transition-all border ${
            isCyber
              ? 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300'
          }`}
        >
          Zavřít
        </button>
      </div>
    </div>
  );
};

const AppleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.13c.66-.8 1.11-1.92.99-3.03-.96.04-2.12.64-2.8 1.44-.61.71-1.14 1.86-1 2.97 1.08.08 2.16-.57 2.81-1.38" />
  </svg>
);
