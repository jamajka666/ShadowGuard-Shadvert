import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { AdAnalyzerForm } from './components/AdAnalyzerForm';
import { ScanningAnimation } from './components/ScanningAnimation';
import { ResultDisplay } from './components/ResultDisplay';
import { SeniorGuide } from './components/SeniorGuide';
import { ScamQuiz } from './components/ScamQuiz';
import { HistoryList } from './components/HistoryList';
import { ScamAlertsSection } from './components/ScamAlertsSection';
import { CriteriaModal } from './components/CriteriaModal';
import { FatherPhoneGuideModal } from './components/FatherPhoneGuideModal';
import { SendToSonModal } from './components/SendToSonModal';
import { InstallPwaModal } from './components/InstallPwaModal';
import { VoiceCommandBar } from './components/VoiceCommandBar';
import { WelcomeSplash } from './components/WelcomeSplash';
import { RiskLevelToast } from './components/RiskLevelToast';
import { FamilySettingsCard } from './components/FamilySettingsCard';
import { AdminPanel } from './components/AdminPanel';
import { DesignLabFooter } from './components/DesignLabModals';
import { StatsEmailPromptBanner } from './components/StatsEmailPromptBanner';
import { DesignV2Sandbox } from './design-v2/DesignV2Sandbox';
import { SimpleResultCard } from './design-v2/SimpleResultCard';
import { mapSimpleResult } from './design-v2/mapSimpleResult';
import { calmTokens } from './design-v2/tokens';
import {
  classicModeHelpUrl,
  readUiMode,
  setUiMode,
  type UiMode,
} from './design-v2/simpleModeFlag';
import { VoiceCommandHandlers } from './utils/voiceCommands';
import { speakText } from './utils/tts';
import { useFamilySync } from './hooks/useFamilySync';
import { AdCheckResult, ThemeMode, UserRoleMode } from './types';
import { ShieldCheck, BookOpen, HelpCircle, History, Heart, Cpu, Smartphone, Send, BellRing } from 'lucide-react';

