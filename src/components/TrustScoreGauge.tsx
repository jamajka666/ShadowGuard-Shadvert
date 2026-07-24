import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { ThemeMode } from '../types';

interface TrustScoreGaugeProps {
  score: number; // 0 - 100
  themeMode?: ThemeMode;
  fontSize?: 'normal' | 'large' | 'xlarge';
}

export const TrustScoreGauge: React.FC<TrustScoreGaugeProps> = ({
  score,
  themeMode = 'shadowguard',
}) => {
  const normalizedScore = Math.min(100, Math.max(0, score));

  // Determine safety level and colors
  let levelColor = '#10B981'; // Green
  let levelBgColor = 'rgba(16, 185, 129, 0.2)';
  let levelText = '🟢 BEZPEČNÝ INZERÁT';
  let badgeBorder = 'border-emerald-500/50';

  if (normalizedScore <= 40) {
    levelColor = '#F43F5E'; // Red / Rose
    levelBgColor = 'rgba(244, 63, 94, 0.2)';
    levelText = '🛑 VYSOKÉ RIZIKO PODVODU';
    badgeBorder = 'border-rose-500/50';
  } else if (normalizedScore <= 70) {
    levelColor = '#F59E0B'; // Yellow / Amber
    levelBgColor = 'rgba(245, 158, 11, 0.2)';
    levelText = '🟡 ZVÝŠENÁ OPATRNOST';
    badgeBorder = 'border-amber-500/50';
  }

  // Data segments for background gauge arc
  const backgroundSegments = [
    { name: 'Riziko (0-40)', value: 40, color: '#7F1D1D' },
    { name: 'Opatrnost (40-70)', value: 30, color: '#78350F' },
    { name: 'Bezpečí (70-100)', value: 30, color: '#064E3B' },
  ];

  // Active overlay value
  const gaugeData = [
    { name: 'Score', value: normalizedScore, color: levelColor },
    { name: 'Remaining', value: 100 - normalizedScore, color: 'transparent' },
  ];

  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl bg-[#1A1A1A] border-2 border-[#B8860B]/70 shadow-[0_0_20px_rgba(184,134,11,0.25)] text-slate-100 relative overflow-hidden my-4">
      <div className="text-center mb-1">
        <span className="text-xs sm:text-sm font-black tracking-widest uppercase text-[#00F5FF] block drop-shadow-[0_0_8px_rgba(0,245,255,0.6)]">
          Ukazatel skóre důvěryhodnosti
        </span>
        <h4 className="text-xs sm:text-sm font-semibold text-slate-300">
          Přehledný graf pro seniory a rodinné příslušníky
        </h4>
      </div>

      <div className="w-full max-w-[280px] sm:max-w-[320px] h-[160px] sm:h-[180px] relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
            {/* Background color segments */}
            <Pie
              data={backgroundSegments}
              cx="50%"
              cy="80%"
              startAngle={180}
              endAngle={0}
              innerRadius="68%"
              outerRadius="95%"
              paddingAngle={2}
              dataKey="value"
              isAnimationActive={false}
              stroke="#1A1A1A"
              strokeWidth={3}
            >
              {backgroundSegments.map((entry, index) => (
                <Cell key={`bg-cell-${index}`} fill={entry.color} opacity={0.7} />
              ))}
            </Pie>

            {/* Active score filled gauge */}
            <Pie
              data={gaugeData}
              cx="50%"
              cy="80%"
              startAngle={180}
              endAngle={0}
              innerRadius="72%"
              outerRadius="100%"
              paddingAngle={0}
              dataKey="value"
              isAnimationActive={true}
              animationDuration={1000}
              stroke="#1A1A1A"
              strokeWidth={2}
            >
              <Cell key="score-fill" fill={levelColor} />
              <Cell key="bg-fill" fill="rgba(255,255,255,0.05)" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center score readout overlay */}
        <div className="absolute bottom-1 left-0 right-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <div className="text-3xl sm:text-4xl font-black tracking-tight drop-shadow-md" style={{ color: levelColor }}>
            {normalizedScore} <span className="text-sm sm:text-base font-bold text-slate-400">/ 100</span>
          </div>
          <span
            className={`mt-1 px-3 py-1 rounded-full text-xs sm:text-sm font-black border shadow-md ${badgeBorder}`}
            style={{ backgroundColor: levelBgColor, color: levelColor }}
          >
            {levelText}
          </span>
        </div>
      </div>

      <div className="w-full flex justify-between items-center text-[11px] sm:text-xs font-bold text-slate-400 mt-2 px-4 border-t border-[#B8860B]/30 pt-2">
        <span className="text-rose-400">0 - Podvod</span>
        <span className="text-amber-400">40 - Opatrnost</span>
        <span className="text-emerald-400">100 - Bezpečno</span>
      </div>
    </div>
  );
};
