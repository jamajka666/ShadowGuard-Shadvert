import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  RefreshCw,
  ShieldAlert,
  Globe,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ShieldCheck,
  Search,
  BellRing,
} from 'lucide-react';
import { ScamAlertItem, ScamAlertsResponse, ThemeMode } from '../types';

interface ScamAlertsSectionProps {
  themeMode?: ThemeMode;
  fontSize?: 'normal' | 'large' | 'xlarge';
  className?: string;
}

export const ScamAlertsSection: React.FC<ScamAlertsSectionProps> = ({
  themeMode = 'shadowguard',
  fontSize = 'large',
  className = '',
}) => {
  const [data, setData] = useState<ScamAlertsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const isCyber = themeMode === 'cyberpunk';
  const isContrast = themeMode === 'highContrast';

  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/scam-alerts');
      if (!response.ok) {
        throw new Error('Chyba při načítání aktuálních varování');
      }
      const json: ScamAlertsResponse = await response.json();
      setData(json);
      if (json.alerts && json.alerts.length > 0) {
        setExpandedId(json.alerts[0].id);
      }
    } catch (err: any) {
      console.error('Failed to fetch scam alerts:', err);
      setError('Nepodařilo se načíst živé zprávy o podvodech. Zkontrolujte připojení.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div
      className={`rounded-3xl p-6 sm:p-8 shadow-2xl border transition-all mb-8 ${
        isCyber
          ? 'bg-slate-950 border-rose-500/50 text-slate-100 cyber-card-glow'
          : isContrast
          ? 'bg-black border-yellow-400 text-white'
          : 'bg-[#121214] border-amber-500/60 text-slate-100 shadow-[0_0_35px_rgba(245,158,11,0.15)]'
      } ${className}`}
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div className="flex items-start gap-3">
          <div className="p-3 rounded-2xl bg-rose-950/60 border border-rose-500/50 text-rose-400 shrink-0 shadow-lg animate-pulse">
            <BellRing className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/50 text-rose-300 text-xs font-mono font-black uppercase">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Živá bezpečnostní hlídka ČR</span>
              </span>

              {data?.isLiveGrounding && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/50 text-[#00F5FF] text-xs font-mono font-bold">
                  <Search className="w-3 h-3 text-[#00F5FF]" />
                  <span>Google Search Grounding Active</span>
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Aktuální varování před podvody v ČR</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Aplikace vyhledává nejnovější hrozby, falešné e-shopy a podvodné triky na online bazarech v ČR přes živý vyhledávač Google.
            </p>
          </div>
        </div>

        {/* Action Button: Refresh */}
        <div className="shrink-0 self-start sm:self-auto flex items-center gap-2">
          <button
            type="button"
            onClick={fetchAlerts}
            disabled={loading}
            className={`text-xs font-black flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all shadow-md ${
              isCyber
                ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black'
                : isContrast
                ? 'bg-yellow-400 hover:bg-yellow-300 text-black font-black'
                : 'bg-gradient-to-r from-amber-500 to-amber-400 hover:brightness-110 text-black font-black'
            } disabled:opacity-50`}
            title="Vyhledat nejnovější hrozby přes Google Search Grounding"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Vyhledávám...' : 'Obnovit vyhledávání'}</span>
          </button>
        </div>
      </div>

      {/* Loading State Skeleton */}
      {loading && !data && (
        <div className="space-y-4 py-6">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse space-y-3">
            <div className="h-4 bg-slate-800 rounded w-1/3"></div>
            <div className="h-6 bg-slate-800 rounded w-3/4"></div>
            <div className="h-16 bg-slate-800/60 rounded w-full"></div>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse space-y-3">
            <div className="h-4 bg-slate-800 rounded w-1/4"></div>
            <div className="h-6 bg-slate-800 rounded w-2/3"></div>
            <div className="h-12 bg-slate-800/60 rounded w-full"></div>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800 text-rose-200 text-sm flex items-center gap-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Alerts Accordion List */}
      {data && data.alerts && data.alerts.length > 0 && (
        <div className="space-y-4">
          {data.alerts.map((alert: ScamAlertItem, index: number) => {
            const isExpanded = expandedId === alert.id;
            const isHighSeverity = alert.severity === 'VYSOKE';

            return (
              <div
                key={alert.id || index}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  isHighSeverity
                    ? 'bg-[#1A1A1E] border-rose-500/40 hover:border-rose-500/70'
                    : 'bg-[#1A1A1E] border-amber-500/40 hover:border-amber-500/70'
                }`}
              >
                {/* Header Toggle */}
                <button
                  type="button"
                  onClick={() => toggleExpand(alert.id)}
                  className="w-full text-left p-4 sm:p-5 flex items-start justify-between gap-4 focus:outline-none hover:bg-slate-900/40 transition-colors"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded ${
                          isHighSeverity
                            ? 'bg-rose-950 text-rose-300 border border-rose-500/50'
                            : 'bg-amber-950 text-amber-300 border border-amber-500/50'
                        }`}
                      >
                        {isHighSeverity ? '🚨 VYSOKÉ RIZIKO' : '⚠️ VAROVÁNÍ'}
                      </span>

                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        📂 {alert.riskCategory}
                      </span>

                      {alert.date && (
                        <span className="text-xs text-slate-400 font-mono">
                          {alert.date}
                        </span>
                      )}
                    </div>

                    <h3 className="font-black text-white text-base sm:text-lg leading-snug">
                      {alert.title}
                    </h3>
                  </div>

                  <div className="shrink-0 p-2 rounded-xl bg-slate-800/80 text-slate-300 mt-1">
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-[#00F5FF]" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 pt-0 border-t border-slate-800/80 space-y-4 text-slate-200">
                    {/* Summary */}
                    <div className="mt-3 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs sm:text-sm leading-relaxed text-slate-300">
                      <strong className="block text-white font-black mb-1">Popis podvodného postupu:</strong>
                      {alert.summary}
                    </div>

                    {/* How to Protect Yourself */}
                    <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/50 flex items-start gap-3">
                      <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="text-xs sm:text-sm">
                        <strong className="block text-emerald-300 font-bold mb-0.5">Doporučená ochrana:</strong>
                        <p className="text-emerald-100/90 font-medium">{alert.recommendedAction}</p>
                      </div>
                    </div>

                    {/* Source link if available */}
                    {alert.sourceTitle && (
                      <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                        <span className="font-medium text-slate-400">Zdroj: {alert.sourceTitle}</span>
                        {alert.sourceUrl && (
                          <a
                            href={alert.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[#00F5FF] hover:underline font-bold"
                          >
                            <span>Otevřít zprávu</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Google Search Grounding Sources Footer */}
      {data?.groundingSources && data.groundingSources.length > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Globe className="w-4 h-4 text-[#00F5FF]" />
            <span className="font-bold text-slate-300">
              Ověřené zdroje vyhledávání Google Search Grounding:
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.groundingSources.map((src, idx) => (
              <a
                key={idx}
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-[#00F5FF] transition-all text-xs font-medium"
              >
                <span className="truncate max-w-xs">{src.title}</span>
                <ExternalLink className="w-3 h-3 text-[#00F5FF] shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Footer info timestamp */}
      {data?.lastUpdated && (
        <div className="mt-4 text-right text-[11px] text-slate-500 font-mono">
          Poslední aktualizace hrozeb: {data.lastUpdated}
        </div>
      )}
    </div>
  );
};
