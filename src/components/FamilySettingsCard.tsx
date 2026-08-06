import React, { useState, useEffect } from 'react';
import { Users, Save } from 'lucide-react';
import {
  getDeviceLabel,
  setDeviceLabel,
  getFamilyCode,
  setFamilyCode,
  isHistorySyncEnabled,
  setHistorySyncEnabled,
  sendFamilyHeartbeat,
  suggestDeviceLabelFromUa,
  getDeviceId,
} from '../hooks/useFamilySync';

export const FamilySettingsCard: React.FC = () => {
  const suggested = suggestDeviceLabelFromUa();
  const [label, setLabel] = useState('');
  const [code, setCode] = useState('');
  const [sync, setSync] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hbMsg, setHbMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const current = getDeviceLabel();
    // Auto-fill better default once if still generic
    if (!current || current === 'Zařízení rodiny') {
      setLabel(suggested);
    } else {
      setLabel(current);
    }
    setCode(getFamilyCode());
    setSync(isHistorySyncEnabled());
  }, [suggested]);

  const save = async () => {
    setSaving(true);
    setHbMsg(null);
    const finalLabel = label.trim() || suggested || 'Zařízení rodiny';
    setDeviceLabel(finalLabel);
    setFamilyCode(code.trim());
    setHistorySyncEnabled(sync);

    const result = await sendFamilyHeartbeat({
      label: finalLabel,
      familyCode: code.trim(),
    });

    setSaved(true);
    if (result.ok === true) {
      setHbMsg(
        `Online v adminu jako „${finalLabel}“ (id ${getDeviceId().slice(0, 8)}…). Heartbeat OK.`
      );
    } else {
      setHbMsg(`Uloženo lokálně, ale server: ${result.ok === false ? result.error : 'neznámá chyba'}`);
    }
    setSaving(false);
    setTimeout(() => setSaved(false), 4000);
  };

  return (
    <div className="rounded-3xl border border-[#B8860B]/40 bg-[#121214] p-5 sm:p-6 shadow-xl mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 rounded-xl bg-[#1C1C1E] border border-cyan-500/30 text-cyan-400">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-black text-white text-base">Rodinné propojení</h3>
          <p className="text-xs text-slate-400">
            Název (Asus / Blackview / Tab) + rodinný kód — bez kódu vás admin neuvidí online
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-bold text-slate-400 block mb-1">
            Název zařízení (např. Asus, Blackview, Tab)
          </label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full rounded-xl bg-black/60 border border-slate-700 px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4A017]"
            placeholder={suggested || 'Asus'}
          />
          {suggested && label !== suggested && (
            <button
              type="button"
              className="text-[11px] text-cyan-400 mt-1 hover:underline"
              onClick={() => setLabel(suggested)}
            >
              Navrhovaný název: {suggested}
            </button>
          )}
        </div>
        <div>
          <label className="text-xs font-bold text-slate-400 block mb-1">Rodinný kód (FAMILY_CODE)</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full rounded-xl bg-black/60 border border-slate-700 px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4A017] font-mono"
            placeholder="Kód od syna"
            autoComplete="off"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
          <input type="checkbox" checked={sync} onChange={(e) => setSync(e.target.checked)} className="rounded" />
          Odesílat výsledky kontrol na rodinný server (pro remote přehled)
        </label>
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold bg-gradient-to-r from-[#B8860B] to-[#D4AF37] text-black flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Ukládám…' : saved ? 'Uloženo ✓' : 'Uložit a přihlásit k adminu'}
        </button>
        {hbMsg && (
          <p
            className={`text-xs rounded-xl px-3 py-2 border ${
              hbMsg.includes('OK')
                ? 'text-emerald-300 border-emerald-800/50 bg-emerald-950/40'
                : 'text-amber-200 border-amber-800/50 bg-amber-950/30'
            }`}
          >
            {hbMsg}
          </p>
        )}
        <p className="text-[11px] text-slate-500 leading-snug">
          Pozn.: Nové okno ve stejném prohlížeči = stejné zařízení (stejné ID). Asus a Blackview musí mít
          každý svůj kód + vlastní název v této kartě.
        </p>
      </div>
    </div>
  );
};
