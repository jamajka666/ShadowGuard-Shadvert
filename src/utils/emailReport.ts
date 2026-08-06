/**
 * Client-only report export via mailto (no ShadowGuard server).
 * Data path: device → user's mail app → REPORT_TO_EMAIL.
 */

import { APP_VERSION, getDeviceId, getDeviceLabel } from '../hooks/useFamilySync';
import type { AdCheckResult } from '../types';

/** Closed-beta recipient — single place to change. */
export const REPORT_TO_EMAIL = '23jamajka666@gmail.com';

/** Default reminder interval: 7 days (less intrusive than 24h). */
export const DEFAULT_REPORT_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

/** Safe mailto body budget (mobile clients often break above ~1800–2000 encoded chars). */
export const MAILTO_BODY_MAX_CHARS = 1600;

export const STORAGE_KEYS = {
  lastStatsOfferAt: 'shadvert_last_stats_email_offer_at',
  lastStatsSentAt: 'shadvert_last_stats_email_sent_at',
  /** 'off' | '7d' | '1d' — user preference for reminder cadence */
  reminderPref: 'shadvert_stats_email_reminder_pref',
  /** Permanent opt-out of the in-app banner */
  bannerDisabled: 'shadvert_stats_email_banner_disabled',
} as const;

export type ReminderPref = 'off' | '7d' | '1d';

export type DeviceMeta = {
  deviceLabel: string;
  deviceIdShort: string;
  appVersion: string;
  platform: string;
  userAgentShort: string;
  generatedAt: string;
};

export type SurveyPayload = {
  versionLabel?: string;
  savedAt?: string;
  swatchVote?: string | null;
  answers?: Record<string, string>;
};

export type StatsSummary = {
  total: number;
  safe: number;
  caution: number;
  scam: number;
  scamPercent: number;
  /** PODVOD + (trustScore <= 10 OR phishing_kill) */
  provenScam: number;
  provenScamPercent: number;
};

export type MailtoResult =
  | { ok: true; truncated: boolean }
  | { ok: false; reason: 'empty' | 'blocked' | 'unsupported' };

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function buildDeviceMeta(now = new Date()): DeviceMeta {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
  const platform =
    typeof navigator !== 'undefined'
      ? (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData
          ?.platform ||
        navigator.platform ||
        'unknown'
      : 'unknown';

  let deviceId = '';
  try {
    deviceId = getDeviceId();
  } catch {
    deviceId = 'n/a';
  }

  return {
    deviceLabel: (() => {
      try {
        return getDeviceLabel();
      } catch {
        return 'Zařízení';
      }
    })(),
    deviceIdShort: deviceId.slice(0, 8) || 'n/a',
    appVersion: APP_VERSION,
    platform: String(platform),
    userAgentShort: ua.length > 120 ? `${ua.slice(0, 117)}...` : ua || 'n/a',
    generatedAt: now.toISOString(),
  };
}

export function formatDeviceMetaBlock(meta: DeviceMeta): string {
  return [
    '--- Zařízení (bez osobních údajů) ---',
    `Popisek: ${meta.deviceLabel}`,
    `ID (zkrácené): ${meta.deviceIdShort}`,
    `Verze app: ${meta.appVersion}`,
    `Platforma: ${meta.platform}`,
    `UA: ${meta.userAgentShort}`,
    `Vygenerováno: ${meta.generatedAt}`,
  ].join('\n');
}

/** Hard / high-confidence scam row. */
export function isProvenScam(item: AdCheckResult): boolean {
  if (item.safetyLevel !== 'PODVOD') return false;
  if (item.verdictSource === 'phishing_kill') return true;
  return (item.trustScore ?? 100) <= 10;
}

export function summarizeHistory(history: AdCheckResult[]): StatsSummary {
  let safe = 0;
  let caution = 0;
  let scam = 0;
  let provenScam = 0;

  for (const item of history) {
    if (item.safetyLevel === 'PODVOD') {
      scam += 1;
      if (isProvenScam(item)) provenScam += 1;
    } else if (item.safetyLevel === 'OPATRNOSTI') {
      caution += 1;
    } else {
      safe += 1;
    }
  }

  const total = history.length;
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 1000) / 10 : 0);

  return {
    total,
    safe,
    caution,
    scam,
    scamPercent: pct(scam),
    provenScam,
    provenScamPercent: pct(provenScam),
  };
}

