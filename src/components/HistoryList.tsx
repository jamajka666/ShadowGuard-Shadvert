import React, { useState, useMemo } from 'react';
import {
  History,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Trash2,
  ArrowRight,
  FileSpreadsheet,
  BarChart3,
  PieChart as PieChartIcon,
  ChevronDown,
  ChevronUp,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { AdCheckResult } from '../types';
import { exportHistoryToCsv } from '../utils/csvExport';

interface HistoryListProps {
  history: AdCheckResult[];
  onSelectResult: (item: AdCheckResult) => void;
  onClearHistory: () => void;
  fontSize: 'normal' | 'large' | 'xlarge';
  highContrast: boolean;
  themeMode?: 'senior' | 'cyber' | 'contrast';
}

/**
 * Helper function to infer advertisement category based on text content and domain
 */
export function inferCategory(item: AdCheckResult): string {
  if (item.category) return item.category;

  const text = `${item.headline || ''} ${item.inputSnippet || ''} ${item.inputUrl || ''} ${
    item.urlAnalysis?.domainName || ''
  }`.toLowerCase();

  if (
    text.includes('auto') ||
    text.includes('vůz') ||
    text.includes('vozidlo') ||
    text.includes('octavia') ||
    text.includes('škoda') ||
    text.includes('bmw') ||
    text.includes('audi') ||
    text.includes('pneu') ||
    text.includes('moto')
  ) {
    return 'Auto-moto';
  }
  if (
    text.includes('iphone') ||
    text.includes('samsung') ||
    text.includes('mobil') ||
    text.includes('telefon') ||
    text.includes('notebook') ||
    text.includes('pc') ||
    text.includes('ps5') ||
    text.includes('tv') ||
    text.includes('elektro') ||
    text.includes('macbook')
  ) {
    return 'Elektronika';
  }
  if (
    text.includes('invest') ||
    text.includes('čez') ||
    text.includes('vklad') ||
    text.includes('zisk') ||
    text.includes('půjčk') ||
    text.includes('banka') ||
    text.includes('krypto')
  ) {
    return 'Finance & Investice';
  }
  if (
    text.includes('kurýr') ||
    text.includes('dpd') ||
    text.includes('zásilkovna') ||
    text.includes('doprava') ||
    text.includes('platba kartou') ||
    text.includes('pošta')
  ) {
    return 'Falešné Platby & Kurýři';
  }
  if (
    text.includes('eshop') ||
    text.includes('e-shop') ||
    text.includes('sleva') ||
    text.includes('výprodej') ||
    text.includes('nike') ||
    text.includes('boty') ||
    text.includes('oblečení') ||
    text.includes('store')
  ) {
    return 'E-shopy & Móda';
  }
  if (
    text.includes('stůl') ||
    text.includes('nábytek') ||
    text.includes('dům') ||
    text.includes('byt') ||
    text.includes('pes') ||
    text.includes('kolo')
  ) {
    return 'Bazar & Nábytek';
  }
  return 'Ostatní inzerce';
}

export const HistoryList: React.FC<HistoryListProps> = ({
  history,
  onSelectResult,
  onClearHistory,
  fontSize,
  highContrast,
  themeMode = 'senior',
}) => {
  const [showChart, setShowChart] = useState(true);
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');

  if (history.length === 0) return null;

  const isCyber = themeMode === 'cyber';
  const isContrast = themeMode === 'contrast' || highContrast;

  // Aggregate stats per category
  const categoryStats = useMemo(() => {
    const map: Record<
      string,
      { category: string; podvod: number; opatrnost: number; duveryhodne: number; total: number }
    > = {};

    history.forEach((item) => {
      const cat = inferCategory(item);
      if (!map[cat]) {
        map[cat] = { category: cat, podvod: 0, opatrnost: 0, duveryhodne: 0, total: 0 };
      }
      map[cat].total += 1;
      if (item.safetyLevel === 'PODVOD') {
        map[cat].podvod += 1;
      } else if (item.safetyLevel === 'OPATRNOSTI') {
        map[cat].opatrnost += 1;
      } else {
        map[cat].duveryhodne += 1;
      }
    });

    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [history]);

  // Overall pie data
  const pieData = useMemo(() => {
    let podvod = 0;
    let opatrnost = 0;
    let duveryhodne = 0;

    history.forEach((item) => {
      if (item.safetyLevel === 'PODVOD') podvod++;
      else if (item.safetyLevel === 'OPATRNOSTI') opatrnost++;
      else duveryhodne++;
    });

    return [
      { name: 'Podvody (Rizikové)', value: podvod, color: '#F43F5E' },
      { name: 'Opatrnost vyžadována', value: opatrnost, color: '#F59E0B' },
      { name: 'Důvěryhodné inzeráty', value: duveryhodne, color: '#10B981' },
    ].filter((d) => d.value > 0);
  }, [history]);

  const totalPodvody = useMemo(() => {
    return history.filter((i) => i.safetyLevel === 'PODVOD').length;
  }, [history]);

  const totalOpatrnost = useMemo(() => {
    return history.filter((i) => i.safetyLevel === 'OPATRNOSTI').length;
  }, [history]);

  // Custom Recharts Tooltip Component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#18181B] border border-amber-500/60 p-3.5 rounded-xl shadow-xl text-xs space-y-1 z-50 text-slate-100 font-sans">
          <p className="font-bold text-[#00F5FF] border-b border-slate-700 pb-1 mb-1.5">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} className="flex items-center justify-between gap-3 font-semibold">
              <span style={{ color: entry.color }}>{entry.name}:</span>
              <span className="font-mono font-bold text-white">{entry.value}x</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className={`rounded-3xl p-6 sm:p-8 shadow-2xl border my-8 transition-all ${
        isCyber
          ? 'bg-slate-950 border-cyan-500/60 text-slate-100 cyber-card-glow'
          : isContrast
          ? 'bg-black border-yellow-400 text-white'
          : 'bg-[#121214] border-[#B8860B]/60 text-slate-100 shadowguard-bronze-border'
      }`}
    >
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-700/50">
        <div>
          <h2 className="text-xl sm:text-2xl font-black flex items-center gap-2">
            <History className={`w-6 h-6 ${isCyber ? 'text-cyan-400' : 'text-[#00F5FF]'}`} />
            <span>Historie a Analýza Kategorií ({history.length})</span>
          </h2>
          <p className={`text-xs sm:text-sm mt-1 ${isCyber ? 'text-cyan-300/80' : 'text-slate-400'}`}>
            Statistický přehled výskytu podezřelých nabídek podle kategorií zboží.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => setShowChart(!showChart)}
            className={`text-xs font-bold flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all ${
              showChart
                ? 'bg-[#00F5FF]/20 text-[#00F5FF] border-[#00F5FF]/60'
                : 'bg-[#1C1C1E] text-slate-300 border-slate-800 hover:text-white'
            }`}
            title="Přepnout zobrazení grafu kategorií"
          >
            <BarChart3 className="w-4 h-4 text-[#00F5FF]" />
            <span>{showChart ? 'Skrýt graf' : 'Graf kategorií'}</span>
            {showChart ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => exportHistoryToCsv(history)}
            className={`text-xs font-bold flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all shadow-sm ${
              isCyber
                ? 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 cyber-button-glow'
                : isContrast
                ? 'bg-yellow-400 text-black font-black border border-yellow-500'
                : 'bg-[#B8860B] hover:bg-[#D4AF37] text-black font-black border border-[#D4AF37]'
            }`}
            title="Stáhnout kompletní historii v tabulkovém formátu CSV"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={onClearHistory}
            className={`text-xs font-bold flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-colors ${
              isCyber
                ? 'text-rose-400 hover:bg-rose-950/40 border-rose-500/40'
                : isContrast
                ? 'text-red-400 hover:bg-slate-900 border-red-500/50'
                : 'text-rose-400 hover:text-rose-300 border-rose-500/40 hover:bg-rose-950/30'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>Smazat</span>
          </button>
        </div>
      </div>

      {/* Category Chart Section */}
      {showChart && (
        <div className="mb-8 p-4 sm:p-6 rounded-2xl bg-[#1C1C1E]/90 border border-slate-800 shadow-inner">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm sm:text-base font-black text-white">
                Četnost podezřelých nabídek v kategoriích
              </h3>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setChartType('bar')}
                className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                  chartType === 'bar'
                    ? 'bg-[#B8860B] text-black font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Sloupce</span>
              </button>
              <button
                type="button"
                onClick={() => setChartType('pie')}
                className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                  chartType === 'pie'
                    ? 'bg-[#B8860B] text-black font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <PieChartIcon className="w-3.5 h-3.5" />
                <span>Podíl rizika</span>
              </button>
            </div>
          </div>

          {/* Key Metric Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-400">Celkem prověřeno</span>
                <span className="text-xl font-black text-white">{history.length} inzerátů</span>
              </div>
              <Sparkles className="w-6 h-6 text-[#00F5FF] opacity-80" />
            </div>

            <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-900/50 flex items-center justify-between">
              <div>
                <span className="block text-[10px] uppercase font-bold text-rose-400">Podvodné inzeráty</span>
                <span className="text-xl font-black text-rose-400">{totalPodvody} položek</span>
              </div>
              <ShieldAlert className="w-6 h-6 text-rose-500 shrink-0" />
            </div>

            <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-900/50 flex items-center justify-between">
              <div>
                <span className="block text-[10px] uppercase font-bold text-amber-400">Rizikové (Opatrnost)</span>
                <span className="text-xl font-black text-amber-400">{totalOpatrnost} položek</span>
              </div>
              <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
            </div>
          </div>

          {/* Recharts Container */}
          <div className="w-full h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
                <BarChart data={categoryStats} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
                  <XAxis
                    dataKey="category"
                    stroke="#A1A1AA"
                    fontSize={11}
                    tickLine={false}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis stroke="#A1A1AA" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ paddingTop: '15px', fontSize: '12px' }}
                    formatter={(value) => <span className="text-slate-200 font-bold">{value}</span>}
                  />
                  <Bar dataKey="podvod" name="Podvodné (Vysoké riziko)" fill="#F43F5E" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="opatrnost" name="Opatrnost vyžadována" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="duveryhodne" name="Důvěryhodné" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <PieChart>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
                    formatter={(value) => <span className="text-slate-200 font-bold">{value}</span>}
                  />
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#18181B" strokeWidth={2} />
                    ))}
                  </Pie>
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* History Items List */}
      <div className="space-y-3">
        {history.map((item) => {
          const isScam = item.safetyLevel === 'PODVOD';
          const isCaution = item.safetyLevel === 'OPATRNOSTI';
          const catName = inferCategory(item);

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectResult(item)}
              className={`w-full text-left p-4 rounded-2xl border transition-all hover:shadow-md flex items-center justify-between gap-4 ${
                highContrast
                  ? 'bg-slate-900 border-slate-700 hover:border-yellow-400 text-white'
                  : 'bg-[#1C1C1E] hover:bg-[#252528] border-[#B8860B]/40 hover:border-[#00F5FF] text-slate-100'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="shrink-0">
                  {isScam ? (
                    <ShieldAlert className="w-7 h-7 text-rose-500" />
                  ) : isCaution ? (
                    <AlertTriangle className="w-7 h-7 text-amber-400" />
                  ) : (
                    <ShieldCheck className="w-7 h-7 text-emerald-400" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded ${
                        isScam
                          ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                          : isCaution
                          ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {isScam ? 'PODVOD' : isCaution ? 'OPATRNOST' : 'DŮVĚRYHODNÉ'}
                    </span>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      📂 {catName}
                    </span>

                    <span className="text-xs text-slate-400">
                      {new Date(item.timestamp).toLocaleDateString('cs-CZ')}
                    </span>
                  </div>

                  <h4 className="font-bold text-white truncate text-sm sm:text-base">
                    {item.headline}
                  </h4>
                  <p className="text-xs text-slate-400 truncate font-mono">
                    {item.inputUrl || item.urlAnalysis?.domainName || item.inputSnippet || 'Zadaný inzerát'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 text-slate-400">
                <span className="text-xs font-bold text-slate-300 hidden sm:inline">
                  Detail
                </span>
                <ArrowRight className="w-5 h-5 text-[#00F5FF]" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
