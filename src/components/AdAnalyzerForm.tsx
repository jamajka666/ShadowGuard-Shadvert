import React, { useState, useRef, useEffect } from 'react';
import { Clipboard, Link, FileText, Image, ShieldCheck, Sparkles, AlertCircle, X, Send, Mic, MicOff, ShieldAlert, CheckCircle2, Camera, RefreshCw } from 'lucide-react';
import { SAMPLE_SCENARIOS } from '../data/sampleScenarios';
import { PredefinedScenario, SSLDomainInfo, ThemeMode, AdCheckResult } from '../types';
import { checkPhishingUrl } from '../utils/phishingValidator';
import { SslDomainCard } from './SslDomainCard';
import { PermissionCheck } from './PermissionCheck';
import { ShadowGuardHeroBanner } from './ShadowGuardHeroBanner';
import { ScamAlertsSection } from './ScamAlertsSection';
import { UserSafetyScoreWidget } from './UserSafetyScoreWidget';
import { stopSpeech } from '../utils/tts';
import { checkMicDiagnostics } from '../utils/micPermissions';
import {
  createSpeechRecognizer,
  dedupeSpeechText,
  SpeechRecognizerHandle,
} from '../utils/speechRecognition';

interface AdAnalyzerFormProps {
  onAnalyze: (data: { url: string; rawText: string; imageBase64?: string; userNote: string }) => void;
  isLoading: boolean;
  fontSize: 'normal' | 'large' | 'xlarge';
  themeMode: ThemeMode;
  onOpenSendToSon: (customText?: string) => void;
  history?: AdCheckResult[];
}

