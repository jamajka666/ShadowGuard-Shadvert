import React, { useState } from 'react';
import { Smartphone, Download, HardDrive, Share2, Check, ExternalLink, X, Globe, Shield, QrCode } from 'lucide-react';
import { ThemeMode } from '../types';
import { isIOS } from '../utils/platform';
import { copyTextToClipboard } from '../utils/shareFile';

interface FatherPhoneGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  themeMode: ThemeMode;
}

export const FatherPhoneGuideModal: React.FC<FatherPhoneGuideModalProps> = ({
  isOpen,
  onClose,
  themeMode,
}) => {
  const [copiedAppUrl, setCopiedAppUrl] = useState(false);
  const [activeDeviceTab, setActiveDeviceTab] = useState<'android' | 'iphone'>(() =>
    isIOS() ? 'iphone' : 'android'
  );

  if (!isOpen) return null;

  const currentUrl = window.location.href;

  const handleCopyLink = async () => {
    const ok = await copyTextToClipboard(currentUrl);
    if (ok) {
      setCopiedAppUrl(true);
      setTimeout(() => setCopiedAppUrl(false), 3000);
    }
  };

  const isShadowGuard = themeMode === 'shadowguard';
  const isCyber = themeMode === 'cyberpunk';
  const isContrast = themeMode === 'highContrast';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto safe-area-inset">
      <div
        className={`relative w-full max-w-3xl modal-max-h overflow-y-auto rounded-3xl p-6 sm:p-8 shadow-2xl border transition-all ${
          isShadowGuard
            ? 'bg-[#121214] border-[#CD7F32]/80 text-white shadow-[0_0_40px_rgba(212,160,23,0.3)] shadowguard-bronze-border'
            : isCyber
            ? 'bg-slate-950 border-emerald-500/40 text-slate-100 shadow-[0_0_30px_rgba(16,185,129,0.2)]'
            : isContrast
            ? 'bg-black border-yellow-400 text-white'
            : 'bg-[#121214] border-[#B8860B]/80 text-slate-100 shadowguard-bronze-border'
        }`}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className={`absolute top-5 right-5 p-2 rounded-2xl transition-colors ${
            isCyber
              ? 'bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30'
              : isContrast
              ? 'bg-yellow-400 text-black hover:bg-yellow-300'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="mb-6 pr-12">
          <div className="flex items-center gap-3 mb-2">
            <div
              className={`p-3 rounded-2xl ${
                isCyber
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : isContrast
                  ? 'bg-yellow-400 text-black'
                  : 'bg-emerald-600 text-white'
              }`}
            >
              <Smartphone className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                Jak nainstalovat aplikaci tátovi do telefonu
              </h2>
              <p className={`text-sm font-medium ${isCyber ? 'text-emerald-400' : 'text-slate-500'}`}>
                Není potřeba stahovat z Google Play ani App Store — funguje ihned jako ikona na ploše!
              </p>
            </div>
          </div>
        </div>

        {/* Share App Link Action */}
        <div className={`p-4 rounded-2xl border mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 ${
          isCyber ? 'bg-slate-900 border-slate-800' : 'bg-[#1C1C1E] border-[#B8860B]/40'
        }`}>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider block text-slate-400">
              Odkaz na tuto aplikaci k poslaní tátovi:
            </span>
            <span className="text-xs font-mono truncate max-w-md block text-emerald-400 mt-0.5">
              {currentUrl}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopyLink}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm shrink-0 flex items-center gap-2 transition-all ${
              copiedAppUrl
                ? 'bg-emerald-500 text-slate-950 font-black'
                : isCyber
                ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/40'
                : 'bg-emerald-600 text-white'
            }`}
          >
            {copiedAppUrl ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            <span>{copiedAppUrl ? 'Odkaz zkopírován!' : 'Zkopírovat odkaz'}</span>
          </button>
        </div>

        {/* Step-by-step device tabs */}
        <div className="mb-6">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-4">
            <button
              type="button"
              onClick={() => setActiveDeviceTab('android')}
              className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
                activeDeviceTab === 'android'
                  ? isCyber
                    ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                    : 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🤖 Android (Samsung, Xiaomi, Motorola...)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveDeviceTab('iphone')}
              className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
                activeDeviceTab === 'iphone'
                  ? isCyber
                    ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                    : 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🍏 iPhone / iPad (iOS Safari)</span>
            </button>
          </div>

          {activeDeviceTab === 'android' ? (
            <div className="space-y-3 text-sm">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center shrink-0">
                  1
                </span>
                <div>
                  <strong>Otevřete tento odkaz v telefonu:</strong>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Pošlete tátovi tento odkaz přes SMS nebo WhatsApp a otevřete ho v prohlížeči Google Chrome nebo Samsung Internet.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center shrink-0">
                  2
                </span>
                <div>
                  <strong>Klikněte na ikonu 3 teček vpravo nahoře v Chrome:</strong>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Zobrazí se nabídka možností prohlížeče.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center shrink-0">
                  3
                </span>
                <div>
                  <strong>Zvolte „Přidat na plochu“ nebo „Instalovat aplikaci“:</strong>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Na hlavním displeji tátova telefonu se okamžitě vytvoří zelená ikona 🛡️ <strong>Strážce Inzerátů</strong>, ze které aplikaci vždy jedním tuknutím spustí!
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center shrink-0">
                  1
                </span>
                <div>
                  <strong>Otevřete odkaz v prohlížeči Safari na iPhone:</strong>
                  <p className="text-xs text-slate-400 mt-0.5">Ujistěte se, že používáte výchozí Safari.</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center shrink-0">
                  2
                </span>
                <div>
                  <strong>Stiskněte tlačítko Sdílet (čtvereček se šipkou nahoru) dole uprostřed:</strong>
                  <p className="text-xs text-slate-400 mt-0.5">Otevře se nabídka akcí systému iOS.</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center shrink-0">
                  3
                </span>
                <div>
                  <strong>Klepněte na „Přidat na plochu“ (Add to Home Screen):</strong>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Aplikace bude vypadat i reagovat jako klasická aplikace stažená z App Store.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 font-black flex items-center justify-center shrink-0">
                  !
                </span>
                <div>
                  <strong className="text-amber-200">Hlas na iPhonu je omezený</strong>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Diktát a hlasové příkazy v Safari často nefungují. Táta může klidně{' '}
                    <strong>psát text, vkládat odkaz nebo fotit</strong> inzerát — kontrola a historie fungují stejně.
                    Plný hlas je spolehlivější na Androidu (Chrome).
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section: Main Storage Info */}
        <div className={`p-5 rounded-2xl border ${
          isCyber ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3 mb-2">
            <HardDrive className="w-6 h-6 text-sky-400 shrink-0" />
            <h3 className="text-lg font-black">Kde bude mít aplikace hlavní úložiště?</h3>
          </div>

          <div className="space-y-2 text-xs sm:text-sm opacity-90 leading-relaxed">
            <p>
              📍 <strong>Místní úložiště (Local Storage v telefonu):</strong> Všechna osobní data, historie prověřených inzerátů, uložené testy a nastavení písma či hlasu jsou bezpečně uložena <u>přímo v paměti tátova telefonu</u>.
            </p>
            <p>
              ☁️ <strong>Cloudová kontrola v reálném čase:</strong> Když táta vloží inzerát k prověření, šifrovaný text se odešle na náš bezpečný server s umělou inteligencí Google Gemini k analýze a hned se vrátí výsledek. Vše bez nutnosti registrace nebo zadávání osobních údajů.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 text-center">
          <button
            type="button"
            onClick={onClose}
            className={`px-8 py-3 rounded-2xl font-bold transition-all ${
              isCyber
                ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : 'bg-slate-900 text-white'
            }`}
          >
            Rozumím
          </button>
        </div>
      </div>
    </div>
  );
};
