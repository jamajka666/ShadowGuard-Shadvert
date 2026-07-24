import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Volume2,
  VolumeX,
  Share2,
  CheckCircle,
  XCircle,
  RotateCcw,
  ExternalLink,
  Info,
  Copy,
  Check,
  Send,
  MessageSquare,
  MessageCircle,
  Smartphone,
  Cpu,
  ShoppingBag,
  Building2,
} from 'lucide-react';
import { AdCheckResult, ThemeMode, UserRoleMode } from '../types';
import { speakText, stopSpeech } from '../utils/tts';
import { AlternativeSuggestions } from './AlternativeSuggestions';
import { PriceComparisonWidget } from './PriceComparisonWidget';
import { SuspiciousKeywordsHighlighter } from './SuspiciousKeywordsHighlighter';
import { EshopVisualTrustCard } from './EshopVisualTrustCard';
import { SslDomainCard } from './SslDomainCard';
import { TrustScoreGauge } from './TrustScoreGauge';
import { EnergyAuraVisualizer } from './EnergyAuraVisualizer';
import { UserCheck, Shield, FileCode, Terminal, AlertOctagon, CheckSquare, Layers, Download } from 'lucide-react';

interface ResultDisplayProps {
  result: AdCheckResult;
  onReset: () => void;
  fontSize: 'normal' | 'large' | 'xlarge';
  themeMode: ThemeMode;
  userRoleMode?: UserRoleMode;
  autoRead: boolean;
  onOpenSendToSon: () => void;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({
  result,
  onReset,
  fontSize,
  themeMode,
  userRoleMode = 'senior',
  autoRead,
  onOpenSendToSon,
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [showExpertRawJson, setShowExpertRawJson] = useState(false);

  // Text-To-Speech handler
  const handleSpeak = () => {
    if (isSpeaking) {
      stopSpeech();
      setIsSpeaking(false);
      return;
    }

    const adviceText = result.actionAdvice && result.actionAdvice.length > 0
      ? result.actionAdvice.join('. ')
      : 'Žádná zvláštní opatření nejsou nutná.';

    const textToRead = `Výsledek kontroly inzerátu: ${result.headline}. Srozumitelné poučení: ${
      result.summaryForSenior
    }. Doporučený postup: ${adviceText}`;

    setIsSpeaking(true);
    speakText(
      textToRead,
      () => setIsSpeaking(false),
      () => setIsSpeaking(false)
    );
  };

  // Auto-read on completion if autoRead is enabled
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (autoRead && result) {
      // Small timeout to ensure DOM transition completes smoothly
      timer = setTimeout(() => {
        const adviceText = result.actionAdvice && result.actionAdvice.length > 0
          ? result.actionAdvice.join('. ')
          : 'Žádná zvláštní opatření nejsou nutná.';

        const textToRead = `Výsledek kontroly inzerátu: ${result.headline}. Srozumitelné poučení pro tátu: ${
          result.summaryForSenior
        }. Doporučený postup: ${adviceText}`;

        setIsSpeaking(true);
        speakText(
          textToRead,
          () => setIsSpeaking(false),
          () => setIsSpeaking(false)
        );
      }, 500);
    }

    return () => {
      if (timer) clearTimeout(timer);
      stopSpeech();
    };
  }, [result.id, autoRead]);

