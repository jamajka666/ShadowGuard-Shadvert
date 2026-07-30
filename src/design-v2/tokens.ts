/**
 * Calm Security tokens for ui/design-v2 (Simple mode).
 * Light calm green default — no neon, no glow.
 */

export const calmTokens = {
  pageBg: '#f4f7f4',
  cardBg: '#ffffff',
  text: '#1a2332',
  textMuted: '#4b5563',
  border: '#d8e2d8',
  accent: '#2f6f4e',
  accentSoft: '#e8f2ec',
  focusRing: '#2f6f4e',
} as const;

export const statusTokens = {
  DUVERYHODNE: {
    badgeBg: '#e8f2ec',
    badgeText: '#1b4332',
    badgeBorder: '#2f6f4e',
    accent: '#2f6f4e',
    icon: 'check' as const,
    label: 'Důvěryhodné',
  },
  OPATRNOSTI: {
    badgeBg: '#fff7ed',
    badgeText: '#9a3412',
    badgeBorder: '#d97706',
    accent: '#d97706',
    icon: 'caution' as const,
    label: 'Opatrnost',
  },
  PODVOD: {
    badgeBg: '#fef2f2',
    badgeText: '#7f1d1d',
    badgeBorder: '#b91c1c',
    accent: '#b91c1c',
    icon: 'alert' as const,
    label: 'Podvod',
  },
} as const;
