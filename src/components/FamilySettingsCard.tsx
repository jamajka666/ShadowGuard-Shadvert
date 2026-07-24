import React, { useState, useEffect } from 'react';
import { Users, Save } from 'lucide-react';
import {
  getDeviceLabel,
  setDeviceLabel,
  getFamilyCode,
  setFamilyCode,
  isHistorySyncEnabled,
  setHistorySyncEnabled,
} from '../hooks/useFamilySync';

export const FamilySettingsCard: React.FC = () => {
  const [label, setLabel] = useState('');
  const [code, setCode] = useState('');
  const [sync, setSync] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLabel(getDeviceLabel());
    setCode(getFamilyCode());
    setSync(isHistorySyncEnabled());
  }, []);

  const save = () => {
    setDeviceLabel(label.trim() || 'Zařízení rodiny');
    setFamilyCode(code.trim());
    setHistorySyncEnabled(sync);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="rounded-3xl border border-[#B8860B]/40 bg-[#121214] p-5 sm:p-6 shadow-xl mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 rounded-xl bg-[#1C1C1E] border border-cyan-500/30 text-cyan-400">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-black text-white text-base">Rodinné propojení</h3>
          <p className="text-xs text-slate-400">Název zařízení + kód pro sync historie k synovi (admin)</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-bold text-slate-400 block mb-1">Název zařízení (např. Táta tablet)</label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full rounded-xl bg-black/60 border border-slate-700 px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4A017]"
            placeholder="Táta tablet"
          />
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
          onClick={save}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold bg-gradient-to-r from-[#B8860B] to-[#D4AF37] text-black flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saved ? 'Uloženo ✓' : 'Uložit nastavení'}
        </button>
      </div>
    </div>
  );
};