export function buildSurveyReportBody(
  payload: SurveyPayload,
  meta: DeviceMeta = buildDeviceMeta()
): string {
  const lines: string[] = [
    'ShadowGuard / Shadvert — zpětná vazba z dotazníku',
    '(Volitelný report pro zakladatele. Neobsahuje jméno ani kontakt testera.)',
    '',
    formatDeviceMetaBlock(meta),
    '',
    `Lab: ${payload.versionLabel || 'First Creation'}`,
    `Uloženo v app: ${payload.savedAt || meta.generatedAt}`,
    `Hlas ze vzorkovnice: ${payload.swatchVote || '—'}`,
    '',
    '--- Odpovědi ---',
  ];

  const answers = payload.answers || {};
  const keys = Object.keys(answers);
  if (keys.length === 0) {
    lines.push('(žádné odpovědi)');
  } else {
    for (const k of keys) {
      lines.push(`${k}: ${answers[k]}`);
    }
  }

  lines.push('', '— odesláno z appky (mailto, ne přes server Shadvert) —');
  return lines.join('\n');
}

export function buildStatsReportBody(
  history: AdCheckResult[],
  options?: { maxScamRows?: number; meta?: DeviceMeta }
): string {
  const meta = options?.meta ?? buildDeviceMeta();
  const maxRows = options?.maxScamRows ?? 12;
  const s = summarizeHistory(history);

  const lines: string[] = [
    'ShadowGuard / Shadvert — statistika kontrol inzerátů',
    '(Souhrn z historie na tomto zařízení. Žádná jména uživatelů.)',
    '',
    formatDeviceMetaBlock(meta),
    '',
    '--- Souhrn ---',
    `Celkem kontrol: ${s.total}`,
    `Důvěryhodné: ${s.safe}`,
    `Opatrnost: ${s.caution}`,
    `Podvod (PODVOD): ${s.scam} (${s.scamPercent} %)`,
    `Vysoká jistota podvodu (trust≤10 nebo phishing kill): ${s.provenScam} (${s.provenScamPercent} %)`,
    '',
    '--- Databáze podvodů (výběr z historie) ---',
  ];

  const scams = history
    .filter((h) => h.safetyLevel === 'PODVOD')
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, maxRows);

  if (scams.length === 0) {
    lines.push('(zatím žádný záznam PODVOD)');
  } else {
    scams.forEach((item, i) => {
      const domain = item.urlAnalysis?.domainName || item.inputUrl || '—';
      const when = new Date(item.timestamp).toISOString().slice(0, 16).replace('T', ' ');
      const proven = isProvenScam(item) ? 'ANO' : 'ne';
      const headline = (item.headline || '').slice(0, 80);
      lines.push(
        `${i + 1}. [${when}] score=${item.trustScore ?? '?'} proven=${proven} | ${headline}`
      );
      lines.push(`   doména: ${String(domain).slice(0, 80)}`);
    });
    if (s.scam > maxRows) {
      lines.push(`… a dalších ${s.scam - maxRows} záznamů (v appce: Export CSV).`);
    }
  }

  lines.push('', '— odesláno z appky (mailto, ne přes server Shadvert) —');
  return lines.join('\n');
}

/**
 * Truncate body for mailto length limits. Prefer cutting middle list, keep header + footer note.
 */
export function truncateForMailto(
  body: string,
  maxChars = MAILTO_BODY_MAX_CHARS
): { body: string; truncated: boolean } {
  if (body.length <= maxChars) return { body, truncated: false };
  const note =
    '\n\n[… zkráceno kvůli limitu e-mailové appky. V Shadvert použijte Sdílet/Export CSV pro plná data.]';
  const budget = Math.max(200, maxChars - note.length);
  return { body: body.slice(0, budget) + note, truncated: true };
}