  // Handle Quick Copy for Family
  const handleShareFamily = async () => {
    const textToShare = `Ahoj, prověřil jsem inzerát přes Strážce Inzerátů:
Výsledek: ${
      result.safetyLevel === 'PODVOD'
        ? '🛑 PODVOD'
        : result.safetyLevel === 'OPATRNOSTI'
        ? '🟡 OPATRNOST'
        : '🟢 DŮVĚRYHODNÉ'
    }
${result.headline}
Doporučení pro tátu: ${result.summaryForSenior}
${result.inputUrl ? `Odkaz: ${result.inputUrl}` : ''}`;

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(textToShare);
        setCopiedShare(true);
        setTimeout(() => setCopiedShare(false), 3000);
      }
    } catch (err) {
      console.warn('Share error:', err);
    }
  };

  // Direct WhatsApp Share
  const handleWhatsAppShare = () => {
    const safetyBadge =
      result.safetyLevel === 'PODVOD'
        ? '🛑 PRAVDĚPODOBNÝ PODVOD / VYSOKÉ RIZIKO'
        : result.safetyLevel === 'OPATRNOSTI'
        ? '🟡 ZVÝŠENÁ OPATRNOST'
        : '🟢 BEZPEČNÝ INZERÁT';

    const textToShare =
      `*Bezpečnostní prověrka inzerátu (Strážce Inzerátů)*\n\n` +
      `*Stav:* ${safetyBadge}\n` +
      `*Název:* ${result.headline}\n` +
      `*Skóre důvěry:* ${result.trustScore}/100\n\n` +
      `*Srozumitelné poučení:* ${result.summaryForSenior}\n\n` +
      (result.inputUrl ? `*Odkaz na inzerát:* ${result.inputUrl}\n\n` : '') +
      `_Odesláno z aplikace Strážce Inzerátů_`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(textToShare)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const textClasses = {
    normal: 'text-base',
    large: 'text-lg',
    xlarge: 'text-xl',
  }[fontSize];

  const isShadowGuard = themeMode === 'shadowguard';
  const isCyber = themeMode === 'cyberpunk';
  const isContrast = themeMode === 'highContrast';

  const isScam = result.safetyLevel === 'PODVOD';
  const isCaution = result.safetyLevel === 'OPATRNOSTI';

  // Cyberpunk & Contrast Themes
  const themeClasses = isScam
    ? {
        bgCard: isCyber
          ? 'bg-slate-950 border-rose-500/80 text-slate-100 cyber-card-scam'
          : isContrast
          ? 'bg-black border-red-500 text-white'
          : 'bg-red-50/90 border-red-300 text-slate-900',
        badgeBg: 'bg-gradient-to-r from-rose-600 to-red-700 text-white font-black shadow-[0_0_20px_rgba(225,29,72,0.6)] animate-pulse',
        badgeLabel: '🛑 PRAVDĚPODOBNÝ PODVOD / VYSOKÉ RIZIKO',
        icon: <ShieldAlert className="w-12 h-12 text-rose-500 shrink-0 animate-pulse drop-shadow-[0_0_12px_rgba(244,63,94,0.8)]" />,
        actionBox: isCyber
          ? 'bg-rose-950/40 border-rose-500/50 text-rose-100 shadow-[inset_0_0_20px_rgba(244,63,94,0.15)]'
          : isContrast
          ? 'bg-black border-red-400 text-white'
          : 'bg-red-100 border-red-400 text-red-950',
      }
    : isCaution
    ? {
        bgCard: isCyber
          ? 'bg-slate-950 border-amber-500/80 text-slate-100 cyber-card-glow'
          : isContrast
          ? 'bg-black border-yellow-400 text-white'
          : 'bg-amber-50/90 border-amber-300 text-slate-900',
        badgeBg: 'bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 font-black shadow-[0_0_20px_rgba(245,158,11,0.6)]',
        badgeLabel: '🟡 ZVÝŠENÁ OPATRNOST',
        icon: <AlertTriangle className="w-12 h-12 text-amber-400 shrink-0 drop-shadow-[0_0_12px_rgba(245,158,11,0.8)]" />,
        actionBox: isCyber
          ? 'bg-amber-950/40 border-amber-500/50 text-amber-100 shadow-[inset_0_0_20px_rgba(245,158,11,0.15)]'
          : isContrast
          ? 'bg-black border-yellow-400 text-white'
          : 'bg-amber-100 border-amber-400 text-amber-950',
      }
    : {
        bgCard: isCyber
          ? 'bg-slate-950 border-emerald-500/80 text-slate-100 cyber-card-safe'
          : isContrast
          ? 'bg-black border-emerald-400 text-white'
          : 'bg-emerald-50/90 border-emerald-300 text-slate-900',
        badgeBg: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-black shadow-[0_0_20px_rgba(16,185,129,0.6)]',
        badgeLabel: '🟢 BEZPEČNÉ A DŮVĚRYHODNÉ',
        icon: <ShieldCheck className="w-12 h-12 text-emerald-400 shrink-0 drop-shadow-[0_0_12px_rgba(16,185,129,0.8)]" />,
        actionBox: isCyber
          ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-100 shadow-[inset_0_0_20px_rgba(16,185,129,0.15)]'
          : isContrast
          ? 'bg-black border-emerald-400 text-white'
          : 'bg-emerald-100 border-emerald-400 text-emerald-950',
      };

  return (
    <motion.div
      initial={{ opacity: 0, y: 35, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6 my-6"
    >
      {/* Active Voice Reading Banner */}
      {isSpeaking && (
        <div
          className={`p-4 rounded-2xl border-2 shadow-xl flex items-center justify-between gap-4 transition-all ${
            isCyber
              ? 'bg-cyan-950/90 border-cyan-400 text-cyan-100 shadow-[0_0_25px_rgba(6,182,212,0.4)]'
              : isContrast
              ? 'bg-yellow-400 text-black border-yellow-500 font-black'
              : 'bg-emerald-700 text-white border-emerald-600'
          }`}
        >
          <div className="flex items-center gap-3">
            <Volume2 className="w-6 h-6 animate-pulse shrink-0" />
            <div>
              <span className="font-black text-sm sm:text-base block">
                🔊 PROBÍHÁ AUTOMATICKÉ PŘEČTENÍ VÝSLEDKŮ A DOPORUČENÍ
              </span>
              <span className="text-xs sm:text-sm opacity-90 font-medium">
                Předčítám shrnutí inzerátu a doporučený bezpečnostní postup...
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopSpeech();
              setIsSpeaking(false);
            }}
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shrink-0 flex items-center gap-1.5 shadow-md transition-all hover:scale-105"
          >
            <VolumeX className="w-4 h-4" />
            <span>Zastavit čtení</span>
          </button>
        </div>
      )}

      {/* Primary Result Banner Card */}
      <div className={`rounded-3xl p-6 sm:p-8 shadow-2xl border-2 transition-all ${themeClasses.bgCard}`}>
        {/* Status Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            {themeClasses.icon}
            <div>
              <span className={`inline-block px-3 py-1 rounded-full text-xs sm:text-sm font-black mb-1.5 ${themeClasses.badgeBg}`}>
                {themeClasses.badgeLabel}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black leading-tight">
                {result.headline}
              </h2>
              {result.isFallback && (
                <div className="mt-2 px-3 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold inline-flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  <span>Vyhodnoceno bezpečnostním pravidlovým systémem Strážce Inzerátů</span>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons (Audio readout + WhatsApp + Send to Son) */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Audio Readout */}
            <button
              type="button"
              onClick={handleSpeak}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold shadow-lg transition-all ${
                isSpeaking
                  ? 'bg-rose-600 text-white animate-pulse shadow-[0_0_20px_rgba(225,29,72,0.6)]'
                  : isCyber
                  ? 'bg-slate-900 border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/20'
                  : isContrast
                  ? 'bg-yellow-400 text-black'
                  : 'bg-slate-900 text-white'
              }`}
            >
              {isSpeaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
              <span>{isSpeaking ? 'Zastavit čtení' : 'Přečíst nahlas'}</span>
            </button>

            {/* DIRECT WHATSAPP SHARE BUTTON */}
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black shadow-lg transition-all border ${
                isCyber
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400/50 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                  : isContrast
                  ? 'bg-yellow-400 text-black border-yellow-500'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500'
              }`}
              title="Poslat varování nebo výsledek prověrky přes WhatsApp rodině"
            >
              <MessageCircle className="w-5 h-5 text-white" />
              <span>💬 SDÍLET PŘES WHATSAPP</span>
            </button>

            {/* SEND TO SON BUTTON */}
            <button
              type="button"
              onClick={onOpenSendToSon}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black shadow-lg transition-all border ${
                isCyber
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white border-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                  : isContrast
                  ? 'bg-yellow-400 text-black border-yellow-500'
                  : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500'
              }`}
            >
              <Send className="w-5 h-5" />
              <span>📱 SYNOVI NA TELEFON</span>
            </button>
          </div>
        </div>

        {/* Senior Summary Callout */}
        <div className={`mt-6 p-5 sm:p-6 rounded-2xl border-2 ${themeClasses.actionBox}`}>
          <h3 className="text-lg sm:text-xl font-black mb-2 flex items-center gap-2">
            <Info className="w-6 h-6 shrink-0 text-cyan-400" />
            Srozumitelné vysvětlení pro otce:
          </h3>
          <p className={`font-bold leading-relaxed ${textClasses}`}>
            {result.summaryForSenior}
          </p>

          {/* Action Advice Bullets */}
          <div className="mt-4 pt-4 border-t border-slate-700/80">
            <h4 className="font-bold text-xs uppercase tracking-wider mb-2 text-slate-400">Doporučený postup:</h4>
            <ul className="space-y-2">
              {result.actionAdvice.map((advice, idx) => (
                <li key={idx} className={`flex items-start gap-2.5 font-bold ${textClasses}`}>
                  {isScam ? (
                    <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  )}
                  <span>{advice}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Trust Score Visualizer Gauge & Dynamic Energy Aura */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
          <TrustScoreGauge score={result.trustScore} themeMode={themeMode} fontSize={fontSize} />
          <EnergyAuraVisualizer score={result.trustScore} />
        </div>

        {/* Action Recommendation Pill */}
        <div className={`mt-4 flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border ${
          isCyber ? 'bg-slate-900 border-cyan-500/40 text-white' : isContrast ? 'bg-black border-yellow-400 text-white' : 'bg-[#1C1C1E] border-[#B8860B]/60 text-white'
        }`}>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Doporučený typ transakce:
            </span>
            <span className="text-lg font-black text-white">
              {result.actionRecommendation === 'NEKUPOVAT_NEPLATIT' && '🛑 NEKUPOVAT A NEREAGOVAT (VYSOKÉ RIZIKO)'}
              {result.actionRecommendation === 'POUZE_OSOBNI_PREDANI' && '🤝 POUZE OSOBNÍ PŘEDÁNÍ S PROHLÍDKOU ZBOŽÍ'}
              {result.actionRecommendation === 'KOUPIT_BEZPECNE' && '✅ BEZPEČNÁ PLATBA A NÁKUP'}
            </span>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Skóre důvěryhodnosti:
            </span>
            <span className={`text-2xl font-black ${isScam ? 'text-rose-500' : isCaution ? 'text-amber-400' : 'text-emerald-400'}`}>
              {result.trustScore} / 100
            </span>
          </div>
        </div>
      </div>

      {/* E-SHOP VISUAL TRUST ANALYSIS (WHEN SCREENSHOT ANALYZED) */}
      <EshopVisualTrustCard
        result={result}
        themeMode={themeMode}
        uiMode={isShadowGuard ? 'shadowguard' : isCyber ? 'cyber' : isContrast ? 'contrast' : 'senior'}
        fontSize={fontSize}
      />

      {/* SSL CERTIFICATE & DOMAIN INFO INSPECTION */}
      <SslDomainCard
        info={result.sslDomainInfo}
        themeMode={themeMode}
        uiMode={isShadowGuard ? 'shadowguard' : isCyber ? 'cyber' : isContrast ? 'contrast' : 'senior'}
        fontSize={fontSize}
      />

      {/* HIGHLIGHTED SUSPICIOUS KEYWORDS IN AD TEXT */}
      <SuspiciousKeywordsHighlighter
        text={result.inputSnippet || result.headline || ''}
        uiMode={isShadowGuard ? 'shadowguard' : isCyber ? 'cyber' : isContrast ? 'contrast' : 'senior'}
      />

      {/* PRICE COMPARISON WIDGET (HEUREKA / ZBOZI) */}
      <PriceComparisonWidget
        result={result}
        themeMode={themeMode}
        uiMode={isShadowGuard ? 'shadowguard' : isCyber ? 'cyber' : isContrast ? 'contrast' : 'senior'}
        fontSize={fontSize}
      />

      {/* TRUSTED ALTERNATIVES COMPONENT FOR RISKY / SCAM OFFERS */}
      <AlternativeSuggestions
        result={result}
        themeMode={themeMode}
        uiMode={isShadowGuard ? 'shadowguard' : isCyber ? 'cyber' : isContrast ? 'contrast' : 'senior'}
      />

      {/* Detailed Analysis Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Risk factors card */}
        <div className={`p-6 rounded-3xl border shadow-md ${
          isShadowGuard
            ? 'bg-[#121214] border-[#CD7F32]/80 text-slate-100 shadowguard-bronze-border'
            : isCyber
            ? 'bg-slate-950 border-slate-800 text-slate-200'
            : isContrast
            ? 'bg-black border-yellow-400 text-white'
            : 'bg-white border-slate-200'
        }`}>
          <h3 className="text-lg font-black mb-4 text-rose-500 flex items-center gap-2 border-b border-slate-800 pb-2">
            <ShieldAlert className="w-5 h-5" />
            Nalezená bezpečnostní rizika ({result.riskFactors.length})
          </h3>

          {result.riskFactors.length === 0 ? (
            <p className="text-slate-500 text-sm italic">Žádná vážná bezpečnostní rizika nebyla detekována.</p>
          ) : (
            <div className="space-y-3">
              {result.riskFactors.map((rf) => (
                <div key={rf.id} className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-100 text-sm">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold">{rf.title}</span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-rose-500/30 text-rose-300 uppercase border border-rose-500/40">
                      {rf.severity} RIZIKO
                    </span>
                  </div>
                  <p className="text-xs opacity-90">{rf.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Positive factors & Seller checks card */}
        <div className={`p-6 rounded-3xl border shadow-md ${
          isCyber
            ? 'bg-slate-950 border-slate-800 text-slate-200'
            : isContrast
            ? 'bg-black border-yellow-400 text-white'
            : 'bg-[#1A1A1A] border-[#B8860B]/60 text-slate-100 shadowguard-bronze-border'
        }`}>
          <h3 className="text-lg font-black mb-4 text-emerald-400 flex items-center gap-2 border-b border-slate-800 pb-2">
            <ShieldCheck className="w-5 h-5" />
            Pozitivní nálezy a prověrka prodejce
          </h3>

          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Pozitivní znaky:</h4>
              {result.positiveFactors.length === 0 ? (
                <p className="text-slate-500 text-xs italic">Žádné výrazné pozitivní znaky.</p>
              ) : (
                <ul className="space-y-2">
                  {result.positiveFactors.map((pf) => (
                    <li key={pf.id} className="flex items-start gap-2 text-sm text-slate-200">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">{pf.title}: </span>
                        <span className="text-slate-400 text-xs">{pf.description}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Seller checks */}
            {result.sellerChecks.length > 0 && (
              <div className="pt-3 border-t border-slate-800">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Kritéria k prodejci:</h4>
                <ul className="space-y-1.5">
                  {result.sellerChecks.map((sc, i) => (
                    <li key={i} className="text-xs text-slate-300 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                      <span>{sc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* URL & Price Evaluation Card */}
      <div className={`p-6 rounded-3xl border shadow-md ${
        isCyber
          ? 'bg-slate-950 border-slate-800 text-slate-200'
          : isContrast
          ? 'bg-black border-yellow-400 text-white'
          : 'bg-white border-slate-200'
      }`}>
        <h3 className="text-lg font-black mb-4 text-cyan-400 flex items-center gap-2 border-b border-slate-800 pb-2">
          <Info className="w-5 h-5 text-cyan-400" />
          Prověrka webové adresy (domény) a ceny
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
          <div>
            <span className="font-bold text-slate-400 block text-xs uppercase mb-1">Webová adresa:</span>
            <span className="font-mono font-bold text-white text-base">
              {result.urlAnalysis.domainName || 'Nezadána'}
            </span>
            {result.urlAnalysis.isOfficialDomain ? (
              <p className="text-xs text-emerald-400 font-bold mt-1">✓ Oficiální český portál/web</p>
            ) : (
              <p className="text-xs text-amber-400 font-bold mt-1">⚠ Neoficiální / Neznámá doména</p>
            )}
            {result.urlAnalysis.domainWarning && (
              <p className="text-xs text-rose-400 font-bold mt-1 bg-rose-950/40 p-2 rounded-lg border border-rose-500/40">
                {result.urlAnalysis.domainWarning}
              </p>
            )}
          </div>

          <div>
            <span className="font-bold text-slate-400 block text-xs uppercase mb-1">Hodnocení nabízené ceny:</span>
            <p className="text-slate-300">{result.priceEvaluation.priceComment}</p>
            {result.priceEvaluation.estimatedMarketPrice && (
              <p className="text-xs font-bold text-amber-300 mt-1">
                Běžná cena na trhu: {result.priceEvaluation.estimatedMarketPrice}
              </p>
            )}
            {result.priceEvaluation.isPriceSuspicious && (
              <div className="mt-2 p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 font-bold space-y-1">
                <p>⚠ Pozor: Nereálně nízká cena je nejčastějším trikem podvodníků!</p>
                <a
                  href={`https://www.heureka.cz/srozumitelne-vyhledavani/?h=${encodeURIComponent(
                    result.priceEvaluation.suggestedSearchTerm || result.headline
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-amber-300 hover:underline font-black text-xs pt-1"
                >
                  <span>🟠 Prověřit cenu na Heureka.cz</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Grounding sources if available */}
        {result.groundingSources && result.groundingSources.length > 0 && (
          <div className="mt-6 pt-4 border-t border-slate-800 text-xs">
            <span className="font-bold text-slate-400 block mb-2">Vyhledané zdroje na internetu:</span>
            <div className="flex flex-wrap gap-2">
              {result.groundingSources.map((src, i) => (
                <a
                  key={i}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1 bg-slate-900 border border-slate-700 hover:border-cyan-500 text-cyan-400 rounded-lg font-medium transition-colors"
                >
                  <span className="truncate max-w-[200px]">{src.title}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* EXPERT DIAGNOSTICS & AUDIT PANEL (Only visible in Expert Role Mode) */}
      {userRoleMode === 'expert' && (
        <div className="bg-slate-900/95 border-2 border-cyan-500/50 rounded-3xl p-5 sm:p-6 shadow-[0_0_25px_rgba(0,245,255,0.15)] my-6">
          <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-100 flex items-center gap-2">
                  <span>EXPERT DIAGNOSTIC & AUDIT LOG</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    ROLE: FAMILY EXPERT
                  </span>
                </h3>
                <p className="text-xs text-slate-400">Podrobný technický rozbor pro rodinného správce a bezpečnostního technika</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowExpertRawJson(!showExpertRawJson)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5"
            >
              <FileCode className="w-4 h-4" />
              <span>{showExpertRawJson ? 'Skrýt JSON' : 'Zobrazit raw JSON'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
              <span className="text-[11px] uppercase font-bold text-slate-400 block mb-1">Celkové skóre rizika</span>
              <div className="text-2xl font-black text-amber-400 flex items-center gap-2">
                <span>{result.confidenceScore ?? 85}%</span>
                <span className="text-xs font-mono font-normal text-slate-400">Risk Severity Rating</span>
              </div>
            </div>

            <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
              <span className="text-[11px] uppercase font-bold text-slate-400 block mb-1">Stav SSL certifikátu</span>
              <div className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4" />
                <span>{result.sslDomainInfo?.sslValid ? 'Platný SSL Let\'s Encrypt' : 'Nezjištěn / Nešifrováno'}</span>
              </div>
            </div>

            <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
              <span className="text-[11px] uppercase font-bold text-slate-400 block mb-1">Typ analyzované hrozby</span>
              <div className="text-sm font-bold text-cyan-400 truncate">
                {result.riskFactors?.[0]?.category || 'Manipulativní inzerce / Falešný e-shop'}
              </div>
            </div>
          </div>

          {/* Detailed Risk Factors Audit */}
          {result.riskFactors && result.riskFactors.length > 0 && (
            <div className="space-y-2 mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Identifikované vektory hrozeb:</span>
              <div className="grid grid-cols-1 gap-2">
                {result.riskFactors.map((rf, idx) => (
                  <div key={idx} className="bg-slate-950/90 border border-slate-800 p-3 rounded-xl flex items-start gap-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase shrink-0 mt-0.5 ${
                      rf.severity === 'VYSOKE' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}>
                      {rf.severity}
                    </span>
                    <div className="flex-1">
                      <div className="font-bold text-xs text-slate-200">{rf.title}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{rf.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raw JSON Debug Code Modal/Box */}
          {showExpertRawJson && (
            <div className="mt-4 bg-slate-950 p-4 rounded-2xl border border-cyan-500/30 overflow-x-auto text-xs font-mono text-cyan-300 max-h-80">
              <pre>{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      {/* Start Over, WhatsApp & Send to Son Bottom Actions */}
      <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={handleWhatsAppShare}
          className={`w-full sm:w-auto px-6 py-4 rounded-2xl font-black text-base shadow-xl transition-all flex items-center justify-center gap-2.5 border ${
            isCyber
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400/50 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
              : isContrast
              ? 'bg-yellow-400 text-black border-yellow-500'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500'
          }`}
        >
          <MessageCircle className="w-5 h-5 text-white" />
          <span>SDÍLET PŘES WHATSAPP</span>
        </button>

        <button
          type="button"
          onClick={onOpenSendToSon}
          className={`w-full sm:w-auto px-6 py-4 rounded-2xl font-black text-base shadow-xl transition-all flex items-center justify-center gap-2.5 border ${
            isCyber
              ? 'bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white border-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
              : 'bg-blue-600 text-white'
          }`}
        >
          <Send className="w-5 h-5" />
          <span>ODESLAT SYNOVI NA TELEFON</span>
        </button>

        <button
          type="button"
          onClick={onReset}
          className={`w-full sm:w-auto px-8 py-4 rounded-2xl font-black text-base shadow-xl transition-all inline-flex items-center justify-center gap-3 ${
            isCyber
              ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
              : isContrast
              ? 'bg-yellow-400 text-black'
              : 'bg-slate-900 text-white'
          }`}
        >
          <RotateCcw className="w-5 h-5" />
          <span>PROVĚŘIT DALŠÍ INZERÁT</span>
        </button>
      </div>
    </motion.div>
  );
};
