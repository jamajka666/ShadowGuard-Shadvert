/**
 * Cross-platform file export: Web Share (iOS-friendly) → download link → open blob tab.
 */

import { canShareFiles, isIOS } from './platform';

export type ShareFileResult = 'shared' | 'downloaded' | 'opened' | 'failed';

export async function shareOrDownloadFile(
  blob: Blob,
  fileName: string,
  options?: { mimeType?: string; title?: string; text?: string }
): Promise<ShareFileResult> {
  const mime = options?.mimeType || blob.type || 'application/octet-stream';
  const file = new File([blob], fileName, { type: mime });

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      if (canShareFiles()) {
        await navigator.share({
          files: [file],
          title: options?.title || fileName,
          text: options?.text,
        });
        return 'shared';
      }
      // Text-only share as last resort before download (no file attachment)
    } catch (err: unknown) {
      const name = (err as { name?: string })?.name;
      // User cancelled share sheet — not an error
      if (name === 'AbortError') return 'failed';
      // fall through to download
    }
  }

  // Classic download attribute (Android Chrome, desktop)
  // On iOS Safari, download= is unreliable — open blob URL so user can Share → Files
  try {
    const url = URL.createObjectURL(blob);
    if (isIOS()) {
      const opened = window.open(url, '_blank', 'noopener,noreferrer');
      if (!opened) {
        // Popup blocked: navigate same tab as last resort
        window.location.href = url;
      }
      setTimeout(() => URL.revokeObjectURL(url), 120_000);
      return 'opened';
    }

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
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
