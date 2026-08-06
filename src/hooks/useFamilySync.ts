import { useEffect, useCallback, useRef, useState } from 'react';
import { AdCheckResult } from '../types';

const DEVICE_ID_KEY = 'sg_device_id';
const DEVICE_LABEL_KEY = 'sg_device_label';
const FAMILY_CODE_KEY = 'sg_family_code';
const LAST_RELOAD_KEY = 'sg_last_force_reload';
const SYNC_HISTORY_KEY = 'sg_sync_history_enabled';

export const APP_VERSION = '1.0.0';

/** How often clients ping admin presence (ms). */
export const HEARTBEAT_INTERVAL_MS = 30_000;

function uuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'dev-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function getDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = uuid();
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return uuid();
  }
}

export function getDeviceLabel(): string {
  try {
    return localStorage.getItem(DEVICE_LABEL_KEY) || 'Zařízení rodiny';
  } catch {
    return 'Zařízení rodiny';
  }
}

export function setDeviceLabel(label: string) {
  try {
    localStorage.setItem(DEVICE_LABEL_KEY, label);
  } catch {
    /* ignore */
  }
}

export function getFamilyCode(): string {
  try {
    return localStorage.getItem(FAMILY_CODE_KEY) || '';
  } catch {
    return '';
  }
}

export function setFamilyCode(code: string) {
  try {
    localStorage.setItem(FAMILY_CODE_KEY, code.trim());
  } catch {
    /* ignore */
  }
}

export function isHistorySyncEnabled(): boolean {
  try {
    return localStorage.getItem(SYNC_HISTORY_KEY) === '1';
  } catch {
    return false;
  }
}

export function setHistorySyncEnabled(on: boolean) {
  try {
    localStorage.setItem(SYNC_HISTORY_KEY, on ? '1' : '0');
  } catch {
    /* ignore */
  }
}

/**
 * Suggest a friendly label from UA / client hints (Asus, Blackview often hidden behind "K").
 */
export function suggestDeviceLabelFromUa(ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''): string {
  const s = ua || '';
  const lower = s.toLowerCase();

  // Explicit model tokens when present
  const brandMatch = s.match(
    /\b(ASUS|Blackview|Samsung|Xiaomi|Redmi|POCO|Huawei|Honor|Lenovo|Nokia|Pixel|OnePlus|Sony|Motorola|Realme|Oppo|Vivo|iPhone|iPad|Tab)\b/i
  );
  if (brandMatch) {
    const b = brandMatch[1];
    if (/iphone/i.test(b)) return 'iPhone';
    if (/ipad/i.test(b)) return 'iPad';
    if (/tab/i.test(b)) return 'Tab';
    return b.charAt(0).toUpperCase() + b.slice(1);
  }

  if (/android/i.test(s) && /mobile/i.test(s)) return 'Android telefon';
  if (/android/i.test(s)) return 'Android tablet';
  if (/windows/i.test(s)) return 'Windows PC';
  if (/macintosh|mac os/i.test(s)) return 'Mac';
  if (/linux/i.test(s) && !/android/i.test(s)) return 'Linux PC';
  if (/bot|crawl|spider|slurp|fossick/i.test(lower)) return 'Bot / crawler';
  return 'Zařízení rodiny';
}

export type HeartbeatResult =
  | { ok: true; serverTime: number }
  | { ok: false; status?: number; error: string };

/**
 * One-shot heartbeat (also used after saving family settings).
 */
export async function sendFamilyHeartbeat(overrides?: {
  label?: string;
  familyCode?: string;
}): Promise<HeartbeatResult> {
  const familyCode = (overrides?.familyCode ?? getFamilyCode()).trim();
  if (!familyCode) {
    return { ok: false, error: 'Chybí rodinný kód — bez něj se zařízení v adminu neobjeví online.' };
  }

  try {
    const res = await fetch('/api/family/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId: getDeviceId(),
        label: overrides?.label ?? getDeviceLabel(),
        appVersion: APP_VERSION,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        familyCode,
      }),
    });
    if (!res.ok) {
      let err = `HTTP ${res.status}`;
      try {
        const j = await res.json();
        if (j?.error) err = String(j.error);
      } catch {
        /* ignore */
      }
      return { ok: false, status: res.status, error: err };
    }
    const data = (await res.json().catch(() => ({}))) as { serverTime?: number };
    return { ok: true, serverTime: data.serverTime || Date.now() };
  } catch {
    return { ok: false, error: 'Síťová chyba — server nedostupný.' };
  }
}

async function forceClientReload(forceReloadAt: number) {
  try {
    localStorage.setItem(LAST_RELOAD_KEY, String(forceReloadAt));
  } catch {
    /* ignore */
  }
  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
    const regs = await navigator.serviceWorker?.getRegistrations?.();
    if (regs) {
      await Promise.all(regs.map((r) => r.unregister()));
    }
  } catch (e) {
    console.warn('[FamilySync] cache clear failed', e);
  }
  window.location.reload();
}

/**
 * Heartbeat + remote force-update poll for family devices.
 * Fixed: no started.current gate (broke after StrictMode remount / dep changes).
 */
export function useFamilySync(enabled = true) {
  const [lastHb, setLastHb] = useState<HeartbeatResult | null>(null);
  const hbInFlight = useRef(false);

  const heartbeat = useCallback(async () => {
    if (hbInFlight.current) return null;
    hbInFlight.current = true;
    try {
      const result = await sendFamilyHeartbeat();
      setLastHb(result);
      return result;
    } finally {
      hbInFlight.current = false;
    }
  }, []);

  const pollConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/family/config');
      if (!res.ok) return;
      const cfg = await res.json();
      const forceAt = Number(cfg.forceReloadAt || 0);
      let last = 0;
      try {
        last = Number(localStorage.getItem(LAST_RELOAD_KEY) || 0);
      } catch {
        /* ignore */
      }
      if (forceAt > 0 && forceAt > last) {
        await forceClientReload(forceAt);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const tick = () => {
      void heartbeat();
    };
    const poll = () => {
      void pollConfig();
    };

    // Immediate + interval (survives StrictMode: cleanup clears, effect restarts cleanly)
    tick();
    poll();
    const hbTimer = setInterval(tick, HEARTBEAT_INTERVAL_MS);
    const pollTimer = setInterval(poll, 45_000);

    const onVis = () => {
      if (document.visibilityState === 'visible') tick();
    };
    const onOnline = () => tick();
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('online', onOnline);

    return () => {
      clearInterval(hbTimer);
      clearInterval(pollTimer);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('online', onOnline);
    };
  }, [enabled, heartbeat, pollConfig]);

  const syncHistoryItem = useCallback(async (result: AdCheckResult) => {
    if (!isHistorySyncEnabled()) return;
    const code = getFamilyCode();
    if (!code) return;
    try {
      await fetch('/api/family/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyCode: code,
          deviceId: getDeviceId(),
          deviceLabel: getDeviceLabel(),
          item: {
            id: result.id,
            timestamp: result.timestamp,
            headline: result.headline,
            safetyLevel: result.safetyLevel,
            trustScore: result.trustScore,
            inputUrl: result.inputUrl,
            summaryForSenior: result.summaryForSenior,
          },
        }),
      });
    } catch {
      /* ignore */
    }
  }, []);

  return { heartbeat, syncHistoryItem, pollConfig, lastHb, sendFamilyHeartbeat };
}
