/**
 * Calm Security tokens for ui/design-v2 (Simple mode).
 * Light calm green default — no neon, no glow.
 * Warning/danger badges: stronger calm saturation for older eyes / weak displays
 * (Grok review 2026-07-30).
 */

export const calmTokens = {
  pageBg: '#f4f7f4',
  cardBg: '#ffffff',
  text: '#1a2332',
  textMuted: '#4b5563',
  textFaint: '#6b7280',
  border: '#d8e2d8',
  accent: '#2f6f4e',
  accentSoft: '#e8f2ec',
  focusRing: '#2f6f4e',
} as const;

export const statusTokens = {
  DUVERYHODNE: {
    badgeBg: '#dcefe4',
    badgeText: '#14532d',
    badgeBorder: '#2f6f4e',
    accent: '#2f6f4e',
    adviceBg: '#e8f2ec',
    adviceBorder: '#b7d4c4',
    icon: 'check' as const,
    label: 'Důvěryhodné',
  },
  OPATRNOSTI: {
    // Stronger amber — still warm, not neon
    badgeBg: '#ffedd5',
    badgeText: '#7c2d12',
    badgeBorder: '#c2410c',
    accent: '#c2410c',
    adviceBg: '#fff7ed',
    adviceBorder: '#fdba74',
    icon: 'caution' as const,
    label: 'Opatrnost',
  },
  PODVOD: {
    // Calm red with higher contrast (no glow)
    badgeBg: '#fee2e2',
    badgeText: '#7f1d1d',
    badgeBorder: '#991b1b',
    accent: '#991b1b',
    adviceBg: '#fef2f2',
    adviceBorder: '#f87171',
    icon: 'alert' as const,
    label: 'Podvod',
  },
} as const;
