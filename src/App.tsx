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
  // Accessibility & Theme state
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('large');
  const [themeMode, setThemeMode] = useState<ThemeMode>('shadowguard');
  const [userRoleMode, setUserRoleMode] = useState<UserRoleMode>('senior');
  const [autoRead, setAutoRead] = useState<boolean>(false);

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

      // Ensure min 10 seconds scanning animation for authentic analysis experience
      const elapsedTime = Date.now() - startTime;
      const minScanTime = 10000; // 10 seconds
      if (elapsedTime < minScanTime) {
        await new Promise((resolve) => setTimeout(resolve, minScanTime - elapsedTime));
      }

      if (resData.error) {
        alert(resData.error);
        setIsLoading(false);
        return;
      }

      const resultObj: AdCheckResult = resData;
      setCurrentResult(resultObj);
      setToastLevel(resultObj.safetyLevel);
      setToastHeadline(resultObj.headline);

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
  };

  const isShadowGuard = themeMode === 'shadowguard';
  const isCyber = themeMode === 'cyberpunk';
  const isContrast = themeMode === 'highContrast';

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
        isShadowGuard
          ? 'shadowguard-marble-bg text-slate-100 selection:bg-[#E6B800] selection:text-black'
          : isCyber
          ? 'bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-slate-950 cyber-grid-bg'
          : isContrast
          ? 'bg-black text-white'
          : 'shadowguard-marble-bg text-slate-100 selection:bg-[#E6B800] selection:text-black'
      }`}
    >
      <WelcomeSplash />
      <RiskLevelToast
        safetyLevel={toastLevel}
        headline={toastHeadline}
        onClose={() => setToastLevel(null)}
      />

      {/* Header */}
      <Header
        fontSize={fontSize}
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

      {/* Voice Commands Bar */}
      <VoiceCommandBar handlers={voiceHandlers} themeMode={themeMode} />

      {/* Main Navigation Tabs */}
      <nav
        className={`border-b transition-colors sticky top-0 z-20 backdrop-blur-md shadow-md ${
          isCyber
            ? 'bg-slate-950/90 border-slate-800/80 text-slate-200'
            : isContrast
            ? 'bg-slate-900 border-yellow-400 text-white'
            : 'bg-[#121214]/95 border-[#B8860B]/40 text-slate-100 shadow-[0_4px_20px_rgba(184,134,11,0.15)]'
        }`}
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
                ? isCyber
                  ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)] font-black'
                  : isContrast
                  ? 'bg-yellow-400 text-black shadow-md font-black'
                  : 'bg-gradient-to-r from-[#B8860B] to-[#D4AF37] text-black shadow-[0_0_15px_rgba(184,134,11,0.4)] font-black'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
            <span>Prověřit inzerát</span>
          </button>

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

          {history.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-sm sm:text-base whitespace-nowrap transition-all ${
                activeTab === 'history'
                  ? isCyber
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-black'
                    : isContrast
                    ? 'bg-yellow-400 text-black'
                    : 'bg-gradient-to-r from-[#B8860B] to-[#D4AF37] text-black shadow-[0_0_15px_rgba(184,134,11,0.4)] font-black'
                  : 'text-slate-300 hover:text-white'
              }`}
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
              <ScanningAnimation fontSize={fontSize} themeMode={themeMode} />
            ) : currentResult ? (
              <ResultDisplay
                result={currentResult}
                onReset={handleReset}
                fontSize={fontSize}
                themeMode={themeMode}
                autoRead={autoRead}
                onOpenSendToSon={() => {
                  setSendToSonCustomText(undefined);
                  setIsSendToSonOpen(true);
                }}
              />
            ) : (
              <div>
                <AdAnalyzerForm
                  onAnalyze={handleAnalyze}
                  isLoading={isLoading}
                  fontSize={fontSize}
                  themeMode={themeMode}
                  history={history}
                  onOpenSendToSon={(customText) => {
                    setSendToSonCustomText(customText);
                    setIsSendToSonOpen(true);
                  }}
                />

                <FamilySettingsCard />

                {/* Show recent checks below form */}
                {history.length > 0 && (
                  <HistoryList
                    history={history}
                    onSelectResult={(item) => {
                      setCurrentResult(item);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    onClearHistory={() => setHistory([])}
                    fontSize={fontSize}
                    highContrast={isContrast}
                    themeMode={themeMode}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'alerts' && (
          <ScamAlertsSection themeMode={themeMode} fontSize={fontSize} />
        )}

        {activeTab === 'guide' && <SeniorGuide fontSize={fontSize} highContrast={isContrast} />}

        {activeTab === 'quiz' && <ScamQuiz fontSize={fontSize} highContrast={isContrast} />}

        {activeTab === 'history' && (
          <HistoryList
            history={history}
            onSelectResult={(item) => {
              setCurrentResult(item);
              setActiveTab('analyzer');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onClearHistory={() => setHistory([])}
            fontSize={fontSize}
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
        className={`py-6 border-t text-center text-xs sm:text-sm ${
          isCyber
            ? 'bg-slate-950 border-slate-900 text-slate-500'
            : isContrast
            ? 'bg-black border-yellow-400 text-slate-400'
            : 'bg-white border-slate-200 text-slate-500'
        }`}
      >
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="flex items-center gap-1 font-medium">
            <span>ShadowGuard Shadvert — First Creation · s péčí pro otce a rodinu</span>
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
          </p>
          <p className="text-slate-500">
            AI Google Gemini · <a href="/admin" className="text-cyan-600 hover:underline">Admin</a>
          </p>
        </div>
        {/* Lab: swatches + survey — does not change dad's main path */}
        <DesignLabFooter themeMode={themeMode} />
      </footer>
    </div>
  );
}
