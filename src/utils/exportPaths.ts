/**
 * Consistent export naming + optional save into app folder on Lenovo (server)
 * and optional local directory via File System Access API.
 */

import { getDeviceId, getDeviceLabel, getFamilyCode } from '../hooks/useFamilySync';

/** Subfolder prefix used in filenames / server layout */
export const APP_EXPORT_FOLDER = 'ShadowGuard-exports';

export function exportFileName(kind: string, ext: string): string {
  const day = new Date().toISOString().slice(0, 10);
  const safeKind = kind.replace(/[^a-zA-Z0-9_-]+/g, '_').slice(0, 40);
  return `${APP_EXPORT_FOLDER}/${safeKind}_${day}_${Date.now()}.${ext.replace(/^\./, '')}`;
}

/** Flat name for browsers that reject path separators in download= */
export function exportFileNameFlat(kind: string, ext: string): string {
  return exportFileName(kind, ext).replace(/\//g, '__');
}

export type ServerSaveResult =
  | { ok: true; path: string }
  | { ok: false; error: string };

/**
 * Save export blob to Lenovo app folder: data/exports/…
 * Requires family code (same as heartbeat).
 */
export async function saveExportToAppServer(
  blob: Blob,
  fileName: string
): Promise<ServerSaveResult> {
  const familyCode = getFamilyCode().trim();
  if (!familyCode) {
    return { ok: false, error: 'Bez rodinného kódu nelze ukládat na server.' };
  }

  // Server expects basename only under controlled dir
  const base = fileName.split(/[/\\]/).pop() || fileName;
  const safeBase = base.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 120);

  try {
    const buf = await blob.arrayBuffer();
    // base64 without huge intermediate for medium files
    let binary = '';
    const bytes = new Uint8Array(buf);
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    const contentBase64 = btoa(binary);

    const res = await fetch('/api/family/save-export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        familyCode,
        deviceId: getDeviceId(),
        deviceLabel: getDeviceLabel(),
        fileName: safeBase,
        contentBase64,
        mimeType: blob.type || 'application/octet-stream',
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
      return { ok: false, error: err };
    }
    const data = (await res.json()) as { path?: string };
    return { ok: true, path: data.path || `data/exports/${safeBase}` };
  } catch {
    return { ok: false, error: 'Síťová chyba při ukládání na server.' };
  }
}
