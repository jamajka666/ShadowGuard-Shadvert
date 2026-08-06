import React, { useCallback, useEffect, useState } from 'react';
import {
  RefreshCw,
  Shield,
  Smartphone,
  History,
  LogOut,
  Zap,
  Wifi,
  WifiOff,
  Clock,
  FolderOpen,
} from 'lucide-react';

interface DeviceRow {
  deviceId: string;
  label: string;
  appVersion?: string;
  lastSeen: number;
  online: boolean;
  recent?: boolean;
  status?: 'online' | 'recent' | 'offline';
  platform?: string;
  isBot?: boolean;
  ageMs?: number;
  userAgent?: string;
}

interface HistoryRow {
  id: string;
  timestamp: number;
  headline: string;
  safetyLevel: string;
  trustScore?: number;
  inputUrl?: string;
  deviceLabel: string;
  receivedAt: number;
}

interface ExportRow {
  fileName: string;
  bytes: number;
  mtime: number;
  deviceLabel?: string;
  deviceId?: string;
}

function formatAge(ms?: number): string {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return '?';
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h} h`;
  return `${Math.floor(h / 24)} d`;
}

export const AdminPanel: React.FC = () => {
  const [token, setToken] = useState(() => sessionStorage.getItem('sg_admin_token') || '');
  const [inputToken, setInputToken] = useState('');
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [exportsList, setExportsList] = useState<ExportRow[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [onlineWindowMs, setOnlineWindowMs] = useState(5 * 60 * 1000);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [hideBots, setHideBots] = useState(true);

  const authHeaders = useCallback(
    () => ({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    }),
    [token]
  );

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const q = hideBots ? '?hideBots=1' : '?hideBots=0';
      const [dRes, hRes, eRes] = await Promise.all([
        fetch(`/api/family/devices${q}`, { headers: authHeaders() }),
        fetch('/api/family/history', { headers: authHeaders() }),
        fetch('/api/family/exports', { headers: authHeaders() }),
      ]);
      if (!dRes.ok || !hRes.ok) {
        setError('Neplatný token nebo chyba serveru');
        setLoading(false);
        return;
      }
      const dData = await dRes.json();
      const hData = await hRes.json();
      setDevices(dData.devices || []);
      setOnlineCount(Number(dData.onlineCount || 0));
      setOnlineWindowMs(Number(dData.onlineWindowMs || 300000));
      setHistory(hData.history || []);
      if (eRes.ok) {
        const eData = await eRes.json();
        setExportsList(eData.exports || []);
      }
    } catch {
      setError('Nelze se připojit k serveru');
    } finally {
      setLoading(false);
    }
  }, [token, authHeaders, hideBots]);

  useEffect(() => {
    if (token) void load();
    const t = setInterval(() => {
      if (token) void load();
    }, 15000);
    return () => clearInterval(t);
  }, [token, load]);

  const login = () => {
    const t = inputToken.trim();
    if (!t) return;
    sessionStorage.setItem('sg_admin_token', t);
    setToken(t);
  };

  const logout = () => {
    sessionStorage.removeItem('sg_admin_token');
    setToken('');
    setDevices([]);
    setHistory([]);
    setExportsList([]);
  };

  const forceReload = async () => {
    if (!confirm('Vynutit obnovení aplikace na všech rodinných zařízeních?')) return;
    setMsg('');
    try {
      const res = await fetch('/api/family/force-reload', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        setError('Force reload selhal');
        return;
      }
      const data = await res.json();
      setMsg(
        `✅ Force reload nastaven (${new Date(data.forceReloadAt).toLocaleString('cs-CZ')}). Klienti se obnoví do ~45 s.`
      );
    } catch {
      setError('Síťová chyba');
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#0A0A0C] text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl border border-[#B8860B]/50 bg-[#121214] p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-8 h-8 text-[#D4A017]" />
            <div>
              <h1 className="text-xl font-black">ShadowGuard Admin</h1>
              <p className="text-xs text-slate-400">Remote správa rodinných zařízení</p>
            </div>
          </div>
          <label className="block text-sm font-bold text-slate-300 mb-2">ADMIN_TOKEN</label>
          <input
            type="password"
            value={inputToken}
            onChange={(e) => setInputToken(e.target.value)}
            className="w-full rounded-xl bg-black border border-slate-700 px-4 py-3 text-sm mb-4 focus:border-[#D4A017] outline-none"
            placeholder="Vlož admin token z .env.local"
            onKeyDown={(e) => e.key === 'Enter' && login()}
          />
          <button
            type="button"
            onClick={login}
            className="w-full py-3 rounded-xl font-black bg-gradient-to-r from-[#B8860B] to-[#D4AF37] text-black"
          >
            Přihlásit
          </button>
          <a href="/" className="block text-center text-xs text-cyan-400 mt-4 hover:underline">
            ← Zpět do aplikace
          </a>
        </div>
      </div>
    );
  }

  const onlineDevices = devices.filter((d) => d.online);
  const recentDevices = devices.filter((d) => d.recent);

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-slate-100">
      <header className="border-b border-[#CD7F32]/30 bg-[#121214] px-4 py-4">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#D4A017]" />
            <h1 className="font-black text-lg">Admin · Shadvert</h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 font-bold">
              online {onlineCount}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void load()}
              className="px-3 py-2 rounded-xl bg-slate-800 text-sm font-bold flex items-center gap-1.5"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Obnovit
            </button>
            <button
              type="button"
              onClick={() => void forceReload()}
              className="px-3 py-2 rounded-xl bg-rose-700 hover:bg-rose-600 text-sm font-bold flex items-center gap-1.5"
            >
              <Zap className="w-4 h-4" />
              Force update všech
            </button>
            <button
              type="button"
              onClick={logout}
              className="px-3 py-2 rounded-xl bg-slate-800 text-sm font-bold flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              Odhlásit
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-8">
        {error && <p className="text-rose-400 text-sm font-bold">{error}</p>}
        {msg && <p className="text-emerald-400 text-sm font-bold">{msg}</p>}

        <p className="text-xs text-slate-500 leading-relaxed">
          Online = heartbeat do {Math.round(onlineWindowMs / 60000)} min. Každé zařízení musí mít v appce
          vyplněný <strong className="text-slate-400">rodinný kód</strong> a vlastní název (Asus / Blackview /
          Tab). Stejný prohlížeč / nové okno = stejné ID, ne nová relace.
        </p>

        <section>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h2 className="font-black text-lg flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-cyan-400" />
              Zařízení ({devices.length}) · online {onlineDevices.length}
              {recentDevices.length > 0 && (
                <span className="text-sm font-bold text-amber-400/90">· nedávno {recentDevices.length}</span>
              )}
            </h2>
            <label className="text-xs text-slate-400 flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={hideBots}
                onChange={(e) => setHideBots(e.target.checked)}
                className="rounded"
              />
              Skrýt boty / crawlery
            </label>
          </div>
          {devices.length === 0 ? (
            <p className="text-slate-500 text-sm">
              Zatím žádný heartbeat. Na každém telefonu: Rodinné propojení → kód + název → Uložit a přihlásit k
              adminu.
            </p>
          ) : (
            <div className="space-y-2">
              {devices.map((d) => {
                const status = d.status || (d.online ? 'online' : 'offline');
                return (
                  <div
                    key={d.deviceId}
                    className={`rounded-2xl border p-4 flex flex-wrap items-center justify-between gap-2 ${
                      status === 'online'
                        ? 'border-emerald-800/60 bg-emerald-950/20'
                        : status === 'recent'
                          ? 'border-amber-900/40 bg-[#121214]'
                          : 'border-slate-800 bg-[#121214]'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="font-bold flex flex-wrap items-center gap-2">
                        {status === 'online' ? (
                          <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : status === 'recent' ? (
                          <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                        ) : (
                          <WifiOff className="w-4 h-4 text-slate-500 shrink-0" />
                        )}
                        <span className="truncate">{d.label || 'Bez názvu'}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full ${
                            status === 'online'
                              ? 'bg-emerald-950 text-emerald-400'
                              : status === 'recent'
                                ? 'bg-amber-950 text-amber-300'
                                : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {status === 'online' ? 'online' : status === 'recent' ? 'nedávno' : 'offline'}
                        </span>
                        {d.platform && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                            {d.platform}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        v{d.appVersion || '?'} · před {formatAge(d.ageMs)} ·{' '}
                        {new Date(d.lastSeen).toLocaleString('cs-CZ')} · {d.deviceId.slice(0, 8)}…
                      </p>
                      {d.userAgent && (
                        <p className="text-[10px] text-slate-600 mt-0.5 truncate max-w-xl" title={d.userAgent}>
                          {d.userAgent}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <h2 className="font-black text-lg mb-3 flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-sky-400" />
            Exporty v appce (data/exports)
          </h2>
          {exportsList.length === 0 ? (
            <p className="text-slate-500 text-sm">
              Zatím žádný soubor. Export CSV / JSON z appky se při rodinném kódu ukládá sem na Lenovo.
            </p>
          ) : (
            <div className="space-y-1.5">
              {exportsList.map((f) => (
                <div
                  key={f.fileName}
                  className="rounded-xl border border-slate-800 bg-[#121214] px-3 py-2 text-xs flex flex-wrap justify-between gap-2"
                >
                  <span className="font-mono text-slate-300 break-all">{f.fileName}</span>
                  <span className="text-slate-500">
                    {f.deviceLabel || '—'} · {Math.round(f.bytes / 1024)} kB ·{' '}
                    {new Date(f.mtime).toLocaleString('cs-CZ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="font-black text-lg mb-3 flex items-center gap-2">
            <History className="w-5 h-5 text-amber-400" />
            Synchronizované kontroly
          </h2>
          {history.length === 0 ? (
            <p className="text-slate-500 text-sm">Žádná historie. Na zařízení zapni sync a nastav FAMILY_CODE.</p>
          ) : (
            <div className="space-y-2">
              {history.map((h) => (
                <div key={h.id + h.receivedAt} className="rounded-2xl border border-slate-800 bg-[#121214] p-4">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        h.safetyLevel === 'PODVOD'
                          ? 'bg-rose-950 text-rose-400'
                          : h.safetyLevel === 'DUVERYHODNE'
                            ? 'bg-emerald-950 text-emerald-400'
                            : 'bg-amber-950 text-amber-400'
                      }`}
                    >
                      {h.safetyLevel}
                    </span>
                    <span className="text-xs text-slate-500">{h.deviceLabel}</span>
                    <span className="text-xs text-slate-600">{new Date(h.timestamp).toLocaleString('cs-CZ')}</span>
                  </div>
                  <p className="font-bold text-sm">{h.headline}</p>
                  {h.inputUrl && <p className="text-xs text-cyan-500/80 truncate mt-1">{h.inputUrl}</p>}
                </div>
              ))}
            </div>
          )}
        </section>

        <a href="/" className="inline-block text-sm text-cyan-400 hover:underline">
          ← Otevřít aplikaci
        </a>
      </main>
    </div>
  );
};
