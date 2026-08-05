/**
 * Closed-beta flag for Jednoduchý režim (Trust Sprint Fáze 3 / D-021).
 * First Creation remains default unless tester explicitly opts in.
 *
 * Activate:
 *   - URL ?mode=simple  (or ?simple=1, ?mode=jednoduchy)
 *   - path /simple
 * Persist: localStorage sg_ui_mode=simple
 *
 * Exit:
 *   - ?mode=classic  (or ?simple=0)
 *   - clearStorage + reload
 */

export type UiMode = 'first-creation' | 'simple';

export const SIMPLE_MODE_STORAGE_KEY = 'sg_ui_mode';

function persist(mode: UiMode) {
  try {
    if (mode === 'simple') {
      localStorage.setItem(SIMPLE_MODE_STORAGE_KEY, 'simple');
    } else {
      localStorage.removeItem(SIMPLE_MODE_STORAGE_KEY);
    }
  } catch {
    /* ignore quota / private mode */
  }
}

/**
 * Pure resolution from URL + optional stored preference.
 * Safe to call only in browser (uses window).
 */
export function resolveUiMode(
  search: string,
  pathname: string,
  stored: string | null
): UiMode {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const modeQ = (params.get('mode') || params.get('ui') || '').toLowerCase().trim();
  const simpleQ = (params.get('simple') || '').toLowerCase().trim();

  // Explicit exit always wins
  if (
    modeQ === 'classic' ||
    modeQ === 'first' ||
    modeQ === 'first-creation' ||
    simpleQ === '0' ||
    simpleQ === 'false' ||
    simpleQ === 'off'
  ) {
    return 'first-creation';
  }

  // Explicit enter
  if (
    modeQ === 'simple' ||
    modeQ === 'jednoduchy' ||
    modeQ === 'jednoduchý' ||
    simpleQ === '1' ||
    simpleQ === 'true' ||
    simpleQ === 'on'
  ) {
    return 'simple';
  }

  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/simple' || path.startsWith('/simple/')) {
    return 'simple';
  }

  if (stored === 'simple') {
    return 'simple';
  }

  return 'first-creation';
}

/** Browser helper: read + optionally persist when URL explicitly chooses. */
export function readUiMode(): UiMode {
  if (typeof window === 'undefined') return 'first-creation';

  let stored: string | null = null;
  try {
    stored = localStorage.getItem(SIMPLE_MODE_STORAGE_KEY);
  } catch {
    stored = null;
  }

  const mode = resolveUiMode(window.location.search, window.location.pathname, stored);

  // Persist only when URL/path explicitly selected a mode this load
  const params = new URLSearchParams(window.location.search);
  const modeQ = (params.get('mode') || params.get('ui') || '').toLowerCase();
  const simpleQ = (params.get('simple') || '').toLowerCase();
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  const explicit =
    Boolean(modeQ) ||
    Boolean(simpleQ) ||
    path === '/simple' ||
    path.startsWith('/simple/');

  if (explicit) {
    persist(mode);
  }

  return mode;
}

export function setUiMode(mode: UiMode) {
  persist(mode);
}

export function simpleModeHelpUrl(): string {
  return '/?mode=simple';
}

export function classicModeHelpUrl(): string {
  return '/?mode=classic';
}