export const AdAnalyzerForm: React.FC<AdAnalyzerFormProps> = ({
  onAnalyze,
  isLoading,
  fontSize,
  themeMode,
  onOpenSendToSon,
  history = [],
}) => {
  const [url, setUrl] = useState('');
  const [rawText, setRawText] = useState('');
  const [userNote, setUserNote] = useState('');
  const [imageBase64, setImageBase64] = useState<string | undefined>(undefined);
  const [imagePreviewName, setImagePreviewName] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState('');

  // Camera states & refs
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraTargetMode, setCameraTargetMode] = useState<'eshop' | 'ad'>('eshop');
  const [cameraError, setCameraError] = useState('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Voice recognition states & refs
  const [listeningField, setListeningField] = useState<'url' | 'rawText' | 'userNote' | null>(null);
  const [showPermissionCheck, setShowPermissionCheck] = useState(false);
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);
  const dictationRef = useRef<SpeechRecognizerHandle | null>(null);
  const initialTextRef = useRef<string>('');
  const listeningFieldRef = useRef<'url' | 'rawText' | 'userNote' | null>(null);

  useEffect(() => {
    checkMicDiagnostics().then((diag) => {
      if (diag.permissionState === 'denied') {
        setMicPermissionDenied(true);
      }
    });
  }, []);

  // SSL live check states
  const [liveSslInfo, setLiveSslInfo] = useState<SSLDomainInfo | undefined>(undefined);
  const [isCheckingSsl, setIsCheckingSsl] = useState(false);

  const handleCheckSslAndDomain = async () => {
    if (!url.trim()) {
      setErrorMsg('Vložte prosím nejprve URL adresu e-shopu.');
      return;
    }
    setErrorMsg('');
    setIsCheckingSsl(true);
    setLiveSslInfo(undefined);

    try {
      const response = await fetch('/api/check-domain-ssl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await response.json();
      if (data.sslDomainInfo) {
        setLiveSslInfo(data.sslDomainInfo);
      } else if (data.error) {
        setErrorMsg(data.error);
      }
    } catch (err) {
      console.error('SSL check error:', err);
      setErrorMsg('Nepodařilo se ověřit SSL certifikát a doménu.');
    } finally {
      setIsCheckingSsl(false);
    }
  };

  // Stop speech recognition and camera stream on unmount
  useEffect(() => {
    return () => {
      dictationRef.current?.abort();
      dictationRef.current = null;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startCamera = async (overrideFacing?: 'environment' | 'user') => {
    setCameraError('');
    setIsCameraOpen(true);
    const targetFacing = overrideFacing || facingMode;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: { facingMode: { ideal: targetFacing }, width: { ideal: 1280 }, height: { ideal: 720 } },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      // Fallback try simple video: true if environment fails
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = fallbackStream;
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          await videoRef.current.play().catch(() => {});
        }
      } catch (fallbackErr) {
        setCameraError('Nepodařilo se spustit fotoaparát. Zkontrolujte prosím povolená oprávnění kamery ve vašem prohlížeči.');
      }
    }
  };

  const toggleCameraFacing = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    startCamera(nextFacing);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setImageBase64(dataUrl);
        setImagePreviewName(
          cameraTargetMode === 'eshop' ? 'screenshot_eshopu.jpg' : 'fotka_inzeratu.jpg'
        );
        stopCamera();

        const note = userNote.trim()
          ? userNote.trim()
          : cameraTargetMode === 'eshop'
          ? 'Snímek obrazovky celého e-shopu pro zhodnocení grafické úpravy, IČO, certifikátů a důvěryhodnosti'
          : 'Fotka inzerátu pořízená fotoaparátem';

        // Automatically send to Gemini for analysis
        onAnalyze({
          url: url.trim(),
          rawText: rawText.trim(),
          imageBase64: dataUrl,
          userNote: note,
        });
      }
    }
  };

  const stopDictation = () => {
    dictationRef.current?.stop();
    dictationRef.current = null;
    listeningFieldRef.current = null;
    setListeningField(null);
  };

  const toggleSpeechRecognition = async (field: 'url' | 'rawText' | 'userNote') => {
    if (listeningField === field) {
      stopDictation();
      return;
    }

    stopSpeech();
    stopDictation();

    const currentVal = field === 'rawText' ? rawText : field === 'url' ? url : userNote;
    initialTextRef.current = currentVal ? currentVal.trim() : '';
    listeningFieldRef.current = field;

    const handle = createSpeechRecognizer({
      lang: 'cs-CZ',
      continuous: true,
      interimResults: true,
      preferFinal: false,
      autoRestart: true,
      restartDelayMs: 400,
      onStart: () => {
        setListeningField(field);
        setErrorMsg('');
      },
      onResult: ({ transcript }) => {
        const spoken = dedupeSpeechText(transcript);
        const base = initialTextRef.current ? initialTextRef.current + ' ' : '';
        const combined = dedupeSpeechText((base + spoken).replace(/\s+/g, ' '));
        const active = listeningFieldRef.current;
        if (active === 'rawText') {
          setRawText(combined);
        } else if (active === 'url') {
          setUrl(combined.replace(/\s+/g, '').toLowerCase());
        } else if (active === 'userNote') {
          setUserNote(combined);
        }
      },
      onError: (code, message) => {
        if (code === 'no-speech' || code === 'aborted') return;
        setErrorMsg(message);
        if (code === 'not-allowed' || code === 'service-not-allowed' || code === 'audio-capture' || code === 'insecure') {
          setShowPermissionCheck(true);
          setMicPermissionDenied(true);
          stopDictation();
        }
      },
      onEnd: () => {
        // autoRestart keeps going while desired; clear UI only when fully stopped
        if (!dictationRef.current?.isActive() && listeningFieldRef.current === null) {
          setListeningField(null);
        }
      },
    });

    dictationRef.current = handle;
    setListeningField(field);
    await handle.start();
  };

  // Handle clipboard paste button
  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          if (text.startsWith('http://') || text.startsWith('https://')) {
            setUrl(text.trim());
          } else {
            setRawText(text.trim());
          }
          setErrorMsg('');
        }
      }
    } catch (err) {
      console.warn('Clipboard read error:', err);
    }
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        setErrorMsg('Obrázek je příliš velký. Zvolte prosím soubor menší než 8 MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImageBase64(result);
        setImagePreviewName(file.name);
        setErrorMsg('');
      };
      reader.readAsDataURL(file);
    }
  };

  // Load predefined sample scenario
  const handleSelectScenario = (scenario: PredefinedScenario) => {
    setUrl(scenario.url);
    setRawText(scenario.textSnippet || '');
    setUserNote(`Ukázkový test: ${scenario.title}`);
    setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() && !rawText.trim() && !imageBase64) {
      setErrorMsg('Prosím vložte webový odkaz na inzerát, text zprávy nebo snímek obrazovky.');
      return;
    }
    setErrorMsg('');
    onAnalyze({
      url: url.trim(),
      rawText: rawText.trim(),
      imageBase64,
      userNote: userNote.trim(),
    });
  };

  const clearForm = () => {
    setUrl('');
    setRawText('');
    setUserNote('');
    setImageBase64(undefined);
    setImagePreviewName('');
    setErrorMsg('');
  };

  const textClasses = {
    normal: 'text-base',
    large: 'text-lg',
    xlarge: 'text-xl',
  }[fontSize];

  const isShadowGuard = themeMode === 'shadowguard';
  const isCyber = themeMode === 'cyberpunk';
  const isContrast = themeMode === 'highContrast';

  return (
    <div className="space-y-6">
      {/* Intro Hero Welcome Banner with 3D Shield Badge */}
      <ShadowGuardHeroBanner
        themeMode={themeMode}
        onOpenMicGuide={() => setShowPermissionCheck(true)}
      />

      {/* User Safety Score Weekly Widget */}
      <UserSafetyScoreWidget history={history} themeMode={themeMode} />

      <div
        className={`rounded-3xl p-6 sm:p-8 shadow-2xl border transition-all ${
          isShadowGuard
            ? 'bg-[#121214] border-[#CD7F32]/50 text-slate-100 shadow-[0_0_35px_rgba(212,160,23,0.2)] shadowguard-bronze-border'
            : isCyber
            ? 'bg-slate-950 border-cyan-500/30 text-slate-100 shadow-[0_0_30px_rgba(6,182,212,0.15)]'
            : isContrast
            ? 'bg-black border-yellow-400 text-white'
            : 'bg-[#121214] border-[#B8860B]/60 text-slate-100 shadowguard-bronze-border'
        }`}
      >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-black flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-emerald-400" />
            Zadejte inzerát k prověření
          </h2>
          <p className="text-sm mt-1 text-slate-400">
            Zkopírujte webový odkaz (URL), vložte text zprávy z WhatsAppu / SMS, nebo nahrajte fotku obrazovky.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowPermissionCheck(!showPermissionCheck)}
            title="Jak povolit mikrofon v prohlížeči (Chrome/Safari/Edge)"
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-bold border text-xs sm:text-sm transition-all ${
              micPermissionDenied || showPermissionCheck
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-[#1C1C1E] text-slate-300 border-slate-800 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Návod mikrofon 🔒</span>
          </button>

          <button
            type="button"
            onClick={() => toggleSpeechRecognition('rawText')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold shadow-sm transition-all border text-xs sm:text-sm ${
              listeningField === 'rawText'
                ? 'bg-rose-600 text-white border-rose-400 animate-pulse ring-2 ring-rose-400'
                : isCyber
                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40 hover:bg-cyan-500/30'
                : isContrast
                ? 'bg-yellow-400 text-black border-yellow-500 hover:bg-yellow-300'
                : 'bg-[#1C1C1E] text-[#F5D061] border-[#CD7F32]/50 hover:bg-[#D4A017]/20'
            }`}
          >
            {listeningField === 'rawText' ? (
              <>
                <MicOff className="w-4 h-4 animate-spin text-white" />
                <span>Poslouchám... (Zastavit)</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 text-emerald-400" />
                <span>Diktovat hlasem</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handlePasteClipboard}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold shadow-sm transition-all border text-xs sm:text-sm ${
              isCyber
                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40 hover:bg-cyan-500/30'
                : isContrast
                ? 'bg-yellow-400 text-black border-yellow-500 hover:bg-yellow-300'
                : 'bg-[#1C1C1E] text-[#00F5FF] border-[#00F5FF]/40 hover:bg-cyan-950/40'
            }`}
          >
            <Clipboard className="w-5 h-5" />
            <span>Vložit ze schránky</span>
          </button>
        </div>
      </div>

      {/* PermissionCheck Component shown if requested or when mic is denied */}
      {(showPermissionCheck || micPermissionDenied) && (
        <PermissionCheck
          themeMode={themeMode}
          className="mb-6 animate-in fade-in"
          onClose={() => setShowPermissionCheck(false)}
          onPermissionGranted={() => {
            setShowPermissionCheck(false);
            setMicPermissionDenied(false);
            setErrorMsg('');
          }}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* URL Input */}
        <div>
          <label className={`block font-bold mb-2 flex items-center justify-between ${textClasses}`}>
            <span className="flex items-center gap-2">
              <Link className="w-5 h-5 text-emerald-400" />
              1. Webový odkaz na inzerát (URL adresa)
            </span>
            <span className="text-xs text-slate-400 font-normal">(např. https://www.bazos.cz/...)</span>
          </label>
          <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="Vložte sem odkaz na inzerát (např. https://...)"
                className={`w-full px-4 py-3.5 rounded-2xl border-2 transition-all font-mono text-sm sm:text-base ${
                  listeningField === 'url'
                    ? 'border-rose-500 ring-2 ring-rose-500/30 bg-rose-950/20'
                    : isCyber
                    ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20'
                    : isContrast
                    ? 'bg-slate-900 border-yellow-400 text-white placeholder-slate-400 focus:ring-2 focus:ring-yellow-400'
                    : 'bg-[#1C1C1E] border-[#B8860B]/50 text-white placeholder-slate-500 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30'
                }`}
              />
              {url && (
                <button
                  type="button"
                  onClick={() => setUrl('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => toggleSpeechRecognition('url')}
              title={listeningField === 'url' ? 'Zastavit diktování URL' : 'Diktovat webovou adresu'}
              className={`p-3.5 rounded-2xl border-2 transition-all shrink-0 flex items-center justify-center ${
                listeningField === 'url'
                  ? 'bg-rose-600 text-white border-rose-400 animate-pulse ring-2 ring-rose-400'
                  : isCyber
                  ? 'bg-slate-900 border-slate-700 text-cyan-400 hover:border-cyan-400'
                  : isContrast
                  ? 'bg-slate-900 border-yellow-400 text-yellow-400 hover:bg-slate-800'
                  : 'bg-[#1A1A1A] border-[#B8860B]/50 text-[#00F5FF] hover:bg-[#222222]'
              }`}
            >
              {listeningField === 'url' ? <MicOff className="w-5 h-5 animate-spin" /> : <Mic className="w-5 h-5 text-emerald-400" />}
            </button>

            <button
              type="button"
              onClick={handleCheckSslAndDomain}
              disabled={isCheckingSsl || !url.trim()}
              title="Okamžitě zkontrolovat SSL certifikát a stáří domény"
              className={`px-3.5 py-3.5 rounded-2xl font-black border-2 transition-all shrink-0 flex items-center gap-2 text-xs sm:text-sm ${
                isCheckingSsl
                  ? 'bg-amber-600 text-white border-amber-400 opacity-80'
                  : isCyber
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/30'
                  : isContrast
                  ? 'bg-yellow-400 text-black border-yellow-500'
                  : 'bg-gradient-to-r from-[#B8860B] to-[#D4AF37] text-black font-black border-[#D4AF37] hover:brightness-110'
              }`}
            >
              <ShieldCheck className={`w-4 h-4 ${isCheckingSsl ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isCheckingSsl ? 'Zjišťuji SSL...' : 'Prověřit SSL & Doménu'}</span>
              <span className="sm:hidden">{isCheckingSsl ? '...' : 'SSL'}</span>
            </button>
          </div>
          {listeningField === 'url' && (
            <p className="mt-1.5 text-xs font-bold text-rose-400 flex items-center gap-1.5 animate-pulse">
              <Mic className="w-3.5 h-3.5" />
              <span>Diktujte webovou adresu česky (např. bazoš tečka cz)...</span>
            </p>
          )}

          {/* Live SSL & Domain Card Preview inside Form */}
          {liveSslInfo && (
            <div className="mt-4">
              <SslDomainCard
                info={liveSslInfo}
                uiMode={isCyber ? 'cyber' : isContrast ? 'contrast' : 'senior'}
                fontSize={fontSize}
              />
            </div>
          )}

          {/* Real-time URL Phishing Validator Status Banner */}
          {url.trim().length > 3 && (() => {
            const liveCheck = checkPhishingUrl(url);
            if (liveCheck.isPhishing) {
              return (
                <div className="mt-2.5 p-3 rounded-xl bg-rose-950/80 border-2 border-rose-500 text-rose-200 text-xs flex items-start gap-2.5 shadow-lg animate-bounce-short">
                  <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-black block text-rose-300 text-xs sm:text-sm">
                      🚨 VALIDÁTOR URL: DETEKOVÁN ZNÁMÝ PHISHING!
                    </span>
                    <span className="block mt-0.5 leading-relaxed">
                      {liveCheck.reason} Tento odkaz bude okamžitě zablokován a nebude odeslán k Gemini API.
                    </span>
                  </div>
                </div>
              );
            } else if (liveCheck.domainName) {
              return (
                <div className="mt-2 p-2 px-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Validátor URL: Doména <strong>{liveCheck.domainName}</strong> zkontrolována — nejedná se o známou phishingovou doménu.
                  </span>
                </div>
              );
            }
            return null;
          })()}
        </div>

        {/* Text Input */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className={`font-bold flex items-center gap-2 ${textClasses}`}>
              <FileText className="w-5 h-5 text-emerald-400" />
              <span>2. Text zprávy nebo popis inzerátu (volitelné)</span>
            </label>

            <button
              type="button"
              onClick={() => toggleSpeechRecognition('rawText')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border transition-all ${
                listeningField === 'rawText'
                  ? 'bg-rose-600 text-white border-rose-400 animate-pulse'
                  : isCyber
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30'
                  : 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
              }`}
            >
              {listeningField === 'rawText' ? (
                <>
                  <MicOff className="w-3.5 h-3.5" />
                  <span>Zastavit nahrávání</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Diktovat text zprávy</span>
                </>
              )}
            </button>
          </div>

          <div className="relative">
            <textarea
              value={rawText}
              onChange={(e) => {
                setRawText(e.target.value);
                setErrorMsg('');
              }}
              rows={3}
              placeholder="Zkopírujte sem text zprávy od kupujícího/prodávajícího nebo jej nadiktejte mikrofónem..."
              className={`w-full px-4 py-3 rounded-2xl border-2 transition-all ${textClasses} ${
                listeningField === 'rawText'
                  ? 'border-rose-500 ring-2 ring-rose-500/30 bg-rose-950/20'
                  : isCyber
                  ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-cyan-400'
                  : isContrast
                  ? 'bg-slate-900 border-yellow-400 text-white placeholder-slate-400'
                  : 'bg-[#1C1C1E] border-[#B8860B]/50 text-white placeholder-slate-500 focus:border-[#D4AF37]'
              }`}
            />
            {listeningField === 'rawText' && (
              <div className="absolute top-3 right-3 flex items-center gap-2 bg-rose-600 text-white text-xs px-2.5 py-1 rounded-full font-bold animate-pulse shadow-md">
                <Mic className="w-3.5 h-3.5" />
                <span>Nahrávám hlas... Hovořte česky</span>
              </div>
            )}
          </div>
        </div>

        {/* Image Attachment & Reset */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={`block font-bold mb-2 flex items-center gap-2 ${textClasses}`}>
              <Image className="w-5 h-5 text-emerald-400" />
              3. Snímek obrazovky e-shopu / Fotka (volitelné)
            </label>
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              {/* Camera Photo Capture Button - Eshop Screen */}
              <button
                type="button"
                onClick={() => {
                  setCameraTargetMode('eshop');
                  startCamera();
                }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold border text-xs sm:text-sm transition-all shadow-sm ${
                  isCyber
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 hover:bg-cyan-500/30'
                    : isContrast
                    ? 'bg-yellow-400 text-black border-yellow-500 font-black'
                    : 'bg-[#B8860B] hover:bg-[#D4AF37] text-black border-[#D4AF37] font-black'
                }`}
              >
                <Camera className="w-4 h-4 text-black animate-pulse shrink-0" />
                <span>Vyfotit e-shop 🖥️</span>
              </button>

              {/* Camera Photo Capture Button - Classified Ad */}
              <button
                type="button"
                onClick={() => {
                  setCameraTargetMode('ad');
                  startCamera();
                }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold border text-xs sm:text-sm transition-all shadow-sm ${
                  isCyber
                    ? 'bg-slate-900 text-slate-200 border-slate-700 hover:border-cyan-500'
                    : isContrast
                    ? 'bg-slate-800 text-white border-yellow-400 font-bold'
                    : 'bg-[#1C1C1E] text-slate-200 border-[#B8860B]/40 hover:border-[#00F5FF]'
                }`}
              >
                <Camera className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Vyfotit inzerát 📄</span>
              </button>

              <label
                className={`cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold border text-xs sm:text-sm transition-all ${
                  isCyber
                    ? 'bg-slate-900 border-slate-700 text-slate-200 hover:border-cyan-400'
                    : isContrast
                    ? 'bg-slate-800 border-yellow-400 text-white'
                    : 'bg-[#1C1C1E] border-[#B8860B]/40 text-slate-200 hover:border-[#00F5FF]'
                }`}
              >
                <Image className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Vybrat z galerie</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>

              {imagePreviewName && (
                <div className="flex items-center gap-2 text-xs bg-emerald-950 border border-emerald-500/40 text-emerald-200 px-3 py-2 rounded-xl font-medium">
                  <span className="truncate max-w-[150px]">{imagePreviewName}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setImageBase64(undefined);
                      setImagePreviewName('');
                    }}
                    className="text-emerald-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-end justify-between sm:justify-end gap-2">
            {(url || rawText) && (
              <button
                type="button"
                onClick={() =>
                  onOpenSendToSon(`Ahoj synu, mohl bys mi prověřit tento inzerát?\n${url || rawText}`)
                }
                className="text-cyan-400 hover:text-cyan-300 text-xs sm:text-sm font-bold flex items-center gap-1.5 underline"
              >
                <Send className="w-4 h-4" />
                <span>Poslat rovnou synovi</span>
              </button>
            )}

            {(url || rawText || imageBase64) && (
              <button
                type="button"
                onClick={clearForm}
                className="text-slate-400 hover:text-white text-xs sm:text-sm font-semibold underline"
              >
                Vymazat formulář
              </button>
            )}
          </div>
        </div>

        {/* Live Camera View Modal */}
        {isCameraOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
            <div
              className={`w-full max-w-xl rounded-3xl p-6 border-2 shadow-2xl relative flex flex-col items-center transition-all ${
                isCyber
                  ? 'bg-slate-950 border-cyan-400 text-white shadow-[0_0_50px_rgba(6,182,212,0.3)]'
                  : isContrast
                  ? 'bg-black border-yellow-400 text-white'
                  : 'bg-slate-900 border-slate-700 text-white'
              }`}
            >
              <button
                type="button"
                onClick={stopCamera}
                className="absolute right-4 top-4 text-slate-400 hover:text-white p-2 rounded-xl"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex flex-col gap-1 mb-4 self-start">
                <div className="flex items-center gap-2">
                  <Camera className="w-6 h-6 text-emerald-400 animate-pulse" />
                  <h3 className="text-lg sm:text-xl font-black">
                    {cameraTargetMode === 'eshop'
                      ? 'Vyfotit obrazovku / e-shop 🖥️'
                      : 'Vyfotit inzerát / papír 📄'}
                  </h3>
                </div>
                <p className="text-xs text-slate-400">
                  {cameraTargetMode === 'eshop'
                    ? 'Nasměrujte fotoaparát na monitor, tablet nebo mobil s e-shopem pro posouzení grafického vzhledu a IČO.'
                    : 'Nasměrujte fotoaparát na text inzerátu nebo cenovku.'}
                </p>
              </div>

              {/* Target Mode Switcher */}
              <div className="w-full grid grid-cols-2 gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setCameraTargetMode('eshop')}
                  className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all border ${
                    cameraTargetMode === 'eshop'
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <span>🖥️ Snímek celého e-shopu</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCameraTargetMode('ad')}
                  className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all border ${
                    cameraTargetMode === 'ad'
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <span>📄 Text inzerátu / papír</span>
                </button>
              </div>

              {cameraError ? (
                <div className="w-full p-4 rounded-2xl bg-rose-950/80 border border-rose-500 text-rose-200 text-xs sm:text-sm my-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{cameraError}</span>
                </div>
              ) : (
                <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border-2 border-slate-700 my-1">
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Framing grid target indicator */}
                  <div
                    className={`absolute inset-6 sm:inset-8 border-2 border-dashed rounded-xl pointer-events-none flex flex-col items-center justify-between p-3 ${
                      cameraTargetMode === 'eshop'
                        ? 'border-cyan-400/80 bg-cyan-950/10'
                        : 'border-emerald-400/80 bg-emerald-950/10'
                    }`}
                  >
                    <span className="text-[10px] sm:text-xs text-white font-black bg-black/70 px-2.5 py-1 rounded-lg border border-slate-700">
                      {cameraTargetMode === 'eshop'
                        ? '🖥️ ZAMĚŘTE MONITOR NEBO HLAVIČKU E-SHOPU'
                        : '📄 ZAMĚŘTE TEXT INZERÁTU / CENOVKU'}
                    </span>
                    <span className="text-[10px] text-slate-300 font-mono bg-black/60 px-2 py-0.5 rounded">
                      {cameraTargetMode === 'eshop'
                        ? 'Gemini vyhodnotí certifikáty, IČO v patičce a vzhled'
                        : 'Gemini zkontroluje podezřelé fráze a ceny'}
                    </span>
                  </div>
                </div>
              )}

              {/* Hidden Canvas for Base64 capture */}
              <canvas ref={canvasRef} className="hidden" />

              <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
                <button
                  type="button"
                  onClick={toggleCameraFacing}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Otočit kameru</span>
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs sm:text-sm"
                  >
                    Zrušit
                  </button>

                  <button
                    type="button"
                    onClick={capturePhoto}
                    disabled={!!cameraError}
                    className={`px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 shadow-xl transition-all ${
                      isCyber
                        ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 hover:brightness-110 shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                        : isContrast
                        ? 'bg-yellow-400 text-black font-black'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    } ${cameraError ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Camera className="w-5 h-5" />
                    <span>
                      {cameraTargetMode === 'eshop'
                        ? 'VYFOTIT E-SHOP A PROVĚŘIT 🖥️'
                        : 'VYFOTIT A PROVĚŘIT V GEMINI 🚀'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-950/60 border-2 border-rose-500 text-rose-200 flex items-center gap-3 font-semibold text-sm">
            <AlertCircle className="w-6 h-6 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Primary Action Button */}
        <div>
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 px-6 rounded-2xl font-black text-lg sm:text-xl shadow-2xl transition-all flex items-center justify-center gap-3 ${
              isCyber
                ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 hover:brightness-110 shadow-[0_0_25px_rgba(16,185,129,0.5)] cyber-button-emerald'
                : isContrast
                ? 'bg-yellow-400 text-black hover:bg-yellow-300'
                : 'bg-gradient-to-r from-[#B8860B] via-[#D4AF37] to-[#B8860B] text-black hover:brightness-110 shadow-[0_0_20px_rgba(184,134,11,0.4)]'
            } ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            <ShieldCheck className="w-7 h-7 stroke-[2.5]" />
            <span>{isLoading ? 'Prověřuji inzerát v AI síti...' : 'PROVĚŘIT DŮVĚRYHODNOST INZERÁTU'}</span>
          </button>
        </div>
      </form>

      {/* Predefined Scenarios / Quick Test Chips */}
      <div className="mt-8 pt-6 border-t border-slate-800">
        <p className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          Vyzkoušejte ukázkové inzeráty (1 kliknutí):
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {SAMPLE_SCENARIOS.map((sc) => (
            <button
              key={sc.id}
              type="button"
              onClick={() => handleSelectScenario(sc)}
              className={`text-left p-3 rounded-xl border text-xs sm:text-sm transition-all duration-200 flex flex-col justify-between ${
                isCyber
                  ? 'bg-slate-900/80 border-slate-800 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(6,182,212,0.35)] hover:-translate-y-0.5 text-slate-200'
                  : isContrast
                  ? 'bg-slate-900 border-slate-700 hover:border-yellow-400 text-slate-200'
                  : 'bg-[#1C1C1E] hover:bg-[#252528] border-[#B8860B]/40 hover:border-[#00F5FF] text-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-bold text-white truncate">
                    {sc.title}
                  </span>
                  <span
                    className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                      sc.badge === 'PODVOD'
                        ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                        : sc.badge === 'OPATRNOSTI'
                        ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    {sc.badge}
                  </span>
                </div>
                <p className="text-slate-400 text-xs line-clamp-1">{sc.subtitle}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>

    {/* Aktuální varování před podvody v ČR (Google Search Grounding) */}
    <ScamAlertsSection themeMode={themeMode} fontSize={fontSize} />
    </div>
  );
};
