import React, { useMemo } from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, Sparkles, TrendingUp, Calendar } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { AdCheckResult, ThemeMode } from '../types';

interface UserSafetyScoreWidgetProps {
  history: AdCheckResult[];
  themeMode?: ThemeMode;
  className?: string;
}

export const UserSafetyScoreWidget: React.FC<UserSafetyScoreWidgetProps> = ({
  history,
  themeMode = 'shadowguard',
  className = '',
}) => {
  const isCyber = themeMode === 'cyberpunk';
  const isContrast = themeMode === 'highContrast';

  // Filter history for the last 7 days
  const lastWeekStats = useMemo(() => {
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    const recentHistory = history.filter(
      (item) => now - new Date(item.timestamp).getTime() <= SEVEN_DAYS_MS
    );

    const countToUse = recentHistory.length > 0 ? recentHistory : history;
    const isUsingAllTime = recentHistory.length === 0 && history.length > 0;

    let safeCount = 0;
    let cautionCount = 0;
    let scamCount = 0;
    let totalScoreSum = 0;

    countToUse.forEach((item) => {
      totalScoreSum += item.trustScore || 50;
      if (item.safetyLevel === 'PODVOD') {
        scamCount++;
      } else if (item.safetyLevel === 'OPATRNOSTI') {
        cautionCount++;
      } else {
        safeCount++;
      }
    });

    const total = countToUse.length;

    // Safety score calculation (0 to 100%)
    let safetyScore = 100;
    if (total > 0) {
      // Weighted score or ratio of safe vs suspicious
      const avgTrustScore = Math.round(totalScoreSum / total);
      safetyScore = avgTrustScore;
    }

    return {
      recentCount: recentHistory.length,
      totalAnalyzed: total,
      isUsingAllTime,
      safeCount,
      cautionCount,
      scamCount,
      safetyScore,
    };
  }, [history]);

  const chartData = useMemo(() => {
    if (lastWeekStats.totalAnalyzed === 0) {
      return [
        { name: 'Bezpečné', value: 1, color: '#10B981' },
      ];
    }

    const data = [
      { name: 'Bezpečné inzeráty', value: lastWeekStats.safeCount, color: '#10B981' },
      { name: 'Vyžadující opatrnost', value: lastWeekStats.cautionCount, color: '#F59E0B' },
      { name: 'Zachycené podvody', value: lastWeekStats.scamCount, color: '#F43F5E' },
    ];

    return data.filter((d) => d.value > 0);
  }, [lastWeekStats]);

  // Determine badge color for score
  const scoreColor =
    lastWeekStats.safetyScore >= 75
      ? 'text-emerald-400'
      : lastWeekStats.safetyScore >= 50
      ? 'text-amber-400'
      : 'text-rose-400';

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-[#18181B] border border-amber-500/60 px-3 py-2 rounded-xl shadow-xl text-xs space-y-1 text-slate-100 font-sans">
          <p className="font-bold flex items-center gap-1.5" style={{ color: data.payload.color }}>
            <span>{data.name}:</span>
            <span className="font-mono font-black">{data.value}x</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className={`rounded-3xl p-5 sm:p-6 border shadow-xl relative overflow-hidden transition-all ${
        isCyber
          ? 'bg-slate-950 border-cyan-500/40 text-slate-100 shadow-[0_0_25px_rgba(6,182,212,0.15)]'
          : isContrast
          ? 'bg-black border-yellow-400 text-white'
          : 'bg-[#121214] border-[#B8860B]/50 text-slate-100 shadow-[0_0_25px_rgba(184,134,11,0.15)]'
      } ${className}`}
    >
      {/* Background Subtle Gradient Glow */}
      <div className="absolute -right-12 -bottom-12 w-48 h-48 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-[#1C1C1E] border border-slate-800 text-emerald-400">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-white leading-tight">
              Týdenní Skóre Bezpečí
            </h3>
            <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
              <Calendar className="w-3 h-3 text-[#00F5FF]" />
              <span>
                {lastWeekStats.recentCount > 0
                  ? 'Posledních 7 dní'
                  : lastWeekStats.totalAnalyzed > 0
                  ? 'Celková historie'
                  : 'Výchozí stav štítu'}
              </span>
            </span>
          </div>
        </div>

        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono font-bold">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className={scoreColor}>Index {lastWeekStats.safetyScore}%</span>
        </div>
      </div>

      {/* Content Layout: Chart + Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
        {/* Recharts Pie Donut Chart */}
        <div className="sm:col-span-5 h-32 sm:h-36 relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<CustomTooltip />} />
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={36}
                outerRadius={52}
                paddingAngle={3}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#121214" strokeWidth={2} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Center score label inside donut */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className={`text-xl font-black font-mono leading-none ${scoreColor}`}>
              {lastWeekStats.safetyScore}%
            </span>
            <span className="text-[9px] uppercase font-bold text-slate-400 mt-0.5">
              Bezpečí
            </span>
          </div>
        </div>

        {/* Right Stats Summary */}
        <div className="sm:col-span-7 space-y-2 text-xs">
          <div className="flex items-center justify-between p-2 rounded-xl bg-[#1C1C1E] border border-slate-800">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#00F5FF]" />
              <span>Prověřeno tento týden:</span>
            </span>
            <span className="font-bold text-white font-mono">
              {lastWeekStats.recentCount > 0 ? `${lastWeekStats.recentCount} inzerátů` : '0 inzerátů'}
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-950/30 border border-emerald-900/50">
            <span className="text-emerald-300 font-medium flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Bezpečné nabídky:</span>
            </span>
            <span className="font-bold text-emerald-300 font-mono">
              {lastWeekStats.safeCount}x
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-rose-950/30 border border-rose-900/50">
            <span className="text-rose-300 font-medium flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>Detekované podvody:</span>
            </span>
            <span className="font-bold text-rose-300 font-mono">
              {lastWeekStats.scamCount + lastWeekStats.cautionCount}x
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
