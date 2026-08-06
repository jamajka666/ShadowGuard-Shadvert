/**
 * Cross-platform file export:
 * 1) Optional save into remembered local folder (File System Access API)
 * 2) Web Share (iOS-friendly)
 * 3) Classic download
 * 4) Optionally also persist to Lenovo app folder via API (family code)
 */

import { canShareFiles, isIOS } from './platform';
import { saveExportToAppServer } from './exportPaths';

export type ShareFileResult = 'shared' | 'downloaded' | 'opened' | 'saved-local' | 'failed';

export type ShareFileOptions = {
  mimeType?: string;
  title?: string;
  text?: string;
  /** Also POST to server data/exports when family code is set (default true) */
  saveToAppServer?: boolean;
  /** Prefer File System Access / remembered dir (default true on supporting browsers) */
  preferAppFolder?: boolean;
};

const DIR_HANDLE_DB = 'shadvert_fs';
const DIR_HANDLE_STORE = 'handles';
const DIR_HANDLE_KEY = 'exportDir';

async function idbOpen(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return null;
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(DIR_HANDLE_DB, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(DIR_HANDLE_STORE)) {
          db.createObjectStore(DIR_HANDLE_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function getStoredDirHandle(): Promise<FileSystemDirectoryHandle | null> {
  const db = await idbOpen();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(DIR_HANDLE_STORE, 'readonly');
      const req = tx.objectStore(DIR_HANDLE_STORE).get(DIR_HANDLE_KEY);
      req.onsuccess = () => resolve((req.result as FileSystemDirectoryHandle) || null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function setStoredDirHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await idbOpen();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(DIR_HANDLE_STORE, 'readwrite');
      tx.objectStore(DIR_HANDLE_STORE).put(handle, DIR_HANDLE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

type FileSystemWritable = { write: (d: Blob) => Promise<void>; close: () => Promise<void> };

async function trySaveWithFileSystemAccess(
  blob: Blob,
  fileName: string
): Promise<'saved-local' | 'skip' | 'failed'> {
  const w = window as Window & {
    showDirectoryPicker?: (opts?: { id?: string; mode?: string; startIn?: string }) => Promise<FileSystemDirectoryHandle>;
  };
  if (typeof w.showDirectoryPicker !== 'function') return 'skip';

  const baseName = fileName.split(/[/\\]/).pop() || fileName;

  try {
    let dir = await getStoredDirHandle();
    // Verify permission
    if (dir) {
      const perm = await (dir as FileSystemDirectoryHandle & {
        queryPermission?: (o: { mode: string }) => Promise<string>;
        requestPermission?: (o: { mode: string }) => Promise<string>;
      }).queryPermission?.({ mode: 'readwrite' });
      if (perm !== 'granted') {
        const req = await (dir as FileSystemDirectoryHandle & {
          requestPermission?: (o: { mode: string }) => Promise<string>;
        }).requestPermission?.({ mode: 'readwrite' });
        if (req !== 'granted') dir = null;
      }
    }

    if (!dir) {
      // Only prompt when no handle — keep UX light; use startIn documents
      try {
        dir = await w.showDirectoryPicker!({
          id: 'shadvert-exports',
          mode: 'readwrite',
          startIn: 'documents',
        });
        await setStoredDirHandle(dir);
      } catch (err: unknown) {
        const name = (err as { name?: string })?.name;
        if (name === 'AbortError') return 'failed';
        return 'skip';
      }
    }

    // Ensure ShadowGuard-exports subfolder when possible
    let target = dir;
    try {
      target = await dir.getDirectoryHandle('ShadowGuard-exports', { create: true });
    } catch {
      target = dir;
    }

    const fileHandle = await target.getFileHandle(baseName, { create: true });
    const writable = (await (
      fileHandle as FileSystemFileHandle & { createWritable: () => Promise<FileSystemWritable> }
    ).createWritable()) as FileSystemWritable;
    await writable.write(blob);
    await writable.close();
    return 'saved-local';
  } catch {
    return 'skip';
  }
}

export async function shareOrDownloadFile(
  blob: Blob,
  fileName: string,
  options?: ShareFileOptions
): Promise<ShareFileResult> {
  const mime = options?.mimeType || blob.type || 'application/octet-stream';
  const baseName = fileName.split(/[/\\]/).pop() || fileName;
  const file = new File([blob], baseName, { type: mime });

  // 1) Remembered / picked app folder (Chrome desktop)
  if (options?.preferAppFolder !== false && !isIOS()) {
    const fsResult = await trySaveWithFileSystemAccess(blob, baseName);
    if (fsResult === 'saved-local') {
      if (options?.saveToAppServer !== false) {
        void saveExportToAppServer(blob, baseName);
      }
      return 'saved-local';
    }
  }

  // 2) Web Share
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      if (canShareFiles()) {
        await navigator.share({
          files: [file],
          title: options?.title || baseName,
          text: options?.text,
        });
        if (options?.saveToAppServer !== false) {
          void saveExportToAppServer(blob, baseName);
        }
        return 'shared';
      }
    } catch (err: unknown) {
      const name = (err as { name?: string })?.name;
      if (name === 'AbortError') return 'failed';
    }
  }

  // 3) Classic download
  try {
    const url = URL.createObjectURL(blob);
    if (isIOS()) {
      const opened = window.open(url, '_blank', 'noopener,noreferrer');
      if (!opened) {
        window.location.href = url;
      }
      setTimeout(() => URL.revokeObjectURL(url), 120_000);
      if (options?.saveToAppServer !== false) {
        void saveExportToAppServer(blob, baseName);
      }
      return 'opened';
    }

    const link = document.createElement('a');
    link.href = url;
    link.download = baseName;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    if (options?.saveToAppServer !== false) {
      void saveExportToAppServer(blob, baseName);
    }
    return 'downloaded';
  } catch {
    return 'failed';
  }
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof navigator === 'undefined') return false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
