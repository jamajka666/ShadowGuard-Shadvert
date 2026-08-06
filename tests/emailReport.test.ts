import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  summarizeHistory,
  isProvenScam,
  truncateForMailto,
  buildStatsReportBody,
  buildSurveyReportBody,
  mapSwatchIdToLookOption,
  shouldOfferStatsEmailPrompt,
  setReminderPref,
  markStatsReportOffered,
  disableBannerPermanently,
  STORAGE_KEYS,
  MAILTO_BODY_MAX_CHARS,
  buildDeviceMeta,
} from '../src/utils/emailReport';
import type { AdCheckResult } from '../src/types';

function item(partial: Partial<AdCheckResult> & Pick<AdCheckResult, 'safetyLevel'>): AdCheckResult {
  return {
    id: partial.id || 't1',
    timestamp: partial.timestamp ?? Date.now(),
    trustScore: partial.trustScore ?? 50,
    headline: partial.headline ?? 'Test',
    summaryForSenior: '',
    actionRecommendation: 'NEKUPOVAT_NEPLATIT',
    actionAdvice: [],
    riskFactors: [],
    positiveFactors: [],
    sellerChecks: [],
    urlAnalysis: { domainName: partial.urlAnalysis?.domainName || 'evil.example', isOfficialDomain: false },
    priceEvaluation: { isPriceSuspicious: false, priceComment: '' },
    ...partial,
  };
}

// Minimal localStorage for node tests
const mem = new Map<string, string>();
const ls = {
  getItem: (k: string) => (mem.has(k) ? mem.get(k)! : null),
  setItem: (k: string, v: string) => {
    mem.set(k, String(v));
  },
  removeItem: (k: string) => {
    mem.delete(k);
  },
  clear: () => mem.clear(),
};
(globalThis as unknown as { localStorage: typeof ls }).localStorage = ls;

describe('emailReport summarizeHistory', () => {
  it('counts levels and proven scams', () => {
    const history = [
      item({ safetyLevel: 'DUVERYHODNE', trustScore: 90 }),
      item({ safetyLevel: 'OPATRNOSTI', trustScore: 55 }),
      item({ safetyLevel: 'PODVOD', trustScore: 40 }),
      item({ safetyLevel: 'PODVOD', trustScore: 5 }),
      item({ safetyLevel: 'PODVOD', trustScore: 20, verdictSource: 'phishing_kill' }),
    ];
    const s = summarizeHistory(history);
    assert.equal(s.total, 5);
    assert.equal(s.safe, 1);
    assert.equal(s.caution, 1);
    assert.equal(s.scam, 3);
    assert.equal(s.provenScam, 2); // trust 5 + phishing_kill
    assert.ok(s.scamPercent > 0);
  });

  it('isProvenScam requires PODVOD', () => {
    assert.equal(isProvenScam(item({ safetyLevel: 'DUVERYHODNE', trustScore: 0 })), false);
    assert.equal(isProvenScam(item({ safetyLevel: 'PODVOD', trustScore: 10 })), true);
    assert.equal(isProvenScam(item({ safetyLevel: 'PODVOD', trustScore: 11 })), false);
  });
});

describe('emailReport bodies', () => {
  it('builds survey body with answers', () => {
    const body = buildSurveyReportBody(
      {
        versionLabel: 'First Creation',
        swatchVote: 'calm-green',
        answers: { overall: 'Velmi příjemně', look: 'Světlé s klidnou zelenou' },
      },
      {
        deviceLabel: 'TestPhone',
        deviceIdShort: 'abcd1234',
        appVersion: '1.0.0',
        platform: 'Test',
        userAgentShort: 'UA',
        generatedAt: '2026-08-06T12:00:00.000Z',
      }
    );
    assert.match(body, /dotazník/i);
    assert.match(body, /calm-green/);
    assert.match(body, /overall: Velmi příjemně/);
    assert.match(body, /TestPhone/);
    assert.doesNotMatch(body, /FAMILY_CODE|admin.?token/i);
  });

  it('builds stats body with scam list', () => {
    const history = [
      item({
        safetyLevel: 'PODVOD',
        trustScore: 3,
        headline: 'Falešný DPD',
        timestamp: 1_700_000_000_000,
      }),
      item({ safetyLevel: 'DUVERYHODNE', trustScore: 88, headline: 'OK bazar' }),
    ];
    const body = buildStatsReportBody(history, {
      meta: {
        deviceLabel: 'X',
        deviceIdShort: 'id',
        appVersion: '1.0.0',
        platform: 'p',
        userAgentShort: 'ua',
        generatedAt: '2026-08-06T12:00:00.000Z',
      },
    });
    assert.match(body, /Celkem kontrol: 2/);
    assert.match(body, /Podvod \(PODVOD\): 1/);
    assert.match(body, /Falešný DPD/);
    assert.match(body, /mailto, ne přes server/);
  });
});

describe('truncateForMailto', () => {
  it('leaves short body intact', () => {
    const r = truncateForMailto('ahoj', 100);
    assert.equal(r.truncated, false);
    assert.equal(r.body, 'ahoj');
  });

  it('truncates long body', () => {
    const long = 'x'.repeat(MAILTO_BODY_MAX_CHARS + 500);
    const r = truncateForMailto(long);
    assert.equal(r.truncated, true);
    assert.ok(r.body.length < long.length);
    assert.match(r.body, /zkráceno/);
  });
});

describe('mapSwatchIdToLookOption', () => {
  it('maps known swatches', () => {
    assert.equal(mapSwatchIdToLookOption('fc-cyber'), 'Jak to je teď (tmavé cyber)');
    assert.equal(mapSwatchIdToLookOption('calm-green'), 'Světlé s klidnou zelenou');
    assert.equal(mapSwatchIdToLookOption('warm-gold'), 'Teplé zlaté / pískové');
    assert.equal(mapSwatchIdToLookOption('unknown-id'), null);
  });
});

describe('shouldOfferStatsEmailPrompt', () => {
  beforeEach(() => {
    mem.clear();
  });

  it('does not offer with empty history', () => {
    assert.equal(shouldOfferStatsEmailPrompt(0), false);
  });

  it('first offer needs at least 3 checks', () => {
    assert.equal(shouldOfferStatsEmailPrompt(2), false);
    assert.equal(shouldOfferStatsEmailPrompt(3), true);
  });

  it('respects permanent disable', () => {
    disableBannerPermanently();
    assert.equal(shouldOfferStatsEmailPrompt(10), false);
  });

  it('respects 7d interval after offer', () => {
    setReminderPref('7d');
    const now = 1_000_000_000_000;
    markStatsReportOffered(now);
    assert.equal(shouldOfferStatsEmailPrompt(10, now + 2 * 24 * 3600 * 1000), false);
    assert.equal(shouldOfferStatsEmailPrompt(10, now + 8 * 24 * 3600 * 1000), true);
  });

  it('1d pref allows sooner re-offer', () => {
    setReminderPref('1d');
    const now = 1_000_000_000_000;
    markStatsReportOffered(now);
    assert.equal(shouldOfferStatsEmailPrompt(5, now + 25 * 3600 * 1000), true);
  });
});

describe('buildDeviceMeta', () => {
  it('returns structure without throwing', () => {
    const m = buildDeviceMeta(new Date('2026-08-06T00:00:00.000Z'));
    assert.ok(m.generatedAt);
    assert.ok(m.appVersion);
    assert.ok(m.deviceIdShort.length <= 8 || m.deviceIdShort === 'n/a');
  });
});

// silence unused import lint for STORAGE_KEYS in case
void STORAGE_KEYS;
