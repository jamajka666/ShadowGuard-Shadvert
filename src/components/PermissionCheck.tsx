import React, { useState, useEffect } from 'react';
import { Mic, Lock, ShieldAlert, CheckCircle2, RefreshCw, X, Info, Globe, AlertTriangle } from 'lucide-react';
import { checkMicDiagnostics, requestMicrophoneAccess, MicDiagnostics } from '../utils/micPermissions';
import { ThemeMode } from '../types';

interface PermissionCheckProps {
  themeMode?: ThemeMode;
  onClose?: () => void;
  onPermissionGranted?: () => void;
  className?: string;
}

export const PermissionCheck: React.FC<PermissionCheckProps> = ({
  themeMode = 'shadowguard',
  onClose,
  onPermissionGranted,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'chrome' | 'safari' | 'edge' | 'mobile'>('chrome');
  const [diagnostics, setDiagnostics] = useState<MicDiagnostics | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const isShadowGuard = themeMode === 'shadowguard';
  const isCyber = themeMode === 'cyberpunk';
  const isContrast = themeMode === 'highContrast';

  const runDiagnostics = async () => {
    const diag = await checkMicDiagnostics();
    setDiagnostics(diag);
    if (diag.permissionState === 'granted' && onPermissionGranted) {
      onPermissionGranted();
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const handleTestAndRequest = async () => {
    setIsChecking(true);
    setStatusMessage('Žádám o přístup k mikrofonu...');

    const res = await requestMicrophoneAccess();
    setIsChecking(false);

    if (res.success) {
      setStatusMessage('✅ Mikrofon byl úspěšně povolen!');
      await runDiagnostics();
      if (onPermissionGranted) {
        onPermissionGranted();
      }
    } else {
      setStatusMessage(`🛑 ${res.message}`);
      await runDiagnostics();
    }
  };

  return (
    <div
      className={`rounded-3xl p-5 sm:p-7 border shadow-xl relative transition-all ${
        isCyber
          ? 'bg-slate-950 border-cyan-500/60 text-slate-100 shadow-[0_0_30px_rgba(6,182,212,0.2)]'
          : isContrast
          ? 'bg-black border-yellow-400 text-white'
          : 'bg-[#121214] border-[#B8860B]/80 text-slate-100 shadowguard-bronze-border'
      } ${className}`}
    >
      {onClose && (
        <button
          onClick={onClose}
          type="button"
          className="absolute right-4 top-4 text-slate-400 hover:text-white p-2 rounded-xl transition-colors"
          title="Zavřít zprávu"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Header */}
      <div className="flex items-start gap-4 mb-5 pb-4 border-b border-slate-800">
        <div className="p-3.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 bg-amber-950/80 px-2.5 py-0.5 rounded-md border border-amber-500/30">
            Přístup k mikrofonu zablokován
          </span>
          <h3 className="text-lg sm:text-xl font-black mt-1 text-white">
            Jak povolit mikrofon v prohlížeči?
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Pro použití hlasového zadávání inzerátů a hlasových příkazů povolte přístup k mikrofonu podle vašeho prohlížeče.
          </p>
        </div>
      </div>

      {/* Quick Status Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-6 text-xs">
        <div className="p-3 rounded-2xl bg-[#1C1C1E] border border-slate-800 flex items-center gap-2">
          <Globe className={`w-4 h-4 shrink-0 ${diagnostics?.isSecureContext ? 'text-emerald-400' : 'text-rose-400'}`} />
          <div>
            <span className="block text-[10px] text-slate-500 font-bold uppercase">Protokol Web</span>
            <span className="font-bold text-slate-200">
              {diagnostics?.isSecureContext ? 'HTTPS (Zabezpečeno)' : 'HTTP (Nezabezpečeno)'}
            </span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-[#1C1C1E] border border-slate-800 flex items-center gap-2">
          <Mic className={`w-4 h-4 shrink-0 ${diagnostics?.permissionState === 'granted' ? 'text-emerald-400' : 'text-rose-400'}`} />
          <div>
            <span className="block text-[10px] text-slate-500 font-bold uppercase">Stav mikrofonu</span>
            <span className="font-bold text-slate-200">
              {diagnostics?.permissionState === 'granted'
                ? 'Povoleno'
                : diagnostics?.permissionState === 'denied'
                ? 'Zablokováno'
                : 'Povolení vyžadováno'}
            </span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-[#1C1C1E] border border-slate-800 flex items-center gap-2">
          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          <div>
            <span className="block text-[10px] text-slate-500 font-bold uppercase">Prohlížeč</span>
            <span className="font-bold text-slate-200">
              {diagnostics?.hasSpeechRecognitionSupport ? 'Web Speech podpořen' : 'Vyžadován Chrome / Edge'}
            </span>
          </div>
        </div>
      </div>

      {/* Browser Selection Tabs */}
      <div className="flex flex-wrap gap-2 mb-4 border-b border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('chrome')}
          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
            activeTab === 'chrome'
              ? 'bg-[#B8860B] text-black font-black border border-[#D4AF37] shadow-md'
              : 'bg-[#1C1C1E] text-slate-300 hover:text-white border border-slate-800'
          }`}
        >
          <span>🌐 Google Chrome</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('safari')}
          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
            activeTab === 'safari'
              ? 'bg-[#B8860B] text-black font-black border border-[#D4AF37] shadow-md'
              : 'bg-[#1C1C1E] text-slate-300 hover:text-white border border-slate-800'
          }`}
        >
          <span>🧭 Apple Safari</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('edge')}
          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
            activeTab === 'edge'
              ? 'bg-[#B8860B] text-black font-black border border-[#D4AF37] shadow-md'
              : 'bg-[#1C1C1E] text-slate-300 hover:text-white border border-slate-800'
          }`}
        >
          <span>🌀 Microsoft Edge</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('mobile')}
          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
            activeTab === 'mobile'
              ? 'bg-[#B8860B] text-black font-black border border-[#D4AF37] shadow-md'
              : 'bg-[#1C1C1E] text-slate-300 hover:text-white border border-slate-800'
          }`}
        >
          <span>📱 Mobil (Android / iOS)</span>
        </button>
      </div>

      {/* Instructions depending on active tab */}
      <div className="p-4 rounded-2xl bg-[#1C1C1E] border border-slate-800 mb-5 text-xs sm:text-sm space-y-3">
        {activeTab === 'chrome' && (
          <>
            <h4 className="font-bold text-[#00F5FF] flex items-center gap-1.5">
              <span>Google Chrome na PC / Mac:</span>
            </h4>
            <ol className="list-decimal list-inside space-y-2 text-slate-300 leading-relaxed">
              <li>
                Klikněte na ikonu <strong>Zámek 🔒</strong> nebo <strong>Nastavení webu ⚙️</strong> vlevo v adresním řádku (před názvem webu).
              </li>
              <li>
                Vyhledejte položku <strong>"Mikrofon"</strong> a přepněte ze stavu <em>Zablokováno</em> na <strong>Povolit (Allow)</strong>.
              </li>
              <li>
                Klepněte na tlačítko <strong>"Povolit mikrofon znovu"</strong> níže nebo obnovte stránku.
              </li>
            </ol>
          </>
        )}

        {activeTab === 'safari' && (
          <>
            <h4 className="font-bold text-[#00F5FF] flex items-center gap-1.5">
              <span>Apple Safari (Mac / iPhone / iPad):</span>
            </h4>
            <div className="mb-3 p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-100 text-xs sm:text-sm leading-relaxed">
              <strong>Důležité pro iPhone:</strong> i když mikrofon povolíte, <em>rozpoznávání řeči (diktát a hlasové
              příkazy)</em> na iOS Safari často nefunguje. Pro kontrolu inzerátu stačí <strong>text, odkaz nebo
              fotka</strong> — jádro aplikace funguje stejně.
            </div>
            <ol className="list-decimal list-inside space-y-2 text-slate-300 leading-relaxed">
              <li>
                Na Macu: nabídka <strong>Safari</strong> -&gt; <strong>Nastavení pro tento web...</strong> -&gt; Mikrofon
                → Povolit.
              </li>
              <li>
                Na iPhonu: <strong>Nastavení iOS</strong> -&gt; <strong>Safari</strong> -&gt; <strong>Mikrofon</strong>{' '}
                → Povolit (pro případné TTS / pokus o hlas).
              </li>
              <li>
                Pro fotoaparát: Nastavení -&gt; Safari -&gt; Fotoaparát → Povolit.
              </li>
            </ol>
          </>
        )}

        {activeTab === 'edge' && (
          <>
            <h4 className="font-bold text-[#00F5FF] flex items-center gap-1.5">
              <span>Microsoft Edge:</span>
            </h4>
            <ol className="list-decimal list-inside space-y-2 text-slate-300 leading-relaxed">
              <li>
                Klikněte na ikonu <strong>Zámku 🔒</strong> v adresním řádku.
              </li>
              <li>
                Vyberte <strong>"Oprávnění pro tento web"</strong>.
              </li>
              <li>
                U nabídky <strong>Mikrofon</strong> přepněte volbu na <strong>Povolit</strong>.
              </li>
            </ol>
          </>
        )}

        {activeTab === 'mobile' && (
          <>
            <h4 className="font-bold text-[#00F5FF] flex items-center gap-1.5">
              <span>Chytré telefony Android / iOS:</span>
            </h4>
            <ol className="list-decimal list-inside space-y-2 text-slate-300 leading-relaxed">
              <li>
                <strong>Android (Chrome):</strong> zámek 🔒 u adresy → Oprávnění → Mikrofon → Povolit. Hlasové příkazy
                fungují nejlíp zde.
              </li>
              <li>
                <strong>iPhone (Safari):</strong> Nastavení → Safari → Mikrofon / Fotoaparát. Diktát je omezený — pište
                nebo fotografie. Přidejte app na plochu: Sdílet → Přidat na plochu.
              </li>
              <li>
                Web musí běžet na <strong>HTTPS</strong> (např. shadowguard-shadvert.site).
              </li>
            </ol>
          </>
        )}
      </div>

      {/* Action button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={handleTestAndRequest}
          disabled={isChecking}
          className="w-full sm:w-auto px-6 py-3 rounded-2xl font-black bg-gradient-to-r from-[#B8860B] via-[#D4AF37] to-[#B8860B] text-black hover:brightness-110 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(184,134,11,0.4)] transition-all text-xs sm:text-sm cursor-pointer"
        >
          {isChecking ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
          <span>Povolit a vyzkoušet mikrofon znovu</span>
        </button>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-3 rounded-2xl font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm transition-all"
          >
            Zavřít návod
          </button>
        )}
      </div>

      {statusMessage && (
        <p className="mt-3 text-xs font-bold text-[#00F5FF] animate-in fade-in text-center sm:text-left">
          {statusMessage}
        </p>
      )}
    </div>
  );
};
