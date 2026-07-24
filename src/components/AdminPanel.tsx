import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Shield, Smartphone, History, LogOut, Zap, Wifi, WifiOff } from 'lucide-react';

interface DeviceRow {
  deviceId: string;
  label: string;
  appVersion?: string;
  lastSeen: number;
  online: boolean;
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

export const AdminPanel: React.FC = () => {
  const [token, setToken] = useState(() => sessionStorage.getItem('sg_admin_token') || '');
  const [inputToken, setInputToken] = useState('');
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

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
      const [dRes, hRes] = await Promise.all([
        fetch('/api/family/devices', { headers: authHeaders() }),
        fetch('/api/family/history', { headers: authHeaders() }),
      ]);
      if (!dRes.ok || !hRes.ok) {
        setError('Neplatný token nebo chyba serveru');
        setLoading(false);
        return;
      }
      const dData = await dRes.json();
      const hData = await hRes.json();
      setDevices(dData.devices || []);
      setHistory(hData.history || []);
    } catch {
      setError('Nelze se připojit k serveru');
    } finally {
      setLoading(false);
    }
  }, [token, authHeaders]);

  useEffect(() => {
    if (token) void load();
    const t = setInterval(() => {
      if (token) void load();
    }, 20000);
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
      setMsg(`✅ Force reload nastaven (${new Date(data.forceReloadAt).toLocaleString('cs-CZ')}). Klienti se obnoví do ~45 s.`);
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

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-slate-100">
      <header className="border-b border-[#CD7F32]/30 bg-[#121214] px-4 py-4">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#D4A017]" />
            <h1 className="font-black text-lg">Admin · Shadvert</h1>
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
            <button type="button" onClick={logout} className="px-3 py-2 rounded-xl bg-slate-800 text-sm font-bold flex items-center gap-1.5">
              <LogOut className="w-4 h-4" />
              Odhlásit
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-8">
        {error && <p className="text-rose-400 text-sm font-bold">{error}</p>}
        {msg && <p className="text-emerald-400 text-sm font-bold">{msg}</p>}

        <section>
          <h2 className="font-black text-lg mb-3 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-cyan-400" />
            Zařízení ({devices.length})
          </h2>
          {devices.length === 0 ? (
            <p className="text-slate-500 text-sm">Zatím žádný heartbeat. Otevři appku na tabletu s rodinným kódem.</p>
          ) : (
            <div className="space-y-2">
              {devices.map((d) => (
                <div
                  key={d.deviceId}
                  className="rounded-2xl border border-slate-800 bg-[#121214] p-4 flex flex-wrap items-center justify-between gap-2"
                >
                  <div>
                    <p className="font-bold flex items-center gap-2">
                      {d.online ? (
                        <Wifi className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <WifiOff className="w-4 h-4 text-slate-500" />
                      )}
                      {d.label}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${d.online ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                        {d.online ? 'online' : 'offline'}
                      </span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      v{d.appVersion || '?'} · {new Date(d.lastSeen).toLocaleString('cs-CZ')} · {d.deviceId.slice(0, 8)}…
                    </p>
                  </div>
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
