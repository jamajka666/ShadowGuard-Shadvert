import React from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Globe,
  Lock,
  Unlock,
  Calendar,
  Building,
  Server,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Info,
  Clock,
} from 'lucide-react';
import { SSLDomainInfo, ThemeMode } from '../types';

interface SslDomainCardProps {
  info?: SSLDomainInfo;
  themeMode?: ThemeMode;
  uiMode?: 'senior' | 'cyber' | 'contrast' | 'shadowguard';
  fontSize: 'normal' | 'large' | 'xlarge';
}

export const SslDomainCard: React.FC<SslDomainCardProps> = ({
  info,
  themeMode,
  uiMode,
  fontSize,
}) => {
  if (!info || !info.domain) {
    return null;
  }

  const isShadowGuard = themeMode === 'shadowguard' || uiMode === 'shadowguard';
  const isCyber = themeMode === 'cyberpunk' || uiMode === 'cyber';
  const isContrast = themeMode === 'highContrast' || uiMode === 'contrast';

  const isSslOk = info.isSslValid;
  const hasWarnings = info.warnings && info.warnings.length > 0;
  const isNewDomain = info.domainAgeYears !== undefined && info.domainAgeYears < 0.25; // less than ~3 months

  return (
    <div
      className={`rounded-3xl p-6 sm:p-8 border-2 shadow-2xl my-6 transition-all ${
        !isSslOk || isNewDomain
          ? isShadowGuard || isCyber
            ? 'bg-[#121214] border-rose-500/80 text-rose-100 shadow-[0_0_35px_rgba(244,63,94,0.25)]'
            : isContrast
            ? 'bg-black border-yellow-400 text-white'
            : 'bg-rose-50/90 border-rose-300 text-slate-900'
          : isShadowGuard
          ? 'bg-[#121214] border-[#CD7F32]/80 text-slate-100 shadow-[0_0_25px_rgba(212,160,23,0.2)] shadowguard-bronze-border'
          : isCyber
          ? 'bg-slate-950 border-cyan-500/50 text-slate-100 shadow-[0_0_25px_rgba(6,182,212,0.15)]'
          : isContrast
          ? 'bg-black border-yellow-400 text-white'
          : 'bg-white border-slate-200 text-slate-900'
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-700/60">
        <div className="flex items-center gap-3">
          <div
            className={`p-3 rounded-2xl ${
              isSslOk
                ? 'bg-emerald-600 text-white'
                : 'bg-rose-600 text-white animate-pulse'
            }`}
          >
            {isSslOk ? <Lock className="w-7 h-7" /> : <Unlock className="w-7 h-7" />}
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
              <span>Prověrka SSL certifikátu & Domény</span>
              <Sparkles className="w-5 h-5 text-amber-400 inline" />
            </h3>
            <p className={`text-xs sm:text-sm font-medium ${isCyber ? 'text-cyan-300/80' : 'text-slate-500'}`}>
              Doména: <strong className="text-amber-400 font-mono text-base">{info.domain}</strong>
            </p>
          </div>
        </div>

        {/* SSL Status Badge */}
        <div
          className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-black border uppercase tracking-wider flex items-center gap-2 self-start sm:self-auto ${
            isSslOk
              ? isCyber
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                : 'bg-emerald-600 text-white'
              : 'bg-rose-600 text-white animate-pulse'
          }`}
        >
          {isSslOk ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Platný SSL šifrovaný spoj (HTTPS)</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4" />
              <span>Chybějící / Neplatný SSL certifikát</span>
            </>
          )}
        </div>
      </div>

      {/* Grid of Domain & SSL Properties */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {/* SSL Issuer */}
        <div
          className={`p-4 rounded-2xl border ${
            isCyber
              ? 'bg-slate-900/80 border-slate-800'
              : isContrast
              ? 'bg-black border-yellow-400'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Lock className="w-4 h-4 text-cyan-400" />
            <span>Vydavatel SSL:</span>
          </div>
          <div className="font-bold text-sm sm:text-base text-slate-100 truncate">
            {info.sslIssuer || 'Neznámý'}
          </div>
          {info.sslValidTo && (
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>Platnost do: {info.sslValidTo} ({info.sslDaysRemaining ?? 0} dní)</span>
            </div>
          )}
        </div>

        {/* Domain Age */}
        <div
          className={`p-4 rounded-2xl border ${
            isNewDomain
              ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
              : isCyber
              ? 'bg-slate-900/80 border-slate-800'
              : isContrast
              ? 'bg-black border-yellow-400'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>Stáří domény:</span>
          </div>
          <div className="font-black text-sm sm:text-base text-slate-100">
            {info.domainAgeText || (info.domainAgeYears ? `${info.domainAgeYears} let` : 'Nezjištěno')}
          </div>
          {info.creationDate && (
            <div className="text-[11px] text-slate-400 mt-1">
              Registrovala: {info.creationDate}
            </div>
          )}
        </div>

        {/* Registrar */}
        <div
          className={`p-4 rounded-2xl border ${
            isCyber
              ? 'bg-slate-900/80 border-slate-800'
              : isContrast
              ? 'bg-black border-yellow-400'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Building className="w-4 h-4 text-amber-400" />
            <span>Registrátor:</span>
          </div>
          <div className="font-bold text-sm sm:text-base text-slate-100 truncate">
            {info.registrar || 'Ověřený registrátor'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Protokol: {info.sslProtocol || 'TLS 1.3 / HTTPS'}
          </div>
        </div>

        {/* Server IP & Location */}
        <div
          className={`p-4 rounded-2xl border ${
            isCyber
              ? 'bg-slate-900/80 border-slate-800'
              : isContrast
              ? 'bg-black border-yellow-400'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Server className="w-4 h-4 text-purple-400" />
            <span>Server IP & Lokalita:</span>
          </div>
          <div className="font-mono font-bold text-sm sm:text-base text-slate-100 truncate">
            {info.ipAddress || 'Zjišťuje se...'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Země: {info.country || 'EU / Česká republika'}
          </div>
        </div>
      </div>

      {/* Warnings & Risk Notices */}
      {hasWarnings && (
        <div className="mt-5 space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            🚨 Varovné signály domény a SSL:
          </span>
          <div className="space-y-2">
            {info.warnings?.map((warn, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-rose-950/50 border border-rose-500/50 text-rose-200 text-xs sm:text-sm font-bold flex items-start gap-2.5"
              >
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <span>{warn}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Senior advice box */}
      <div className="mt-5 p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-200 text-xs sm:text-sm space-y-1">
        <div className="flex items-center gap-2 font-black text-cyan-300">
          <Info className="w-4 h-4" />
          <span>💡 Co znamená platný SSL certifikát?</span>
        </div>
        <p>
          SSL certifikát (zámeček v adrese HTTPS) garantuje, že vaše hesla a údaje z karty jdou přímo na server.
          <strong> Všimněte si ale stáří domény:</strong> Podvodné e-shopy mohou mít zámek HTTPS, ale doména bývá založena teprve před pár dny!
        </p>
      </div>
    </div>
  );
};
