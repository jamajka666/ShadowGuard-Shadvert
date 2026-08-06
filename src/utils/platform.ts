/**
 * Lightweight client platform helpers (iOS Safari / PWA).
 */

export function isIOS(): boolean {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  // Classic iOS devices
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  // iPadOS 13+ can report as Macintosh with touch
  if (navigator.platform === 'MacIntel' && (navigator as Navigator & { maxTouchPoints?: number }).maxTouchPoints > 1) {
    return true;
  }
  return false;
}

export function isStandalonePwa(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  if (nav.standalone === true) return true;
  try {
    return window.matchMedia('(display-mode: standalone)').matches;
  } catch {
    return false;
  }
}

/** Prefer Web Share API with files (works well on iOS for CSV/JSON export). */
export function canShareFiles(): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') return false;
  if (typeof navigator.canShare !== 'function') {
    // Older Safari may have share() without canShare — try files only via caller try/catch
    return isIOS();
  }
  try {
    const probe = new File(['x'], 'probe.txt', { type: 'text/plain' });
    return navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
}
