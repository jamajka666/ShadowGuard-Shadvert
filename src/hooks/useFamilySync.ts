import { useEffect, useCallback, useRef } from 'react';
import { AdCheckResult } from '../types';

const DEVICE_ID_KEY = 'sg_device_id';
const DEVICE_LABEL_KEY = 'sg_device_label';
const FAMILY_CODE_KEY = 'sg_family_code';
const LAST_RELOAD_KEY = 'sg_last_force_reload';
const SYNC_HISTORY_KEY = 'sg_sync_history_enabled';

export const APP_VERSION = '1.0.0';

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
 */
export function useFamilySync(enabled = true) {
  const started = useRef(false);

  const heartbeat = useCallback(async () => {
    try {
      await fetch('/api/family/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: getDeviceId(),
          label: getDeviceLabel(),
          appVersion: APP_VERSION,
          userAgent: navigator.userAgent,
          familyCode: getFamilyCode() || undefined,
        }),
      });
    } catch {
      /* offline ok */
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
        return;
      }
      if (cfg.minClientVersion && cfg.minClientVersion !== APP_VERSION) {
        // soft: only force if minClientVersion is newer string compare via forceReloadAt preferred
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!enabled || started.current) return;
    started.current = true;
    void heartbeat();
    void pollConfig();
    const hb = setInterval(() => void heartbeat(), 60_000);
    const poll = setInterval(() => void pollConfig(), 45_000);
    return () => {
      clearInterval(hb);
      clearInterval(poll);
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

  return { heartbeat, syncHistoryItem, pollConfig };
}