export default function App() {
  // Admin route (no react-router needed)
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
    return <AdminPanel />;
  }
  // Design-v2 sandbox only (Calm Security preview) — not First Creation default
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/design-v2')) {
    return <DesignV2Sandbox />;
  }
  // Accessibility & Theme state (font + role persisted — Lenovo WIP / First Creation polish)
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>(() => {
    let size: 'normal' | 'large' | 'xlarge' = 'large';
    try {
      const saved = localStorage.getItem('strazce_inzeratu_font_size');
      if (saved === 'normal' || saved === 'large' || saved === 'xlarge') size = saved;
    } catch {
      /* ignore */
    }
    if (typeof document !== 'undefined') {
      const narrow = window.matchMedia('(max-width: 640px)').matches;
      const applied = narrow && size === 'xlarge' ? 'large' : size;
      document.documentElement.setAttribute('data-font-size', applied);
    }
    return size;
  });
  const [themeMode, setThemeMode] = useState<ThemeMode>('shadowguard');
  const [userRoleMode, setUserRoleMode] = useState<UserRoleMode>(() => {
    try {
      const saved = localStorage.getItem('strazce_user_role_mode');
      if (saved === 'senior' || saved === 'expert') return saved;
    } catch {
      /* ignore */
    }
    return 'senior';
  });
  const [autoRead, setAutoRead] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem('strazce_user_role_mode', userRoleMode);
    } catch {
      /* ignore */
    }
  }, [userRoleMode]);

  // Phone: cap A++ → A+ so layout does not break; remember A++ for desktop
  const [isNarrowViewport, setIsNarrowViewport] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 640px)').matches;
  });

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const onChange = () => setIsNarrowViewport(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const uiFontSize: 'normal' | 'large' | 'xlarge' =
    isNarrowViewport && fontSize === 'xlarge' ? 'large' : fontSize;

  useEffect(() => {
    document.documentElement.setAttribute('data-font-size', uiFontSize);
    try {
      localStorage.setItem('strazce_inzeratu_font_size', fontSize);
    } catch {
      /* ignore */
    }
  }, [fontSize, uiFontSize]);

  // Closed beta: Jednoduchý režim only when flag / /simple / stored opt-in (D-021)
  const [uiMode, setUiModeState] = useState<UiMode>(() =>
    typeof window !== 'undefined' ? readUiMode() : 'first-creation'
  );
  const isSimpleMode = uiMode === 'simple';
  /** In simple mode: false = SimpleResultCard; true = full ResultDisplay details */
  const [showSimpleDetails, setShowSimpleDetails] = useState(false);

  // Active view tab
  const [activeTab, setActiveTab] = useState<'analyzer' | 'alerts' | 'guide' | 'quiz' | 'history'>('analyzer');

  // Modals state
  const [isCriteriaOpen, setIsCriteriaOpen] = useState(false);
  const [isFatherGuideOpen, setIsFatherGuideOpen] = useState(false);
  const [isSendToSonOpen, setIsSendToSonOpen] = useState(false);
  const [isInstallPwaOpen, setIsInstallPwaOpen] = useState(false);
  const [sendToSonCustomText, setSendToSonCustomText] = useState<string | undefined>(undefined);

  // Loading & Result state
  const [isLoading, setIsLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState<AdCheckResult | null>(null);
  const [toastLevel, setToastLevel] = useState<AdCheckResult['safetyLevel'] | null>(null);
  const [toastHeadline, setToastHeadline] = useState<string>('');

  const { syncHistoryItem } = useFamilySync(true);

  // Saved history in localStorage
  const [history, setHistory] = useState<AdCheckResult[]>(() => {
    try {
      const saved = localStorage.getItem('strazce_inzeratu_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save history on change
  useEffect(() => {
    try {
      localStorage.setItem('strazce_inzeratu_history', JSON.stringify(history));
    } catch (err) {
      console.warn('LocalStorage save error:', err);
    }
  }, [history]);

  // Handle Analyzing
  const handleAnalyze = async (data: {
    url: string;
    rawText: string;
    imageBase64?: string;
    userNote: string;
  }) => {
    setIsLoading(true);
    setCurrentResult(null);
    setToastLevel(null);

    try {
      const startTime = Date.now();
      const response = await fetch('/api/analyze-ad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const resData = await response.json();

      // First Creation keeps 10s scan; simple closed-beta uses shorter wait (less fatigue)
      const elapsedTime = Date.now() - startTime;
      const minScanTime = isSimpleMode ? 4000 : 10000;
      if (elapsedTime < minScanTime) {
        await new Promise((resolve) => setTimeout(resolve, minScanTime - elapsedTime));
      }

      if (resData.error) {
        alert(resData.error);
        setIsLoading(false);
        return;
      }

      const resultObj: AdCheckResult = resData;
      setShowSimpleDetails(false);
      setCurrentResult(resultObj);
      setToastLevel(resultObj.safetyLevel);
      setToastHeadline(isSimpleMode ? resultObj.headline : resultObj.headline);

      // Save to history list
      setHistory((prev) => [resultObj, ...prev.filter((item) => item.id !== resultObj.id)].slice(0, 20));
      void syncHistoryItem(resultObj);
    } catch (err) {
      console.error('Error analyzing ad:', err);
      alert('Při prověřování inzerátu došlo k chybě. Zkontrolujte prosím připojení.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setCurrentResult(null);
    setShowSimpleDetails(false);
  };

  const exitSimpleMode = () => {
    setUiMode('first-creation');
    setUiModeState('first-creation');
    setShowSimpleDetails(false);
    window.location.href = classicModeHelpUrl();
  };

  const isShadowGuard = themeMode === 'shadowguard';
  const isCyber = !isSimpleMode && themeMode === 'cyberpunk';
  const isContrast = !isSimpleMode && themeMode === 'highContrast';

  const voiceHandlers: VoiceCommandHandlers = {
    onNavigateTab: (tab) => setActiveTab(tab),
    onOpenCriteria: () => setIsCriteriaOpen(true),
    onOpenFatherGuide: () => setIsFatherGuideOpen(true),
    onOpenSendToSon: () => {
      setSendToSonCustomText(undefined);
      setIsSendToSonOpen(true);
    },
    onOpenInstallPwa: () => setIsInstallPwaOpen(true),
    onCloseModals: () => {
      setIsCriteriaOpen(false);
      setIsFatherGuideOpen(false);
      setIsSendToSonOpen(false);
      setIsInstallPwaOpen(false);
    },
    onSetThemeMode: (mode) => setThemeMode(mode),
    onSetFontSize: (size) => setFontSize(size),
    onSetAutoRead: (enabled) => setAutoRead(enabled),
    onReadCurrentResult: () => {
      if (currentResult) {
        const adviceText = currentResult.actionAdvice?.join('. ') || '';
        speakText(`Výsledek kontroly inzerátu: ${currentResult.headline}. Poučení pro tátu: ${currentResult.summaryForSenior}. Doporučený postup: ${adviceText}`);
      } else {
        speakText('Zatím nemáte prověřený žádný inzerát.');
      }
    },
    onReadLastHistoryItem: () => {
      if (history.length > 0) {
        const last = history[0];
        setActiveTab('history');
        const adviceText = last.actionAdvice?.join('. ') || '';
        speakText(`Poslední inzerát z historie: ${last.headline}. Riziko: ${last.safetyLevel}. Poučení: ${last.summaryForSenior}. Doporučení: ${adviceText}`);
      } else {
        speakText('V historii zatím nemáte žádné prověřené inzeráty.');
      }
    },
    onClearHistory: () => {
      setHistory([]);
      speakText('Historie prověřených inzerátů byla smazána');
    },
  };

  return (
    <div
      className={`min-h-screen transition-colors font-sans flex flex-col relative ${
        isSimpleMode
          ? ''
          : isShadowGuard
          ? 'shadowguard-marble-bg text-slate-100 selection:bg-[#E6B800] selection:text-black'
          : isCyber
          ? 'bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-slate-950 cyber-grid-bg'
          : isContrast
          ? 'bg-black text-white'
          : 'shadowguard-marble-bg text-slate-100 selection:bg-[#E6B800] selection:text-black'
      }`}
      style={
        isSimpleMode
          ? { background: calmTokens.pageBg, color: calmTokens.text }
          : undefined
      }
    >
      {!isSimpleMode && <WelcomeSplash />}
      <RiskLevelToast
        safetyLevel={toastLevel}
        headline={toastHeadline}
        onClose={() => setToastLevel(null)}
      />

      {/* Soft optional stats e-mail (weekly default, dismissible — never auto-sends) */}
      <StatsEmailPromptBanner
        history={history}
        variant={isSimpleMode || themeMode === 'classic' ? 'light' : 'dark'}
      />

      {isSimpleMode && (
        <div
          className="w-full border-b px-4 py-2.5 text-center text-sm sm:text-base"
          style={{
            background: calmTokens.accentSoft,
            borderColor: calmTokens.border,
            color: calmTokens.text,
          }}
          role="status"
        >
          <span className="font-bold">Closed beta · režim Jednoduchý</span>
          <span className="mx-2" style={{ color: calmTokens.textMuted }}>
            ·
          </span>
          <button
            type="button"
            onClick={exitSimpleMode}
            className="font-semibold underline underline-offset-2"
            style={{ color: calmTokens.accent }}
          >
            Zpět na klasický vzhled
          </button>
        </div>
      )}

      {/* Header — full chrome on First Creation; compact on simple */}
      {!isSimpleMode ? (
        <Header
          fontSize={uiFontSize}
          setFontSize={setFontSize}
          themeMode={themeMode}
          setThemeMode={setThemeMode}
          userRoleMode={userRoleMode}
          setUserRoleMode={setUserRoleMode}
          autoRead={autoRead}
          setAutoRead={setAutoRead}
          onOpenCriteria={() => setIsCriteriaOpen(true)}
          onOpenFatherGuide={() => setIsFatherGuideOpen(true)}
          onOpenSendToSon={() => {
            setSendToSonCustomText(undefined);
            setIsSendToSonOpen(true);
          }}
          onOpenInstallPwa={() => setIsInstallPwaOpen(true)}
        />
      ) : (
        <header
          className="border-b px-4 py-4"
          style={{ background: calmTokens.cardBg, borderColor: calmTokens.border }}
        >
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <ShieldCheck className="w-8 h-8 shrink-0" style={{ color: calmTokens.accent }} aria-hidden />
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-black truncate" style={{ color: calmTokens.text }}>
                  ShadowGuard
                </h1>
                <p className="text-xs sm:text-sm font-medium" style={{ color: calmTokens.textMuted }}>
                  Ověření inzerátu — srozumitelně
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsFatherGuideOpen(true)}
              className="text-sm font-semibold shrink-0 px-3 py-2 rounded-xl border"
              style={{ borderColor: calmTokens.border, color: calmTokens.accent }}
            >
              Nápověda
            </button>
          </div>
        </header>
      )}

      {/* Voice Commands — First Creation only (simple path stays quiet) */}
      {!isSimpleMode && <VoiceCommandBar handlers={voiceHandlers} themeMode={themeMode} />}

      {/* Main Navigation Tabs */}
      <nav
        className={`border-b transition-colors sticky top-0 z-20 backdrop-blur-md shadow-md ${
          isSimpleMode
            ? ''
            : isCyber
            ? 'bg-slate-950/90 border-slate-800/80 text-slate-200'
            : isContrast
            ? 'bg-slate-900 border-yellow-400 text-white'
            : 'bg-[#121214]/95 border-[#B8860B]/40 text-slate-100 shadow-[0_4px_20px_rgba(184,134,11,0.15)]'
        }`}
        style={
          isSimpleMode
            ? { background: calmTokens.cardBg, borderColor: calmTokens.border, color: calmTokens.text }
            : undefined
        }
      >
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-start sm:justify-center gap-2 overflow-x-auto py-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('analyzer');
              if (currentResult) handleReset();
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-sm sm:text-base whitespace-nowrap transition-all ${
              activeTab === 'analyzer'
                ? isSimpleMode
                  ? 'font-black shadow-sm'
                  : isCyber
                  ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)] font-black'
                  : isContrast
                  ? 'bg-yellow-400 text-black shadow-md font-black'
                  : 'bg-gradient-to-r from-[#B8860B] to-[#D4AF37] text-black shadow-[0_0_15px_rgba(184,134,11,0.4)] font-black'
                : isSimpleMode
                ? 'opacity-70 hover:opacity-100'
                : 'text-slate-300 hover:text-white'
            }`}
            style={
              isSimpleMode && activeTab === 'analyzer'
                ? { background: calmTokens.accent, color: '#fff' }
                : isSimpleMode
                ? { color: calmTokens.text }
                : undefined
            }
          >
            <ShieldCheck className="w-5 h-5" />
            <span>Prověřit inzerát</span>
          </button>

          {!isSimpleMode && (
            <button
              type="button"
              onClick={() => setActiveTab('alerts')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-sm sm:text-base whitespace-nowrap transition-all ${
                activeTab === 'alerts'
                  ? isCyber
                    ? 'bg-rose-500 text-slate-950 font-black shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                    : isContrast
                    ? 'bg-yellow-400 text-black font-black'
                    : 'bg-gradient-to-r from-rose-600 to-amber-500 text-white font-black shadow-[0_0_15px_rgba(225,29,72,0.4)]'
                  : 'text-rose-300 hover:text-rose-100 hover:bg-rose-950/40 border border-rose-500/30'
              }`}
            >
              <BellRing className="w-5 h-5 text-rose-400 animate-pulse" />
              <span>Aktuální varování</span>
            </button>
          )}

          {!isSimpleMode && (
            <button
              type="button"
              onClick={() => setIsCriteriaOpen(true)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl font-bold text-sm sm:text-base whitespace-nowrap transition-all ${
                isCyber
                  ? 'text-cyan-400 hover:bg-slate-900 border border-cyan-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-[#1A1A1A] border border-[#B8860B]/20'
              }`}
            >
              <Cpu className="w-5 h-5 text-cyan-400" />
              <span>Princip a kritéria</span>
            </button>
          )}

          {!isSimpleMode && (
            <button
              type="button"
              onClick={() => setIsFatherGuideOpen(true)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl font-bold text-sm sm:text-base whitespace-nowrap transition-all ${
                isCyber
                  ? 'text-emerald-400 hover:bg-slate-900 border border-emerald-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-[#1A1A1A] border border-[#B8860B]/20'
              }`}
            >
              <Smartphone className="w-5 h-5 text-emerald-400" />
              <span>Jak dát tátovi do telefonu</span>
            </button>
          )}

          {!isSimpleMode && (
            <button
              type="button"
              onClick={() => setActiveTab('guide')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-sm sm:text-base whitespace-nowrap transition-all ${
                activeTab === 'guide'
                  ? isCyber
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-black'
                    : isContrast
                    ? 'bg-yellow-400 text-black shadow-md'
                    : 'bg-gradient-to-r from-[#B8860B] to-[#D4AF37] text-black shadow-[0_0_15px_rgba(184,134,11,0.4)] font-black'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <BookOpen className="w-5 h-5" />
              <span>Zlatá pravidla</span>
            </button>
          )}

          {!isSimpleMode && (
            <button
              type="button"
              onClick={() => setActiveTab('quiz')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-sm sm:text-base whitespace-nowrap transition-all ${
                activeTab === 'quiz'
                  ? isCyber
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-black'
                    : isContrast
                    ? 'bg-yellow-400 text-black'
                    : 'bg-gradient-to-r from-[#B8860B] to-[#D4AF37] text-black shadow-[0_0_15px_rgba(184,134,11,0.4)] font-black'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <HelpCircle className="w-5 h-5" />
              <span>Trénink podvodů</span>
            </button>
          )}

          {history.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-sm sm:text-base whitespace-nowrap transition-all ${
                activeTab === 'history'
                  ? isSimpleMode
                    ? 'font-black shadow-sm'
                    : isCyber
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-black'
                    : isContrast
                    ? 'bg-yellow-400 text-black'
                    : 'bg-gradient-to-r from-[#B8860B] to-[#D4AF37] text-black shadow-[0_0_15px_rgba(184,134,11,0.4)] font-black'
                  : isSimpleMode
                  ? 'opacity-70 hover:opacity-100'
                  : 'text-slate-300 hover:text-white'
              }`}
              style={
                isSimpleMode && activeTab === 'history'
                  ? { background: calmTokens.accent, color: '#fff' }
                  : isSimpleMode
                  ? { color: calmTokens.text }
                  : undefined
              }
            >
              <History className="w-5 h-5" />
              <span>Historie ({history.length})</span>
            </button>
          )}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10 flex-1">
        {activeTab === 'analyzer' && (
          <div>
            {isLoading ? (
              <ScanningAnimation
                fontSize={uiFontSize}
                themeMode={
                  isSimpleMode
                    ? 'classic'
                    : themeMode === 'shadowguard'
                    ? 'classic'
                    : themeMode
                }
              />
            ) : currentResult ? (
              isSimpleMode && !showSimpleDetails ? (
                <div className="space-y-4">
                  <SimpleResultCard
                    model={mapSimpleResult(currentResult)}
                    onShowMore={() => {
                      setShowSimpleDetails(true);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    onReset={handleReset}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  {isSimpleMode && showSimpleDetails && (
                    <button
                      type="button"
                      onClick={() => setShowSimpleDetails(false)}
                      className="text-sm font-bold underline underline-offset-2"
                      style={{ color: calmTokens.accent }}
                    >
                      ← Zpět na jednoduchý přehled
                    </button>
                  )}
                  <ResultDisplay
                    result={currentResult}
                    onReset={handleReset}
                    fontSize={uiFontSize}
                    themeMode={themeMode}
                    autoRead={autoRead}
                    onOpenSendToSon={() => {
                      setSendToSonCustomText(undefined);
                      setIsSendToSonOpen(true);
                    }}
                  />
                </div>
              )
            ) : (
              <div>
                <AdAnalyzerForm
                  onAnalyze={handleAnalyze}
                  isLoading={isLoading}
                  fontSize={uiFontSize}
                  themeMode={themeMode}
                  history={history}
                  userRoleMode={userRoleMode}
                  onOpenSendToSon={(customText) => {
                    setSendToSonCustomText(customText);
                    setIsSendToSonOpen(true);
                  }}
                />

                {!isSimpleMode && <FamilySettingsCard />}

                {/* Expert only on home: historie/analýzy na konci (Senior: méně šumu) */}
                {!isSimpleMode && userRoleMode === 'expert' && history.length > 0 && (
                  <HistoryList
                    history={history}
                    onSelectResult={(item) => {
                      setCurrentResult(item);
                      setShowSimpleDetails(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    onClearHistory={() => setHistory([])}
                    fontSize={uiFontSize}
                    highContrast={isContrast}
                    themeMode={themeMode}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'alerts' && (
          <ScamAlertsSection themeMode={themeMode} fontSize={uiFontSize} />
        )}

        {activeTab === 'guide' && <SeniorGuide fontSize={uiFontSize} highContrast={isContrast} />}

        {activeTab === 'quiz' && <ScamQuiz fontSize={uiFontSize} highContrast={isContrast} />}

        {activeTab === 'history' && (
          <HistoryList
            history={history}
            onSelectResult={(item) => {
              setCurrentResult(item);
              setShowSimpleDetails(false);
              setActiveTab('analyzer');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onClearHistory={() => setHistory([])}
            fontSize={uiFontSize}
            highContrast={isContrast}
            themeMode={themeMode}
          />
        )}
      </main>

      {/* Modals */}
      <CriteriaModal
        isOpen={isCriteriaOpen}
        onClose={() => setIsCriteriaOpen(false)}
        themeMode={themeMode}
      />

      <FatherPhoneGuideModal
        isOpen={isFatherGuideOpen}
        onClose={() => setIsFatherGuideOpen(false)}
        themeMode={themeMode}
      />

      <SendToSonModal
        isOpen={isSendToSonOpen}
        onClose={() => setIsSendToSonOpen(false)}
        result={currentResult}
        customText={sendToSonCustomText}
        themeMode={themeMode}
      />

      <InstallPwaModal
        isOpen={isInstallPwaOpen}
        onClose={() => setIsInstallPwaOpen(false)}
        uiMode={isCyber ? 'cyber' : isContrast ? 'contrast' : 'senior'}
      />

      {/* Footer */}
      <footer
        className={`py-6 border-t text-center text-xs sm:text-sm safe-area-pad-bottom ${
          isSimpleMode
            ? ''
            : isCyber
            ? 'bg-slate-950 border-slate-900 text-slate-500'
            : isContrast
            ? 'bg-black border-yellow-400 text-slate-400'
            : 'bg-white border-slate-200 text-slate-500'
        }`}
        style={
          isSimpleMode
            ? { background: calmTokens.cardBg, borderColor: calmTokens.border, color: calmTokens.textMuted }
            : undefined
        }
      >
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="flex items-center gap-1 font-medium">
            <span>
              {isSimpleMode
                ? 'ShadowGuard · režim Jednoduchý (closed beta)'
                : 'ShadowGuard Shadvert — First Creation · s péčí pro otce a rodinu'}
            </span>
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
          </p>
          {!isSimpleMode && (
            <p className="text-slate-500">
              AI Google Gemini · <a href="/admin" className="text-cyan-600 hover:underline">Admin</a>
            </p>
          )}
        </div>
        {/* Lab only on First Creation — simple closed beta stays calm */}
        {!isSimpleMode && <DesignLabFooter themeMode={themeMode} />}
      </footer>
    </div>
  );
}