export function buildMailtoUrl(subject: string, body: string, to = REPORT_TO_EMAIL): string {
  const { body: safeBody } = truncateForMailto(body);
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(safeBody)}`;
}

/**
 * Open default mail client. Returns whether navigation was attempted and if body was truncated.
 */
export function openMailto(options: {
  subject: string;
  body: string;
  to?: string;
}): MailtoResult {
  if (typeof window === 'undefined') return { ok: false, reason: 'unsupported' };
  const raw = options.body || '';
  if (!raw.trim()) return { ok: false, reason: 'empty' };

  const { body, truncated } = truncateForMailto(raw);
  const href = `mailto:${options.to || REPORT_TO_EMAIL}?subject=${encodeURIComponent(
    options.subject
  )}&body=${encodeURIComponent(body)}`;

  // length guard on full URL (some WebViews cap ~2k–8k)
  if (href.length > 7500) {
    const tighter = truncateForMailto(raw, 900);
    const href2 = `mailto:${options.to || REPORT_TO_EMAIL}?subject=${encodeURIComponent(
      options.subject
    )}&body=${encodeURIComponent(tighter.body)}`;
    try {
      window.location.href = href2;
      return { ok: true, truncated: true };
    } catch {
      return { ok: false, reason: 'blocked' };
    }
  }

  try {
    window.location.href = href;
    return { ok: true, truncated };
  } catch {
    return { ok: false, reason: 'blocked' };
  }
}

export function getReminderPref(): ReminderPref {
  const v = safeGet(STORAGE_KEYS.reminderPref);
  if (v === 'off' || v === '7d' || v === '1d') return v;
  // Default: weekly, low pressure
  return '7d';
}

export function setReminderPref(pref: ReminderPref): void {
  safeSet(STORAGE_KEYS.reminderPref, pref);
  if (pref === 'off') {
    safeSet(STORAGE_KEYS.bannerDisabled, '1');
  } else {
    safeRemove(STORAGE_KEYS.bannerDisabled);
  }
}

export function isBannerDisabled(): boolean {
  if (safeGet(STORAGE_KEYS.bannerDisabled) === '1') return true;
  return getReminderPref() === 'off';
}

export function disableBannerPermanently(): void {
  setReminderPref('off');
}

export function markStatsReportOffered(now = Date.now()): void {
  safeSet(STORAGE_KEYS.lastStatsOfferAt, String(now));
}

export function markStatsReportSent(now = Date.now()): void {
  safeSet(STORAGE_KEYS.lastStatsSentAt, String(now));
  safeSet(STORAGE_KEYS.lastStatsOfferAt, String(now));
}

export function snoozeStatsBanner(ms: number = DEFAULT_REPORT_INTERVAL_MS, now = Date.now()): void {
  // Push next offer to now + interval by stamping last offer as "just shown + remaining"
  // Simpler: set last offer to now so interval must elapse again from snooze click.
  safeSet(STORAGE_KEYS.lastStatsOfferAt, String(now));
  if (getReminderPref() === 'off') return;
  // Keep current pref; snooze only delays next show via lastStatsOfferAt
  void ms;
}

function intervalMsForPref(pref: ReminderPref): number {
  if (pref === '1d') return 24 * 60 * 60 * 1000;
  if (pref === '7d') return DEFAULT_REPORT_INTERVAL_MS;
  return Number.POSITIVE_INFINITY;
}

/**
 * Whether to gently offer a voluntary stats e-mail (never auto-sends).
 * Soft defaults: weekly, permanently dismissible, only if history has checks.
 */
export function shouldOfferStatsEmailPrompt(
  historyLength: number,
  now = Date.now()
): boolean {
  if (historyLength <= 0) return false;
  if (isBannerDisabled()) return false;

  const pref = getReminderPref();
  if (pref === 'off') return false;

  const interval = intervalMsForPref(pref);
  const lastOffer = Number(safeGet(STORAGE_KEYS.lastStatsOfferAt) || '0');
  const lastSent = Number(safeGet(STORAGE_KEYS.lastStatsSentAt) || '0');
  const last = Math.max(lastOffer, lastSent);

  // First ever: wait full interval from first install marker, or show if never stamped and history ≥ 3
  if (!last) {
    // Soft first offer: only after at least 3 checks so it doesn't feel like tracking
    return historyLength >= 3;
  }

  return now - last >= interval;
}

export function openSurveyMailto(payload: SurveyPayload): MailtoResult {
  const body = buildSurveyReportBody(payload);
  return openMailto({
    subject: `[Shadvert] Dotazník First Creation ${new Date().toISOString().slice(0, 10)}`,
    body,
  });
}

export function openStatsMailto(history: AdCheckResult[]): MailtoResult {
  if (!history.length) return { ok: false, reason: 'empty' };
  const body = buildStatsReportBody(history);
  const s = summarizeHistory(history);
  return openMailto({
    subject: `[Shadvert] Statistiky ${s.total} kontrol · podvody ${s.scam} (${s.scamPercent} %)`,
    body,
  });
}

/** Map color swatch id → questionnaire "look" radio option text. */
export function mapSwatchIdToLookOption(swatchId: string): string | null {
  const map: Record<string, string> = {
    'fc-cyber': 'Jak to je teď (tmavé cyber)',
    'calm-green': 'Světlé s klidnou zelenou',
    'soft-mint': 'Světlé s klidnou zelenou',
    forest: 'Světlé s klidnou zelenou',
    'dark-blue': 'Tmavé, ale klidnější',
    'midnight-amber': 'Tmavé, ale klidnější',
    'stealth-green': 'Tmavé, ale klidnější',
    'warm-gold': 'Teplé zlaté / pískové',
    sand: 'Teplé zlaté / pískové',
    'high-contrast': 'Tmavé, ale klidnější',
    ocean: 'Světlé s klidnou zelenou',
    lavender: 'Světlé s klidnou zelenou',
    rose: 'Teplé zlaté / pískové',
    'slate-green': 'Světlé s klidnou zelenou',
    'classic-white': 'Světlé s klidnou zelenou',
  };
  return map[swatchId] ?? null;
}
