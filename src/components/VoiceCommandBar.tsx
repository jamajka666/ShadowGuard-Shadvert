import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  HelpCircle,
  X,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Settings,
  Info,
  RefreshCw,
} from 'lucide-react';
import { parseAndExecuteVoiceCommand, VoiceCommandHandlers, MatchedCommandResult } from '../utils/voiceCommands';
import { ThemeMode } from '../types';
import { stopSpeech } from '../utils/tts';
import {
  checkMicDiagnostics,
  requestMicrophoneAccess,
  MicDiagnostics,
  MIC_TROUBLESHOOTING_GUIDE,
} from '../utils/micPermissions';
import {
  createSpeechRecognizer,
  isSpeechSupported,
  isSecureMicContext,
  dedupeSpeechText,
  SpeechRecognizerHandle,
} from '../utils/speechRecognition';
import { playMicStartBeep, playMicStopBeep } from '../utils/audioBeep';

interface VoiceCommandBarProps {
  handlers: VoiceCommandHandlers;
  themeMode: ThemeMode;
}

export const VoiceCommandBar: React.FC<VoiceCommandBarProps> = ({ handlers, themeMode }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastCommand, setLastCommand] = useState<MatchedCommandResult | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagnostics, setDiagnostics] = useState<MicDiagnostics | null>(null);
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [micStatusMsg, setMicStatusMsg] = useState<string | null>(null);

  const recognizerRef = useRef<SpeechRecognizerHandle | null>(null);
  const silenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFinalRef = useRef('');
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const isShadowGuard = themeMode === 'shadowguard';
  const isCyber = themeMode === 'cyberpunk';
  const isContrast = themeMode === 'highContrast';

  const refreshDiagnostics = async () => {
    const diag = await checkMicDiagnostics();
    setDiagnostics(diag);
    return diag;
  };

  useEffect(() => {
    refreshDiagnostics();
  }, []);

  useEffect(() => {
    return () => {
      stopSpeech();
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      recognizerRef.current?.abort();
      recognizerRef.current = null;
    };
  }, []);

  const handleTestMicrophone = async () => {
    setIsTestingMic(true);
    setMicStatusMsg('Testování přístupu k mikrofonu...');
    const res = await requestMicrophoneAccess();
    setIsTestingMic(false);
    if (res.success) {
      setMicStatusMsg('✅ Mikrofon funguje správně a oprávnění bylo uděleno!');
    } else {
      setMicStatusMsg(`❌ ${res.message}`);
    }
    await refreshDiagnostics();
  };

  const processCommand = (text: string) => {
    const cleaned = dedupeSpeechText(text);
    if (!cleaned || cleaned === lastFinalRef.current) return;
    lastFinalRef.current = cleaned;
    const result = parseAndExecuteVoiceCommand(cleaned, handlersRef.current);
    if (result) {
      setLastCommand(result);
      setTimeout(() => setLastCommand(null), 4000);
    }
  };

  const ensureRecognizer = () => {
    if (recognizerRef.current) return recognizerRef.current;

    const handle = createSpeechRecognizer({
      lang: 'cs-CZ',
      continuous: false,
      interimResults: true,
      preferFinal: true,
      autoRestart: true,
      restartDelayMs: 550,
      onStart: () => {
        setIsListening(true);
        setTranscript('Poslouchám... Řekněte příkaz.');
        setMicStatusMsg(null);
        playMicStartBeep();
      },
      onResult: ({ transcript: t, final, isFinal }) => {
        const display = dedupeSpeechText(t || final);
        setTranscript(display || 'Poslouchám...');
        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        if (isFinal && final) {
          processCommand(final);
        } else if (display) {
          // Debounce interim → only fire if no final arrives soon
          silenceTimeoutRef.current = setTimeout(() => {
            if (display.length > 2) processCommand(display);
          }, 900);
        }
      },
      onError: (code, message) => {
        if (code === 'no-speech' || code === 'aborted') return;
        setTranscript(code === 'network' ? 'Chyba sítě.' : 'Chyba mikrofonu.');
        setMicStatusMsg(message);
        if (code === 'not-allowed' || code === 'service-not-allowed' || code === 'audio-capture' || code === 'insecure') {
          setIsListening(false);
          setShowDiagnostics(true);
        }
        refreshDiagnostics();
      },
      onEnd: () => {
        // autoRestart keeps listening if desired; UI stays "listening" until user stops
        if (!recognizerRef.current?.isActive()) {
          // brief flicker ok; autoRestart will flip back
        }
      },
    });

    recognizerRef.current = handle;
    return handle;
  };

  const startListening = async () => {
    stopSpeech();
    lastFinalRef.current = '';

    const currentDiag = await refreshDiagnostics();
    if (!currentDiag.isSecureContext && !isSecureMicContext()) {
      setMicStatusMsg('Nezabezpečené spojení: Web Speech API vyžaduje HTTPS (nebo localhost).');
      setShowDiagnostics(true);
      setIsListening(false);
      return;
    }
    if (!isSpeechSupported() || !currentDiag.hasSpeechRecognitionSupport) {
      setMicStatusMsg('Prohlížeč nepodporuje Web Speech API. Použijte Google Chrome nebo Microsoft Edge.');
      setShowDiagnostics(true);
      setIsListening(false);
      return;
    }

    const rec = ensureRecognizer();
    await rec.start();
    setIsListening(true);
  };

  const stopListening = () => {
    playMicStopBeep();
    stopSpeech();
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    recognizerRef.current?.stop();
    setIsListening(false);
    setTranscript('');
    lastFinalRef.current = '';
  };

  const toggleListening = () => {
    if (isListening || recognizerRef.current?.isActive()) {
      stopListening();
    } else {
      void startListening();
    }
  };

  const isDenied = diagnostics?.permissionState === 'denied';
  const isInsecure = diagnostics && !diagnostics.isSecureContext;

  return (
    <>
      <div
        className={`w-full border-b transition-all ${
          isListening
            ? isShadowGuard
              ? 'bg-[#121214] border-[#D4A017] text-[#F5D061] shadow-[0_0_25px_rgba(212,160,23,0.35)]'
              : isCyber
              ? 'bg-slate-900/95 border-cyan-400 text-cyan-200 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
              : isContrast
              ? 'bg-yellow-400 text-black border-black font-bold'
              : 'bg-emerald-700 text-white border-emerald-600'
            : isShadowGuard
            ? 'bg-[#121214] border-[#CD7F32]/40 text-slate-200'
            : isCyber
            ? 'bg-slate-950/80 border-cyan-500/20 text-slate-300'
            : isContrast
            ? 'bg-slate-900 text-yellow-300 border-yellow-500'
            : 'bg-slate-800 text-slate-200 border-slate-700'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleListening}
              type="button"
              className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md ${
                isListening
                  ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                  : isDenied || isInsecure
                  ? 'bg-amber-600/30 text-amber-300 border border-amber-500/50 hover:bg-amber-600/50'
                  : isShadowGuard
                  ? 'bg-[#1C1C1E] text-[#F5D061] border border-[#CD7F32]/50 hover:bg-[#D4A017]/20 shadow-[0_0_10px_rgba(212,160,23,0.2)]'
                  : isCyber
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30'
                  : isContrast
                  ? 'bg-black text-yellow-400 hover:bg-slate-900'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4" />
                  <span>Vypnout hlasové příkazy</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 text-[#00F5FF]" />
                  <span>Zapnout hlasové příkazy 🎤</span>
                </>
              )}
            </button>

            {isListening ? (
              <span className="flex items-center gap-2 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00F5FF] animate-ping inline-block" />
                <span className="truncate max-w-[200px] sm:max-w-xs">
                  {transcript || 'Řekněte např. "přejdi na historii"'}
                </span>
              </span>
            ) : isDenied ? (
              <span className="flex items-center gap-1.5 text-rose-400 font-bold text-xs bg-rose-950/60 px-2.5 py-1 rounded-lg border border-rose-500/40">
                <ShieldAlert className="w-4 h-4" />
                <span>Mikrofon zablokován</span>
              </span>
            ) : (
              <span className="hidden md:inline-block opacity-80 font-medium">
                Aplikaci můžete kompletně ovládat hlasem v češtině (Chrome + HTTPS).
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {lastCommand && (
              <div
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                  lastCommand.success
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                {lastCommand.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                <span>{lastCommand.actionName}</span>
              </div>
            )}

            <button
              onClick={() => setShowDiagnostics(true)}
              type="button"
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                isDenied || isInsecure
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
              title="Diagnostika mikrofonu"
            >
              <Settings className="w-4 h-4 text-[#00F5FF]" />
              <span>Stav mikrofonu</span>
            </button>

            <button
              onClick={() => setShowGuide(true)}
              type="button"
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 opacity-90 hover:opacity-100 hover:underline transition-all"
            >
              <HelpCircle className="w-4 h-4 text-cyan-400 inline" />
              <span>Přehled příkazů</span>
            </button>
          </div>
        </div>
      </div>

      {showDiagnostics && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl p-6 sm:p-8 bg-[#121214] border-2 border-[#B8860B]/80 text-white shadow-[0_0_50px_rgba(184,134,11,0.3)] relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowDiagnostics(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white p-2 rounded-xl transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-[#1C1C1E] text-[#00F5FF] border border-[#00F5FF]/40">
                <Settings className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Diagnostika mikrofonu</h2>
                <p className="text-xs text-slate-400">Android / Linux / Chrome — HTTPS je povinné</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="p-3 rounded-2xl bg-[#1C1C1E] border border-slate-800 flex items-center justify-between text-xs sm:text-sm">
                <span className="flex items-center gap-2 font-medium">
                  <Info className="w-4 h-4 text-cyan-400" />
                  Zabezpečení (HTTPS)
                </span>
                <span
                  className={`font-bold px-2.5 py-0.5 rounded-full text-xs ${
                    diagnostics?.isSecureContext
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                      : 'bg-rose-950 text-rose-400 border border-rose-500/40'
                  }`}
                >
                  {diagnostics?.isSecureContext ? '✅ HTTPS / localhost' : '❌ Nezabezpečeno'}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[#1C1C1E] border border-slate-800 flex items-center justify-between text-xs sm:text-sm">
                <span className="flex items-center gap-2 font-medium">
                  <Mic className="w-4 h-4 text-emerald-400" />
                  Oprávnění mikrofonu
                </span>
                <span
                  className={`font-bold px-2.5 py-0.5 rounded-full text-xs ${
                    diagnostics?.permissionState === 'granted'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                      : diagnostics?.permissionState === 'denied'
                      ? 'bg-rose-950 text-rose-400 border border-rose-500/40'
                      : 'bg-amber-950 text-amber-400 border border-amber-500/40'
                  }`}
                >
                  {diagnostics?.permissionState === 'granted'
                    ? '✅ Povoleno'
                    : diagnostics?.permissionState === 'denied'
                    ? '🛑 Zablokováno'
                    : '⚠️ Vyžaduje potvrzení'}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[#1C1C1E] border border-slate-800 flex items-center justify-between text-xs sm:text-sm">
                <span className="flex items-center gap-2 font-medium">
                  <Volume2 className="w-4 h-4 text-purple-400" />
                  Web Speech API
                </span>
                <span
                  className={`font-bold px-2.5 py-0.5 rounded-full text-xs ${
                    diagnostics?.hasSpeechRecognitionSupport
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                      : 'bg-rose-950 text-rose-400 border border-rose-500/40'
                  }`}
                >
                  {diagnostics?.hasSpeechRecognitionSupport ? '✅ Podporováno' : '❌ Nepodporováno'}
                </span>
              </div>
            </div>

            <div className="mb-6 p-4 rounded-2xl bg-slate-900 border border-[#B8860B]/40 text-center">
              <button
                onClick={handleTestMicrophone}
                disabled={isTestingMic}
                className="w-full py-3 px-4 rounded-xl font-black bg-gradient-to-r from-[#B8860B] to-[#D4AF37] text-black hover:brightness-110 flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                {isTestingMic ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Mic className="w-5 h-5" />}
                <span>Testovat a požádat o mikrofon</span>
              </button>
              {micStatusMsg && (
                <p className="mt-3 text-xs font-bold text-[#00F5FF]">{micStatusMsg}</p>
              )}
            </div>

            <div className="space-y-4 max-h-[35vh] overflow-y-auto pr-1 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#1C1C1E] border border-slate-800">
                <h4 className="font-bold text-amber-400 mb-2 text-sm">📱 Android (Chrome):</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  {MIC_TROUBLESHOOTING_GUIDE.android.map((step, idx) => (
                    <li key={`and-${idx}`}>{step}</li>
                  ))}
                </ul>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#1C1C1E] border border-slate-800">
                <h4 className="font-bold text-cyan-400 mb-2 text-sm">🐧 Linux & Desktop:</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  {MIC_TROUBLESHOOTING_GUIDE.linux.map((step, idx) => (
                    <li key={`lin-${idx}`}>{step}</li>
                  ))}
                </ul>
              </div>
              {diagnostics?.isIframe && (
                <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200">
                  <p className="font-semibold">{MIC_TROUBLESHOOTING_GUIDE.iframeNotice}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowDiagnostics(false)}
              className="w-full mt-5 py-3 px-4 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 text-white text-sm transition-all"
            >
              Zavřít diagnostiku
            </button>
          </div>
        </div>
      )}

      {showGuide && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div
            className={`w-full max-w-lg rounded-3xl p-6 sm:p-8 border-2 shadow-2xl relative transition-all max-h-[90vh] overflow-y-auto ${
              isShadowGuard
                ? 'bg-[#121214] border-[#D4A017]/80 text-white'
                : isCyber
                ? 'bg-slate-950 border-cyan-500/80 text-white'
                : isContrast
                ? 'bg-black border-yellow-400 text-white'
                : 'bg-[#121214] border-[#B8860B]/80 text-slate-100'
            }`}
          >
            <button
              onClick={() => setShowGuide(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white p-2 rounded-xl"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-[#1C1C1E] text-[#F5D061] border border-[#CD7F32]/50">
                <Mic className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black">Hlasové příkazy</h2>
                <p className="text-xs sm:text-sm text-slate-400">Řekněte nahlas v češtině (Chrome):</p>
              </div>
            </div>
            <div className="space-y-4 text-xs sm:text-sm">
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                <span className="font-bold text-emerald-400 block">🧭 Navigace:</span>
                <p>• <strong>"historie"</strong> · <strong>"kvíz"</strong> · <strong>"průvodce"</strong> · <strong>"kontrola"</strong> / <strong>"domů"</strong></p>
                <p>• <strong>"varování"</strong> — aktuální podvody</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                <span className="font-bold text-cyan-400 block">📋 Okna:</span>
                <p>• <strong>"desatero"</strong> · <strong>"poslat synovi"</strong> · <strong>"nainstalovat"</strong> · <strong>"zavřít"</strong></p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                <span className="font-bold text-amber-400 block">🔊 Čtení:</span>
                <p>• <strong>"přečti výsledek"</strong> · <strong>"přečti poslední inzerát"</strong> · <strong>"zastavit"</strong> / <strong>"ticho"</strong></p>
              </div>
            </div>
            <button
              onClick={() => setShowGuide(false)}
              className="w-full mt-6 py-3 px-4 rounded-2xl font-bold bg-slate-800 hover:bg-slate-700 text-white text-sm"
            >
              Rozumím, vyzkoušet
            </button>
          </div>
        </div>
      )}

      {isListening && (
        <div className="fixed bottom-6 right-6 z-50">
          <div
            className={`p-3.5 sm:p-4 rounded-2xl border-2 shadow-2xl flex items-center gap-3.5 backdrop-blur-md ${
              isShadowGuard
                ? 'bg-[#121214]/95 border-[#00F5FF] text-white shadow-[0_0_30px_rgba(0,245,255,0.4)]'
                : isCyber
                ? 'bg-slate-950/95 border-cyan-400 text-cyan-200'
                : isContrast
                ? 'bg-yellow-400 text-black border-4 border-black font-bold'
                : 'bg-emerald-950/95 border-emerald-400 text-white'
            }`}
          >
            <div className="relative flex items-center justify-center shrink-0">
              <span className="absolute w-10 h-10 rounded-full bg-rose-500/40 animate-ping" />
              <div className="relative p-2.5 rounded-xl bg-rose-600 text-white shadow-lg">
                <Mic className="w-5 h-5 animate-pulse" />
              </div>
            </div>
            <div className="space-y-0.5 pr-1 max-w-[220px] sm:max-w-[280px]">
              <div className="flex items-center gap-1.5 text-xs font-black tracking-wide uppercase">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
                <span className={isContrast ? 'text-black' : 'text-rose-400'}>MŮŽETE MLUVIT 🎤</span>
              </div>
              <p className="text-xs font-medium truncate opacity-90">{transcript || 'Poslouchám váš příkaz...'}</p>
            </div>
            <button
              onClick={stopListening}
              type="button"
              className={`p-2 rounded-xl shrink-0 ${isContrast ? 'bg-black text-yellow-400' : 'bg-rose-600/80 hover:bg-rose-600 text-white'}`}
              title="Vypnout"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
