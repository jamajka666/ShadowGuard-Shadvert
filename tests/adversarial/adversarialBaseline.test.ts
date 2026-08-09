/**
 * Adversarial Lab baseline — regression that Truth Contract must not regress.
 * Full matrix: Initiative SGW-009 / docs/ADVERSARIAL-LAB.md
 *
 * These are ATTACK scenarios with expected BLOCKED outcomes (already proven).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildFactBundle, assertNoOrphanEvidence, assertVerifiedFactsHaveEvidence } from '../../src/trust/facts.ts';
import { decideFromFacts } from '../../src/trust/ruleEngine.ts';
import { validateAiPresentation } from '../../src/trust/aiOutputValidator.ts';
import { buildWhyPanel } from '../../src/trust/whyPanel.ts';
import { mergeAnalysisResult } from '../../src/trust/mergeResult.ts';

describe('ADV baseline — Truth Contract must survive known attacks', () => {
  it('ADV-006: cheap TLD alone must not force PODVOD', () => {
    const b = buildFactBundle({
      url: 'https://totally-unique-shop-xyz.online/',
      rawText: 'Prodám telefon, osobní předání Praha',
      sslDomainInfo: { domain: 'totally-unique-shop-xyz.online', isSslValid: true, domainAgeYears: 3 },
      phishingChecked: true,
      phishingMatched: false,
    });
    const d = decideFromFacts(b);
    assert.notEqual(d.safetyLevel, 'PODVOD');
    assert.notEqual(d.safetyLevel, 'DUVERYHODNE');
  });

  it('ADV-007: official host alone must not force DUVERYHODNE', () => {
    const b = buildFactBundle({
      url: 'https://www.bazos.cz/inzerat/1',
      rawText: 'Prodám kolo',
      sslDomainInfo: { domain: 'www.bazos.cz', isSslValid: true, domainAgeYears: 20 },
      phishingChecked: true,
    });
    const d = decideFromFacts(b);
    assert.equal(b.officialDomainStatus, 'PROKAZANO_OFICIALNI');
    assert.notEqual(d.safetyLevel, 'DUVERYHODNE');
    assert.equal(d.safetyLevel, 'OPATRNOSTI');
  });

  it('ADV-008: educational scam article must not force PODVOD', () => {
    const b = buildFactBundle({
      rawText:
        'Článek: Jak funguje podvod. Pozor, podvodníci často píší: „Kurýr vám pošle odkaz a zadejte číslo karty.“ Nikdy to nedělejte.',
      phishingChecked: false,
    });
    assert.equal(b.educationalScamFraming, true);
    assert.notEqual(decideFromFacts(b).safetyLevel, 'PODVOD');
  });

  it('ADV-011/012: AI overclaim / soften PODVOD must be rejected', () => {
    const podvod = decideFromFacts(
      buildFactBundle({
        url: 'https://evil.test',
        phishingChecked: true,
        phishingMatched: true,
        phishingKilled: true,
      })
    );
    const soft = validateAiPresentation(
      {
        headline: 'OK',
        summaryForSenior: 'Toto je pravděpodobně bezpečné a prodejce má IČO.',
        safetyLevel: 'DUVERYHODNE',
      },
      podvod,
      'NEOVERENO'
    );
    assert.equal(soft.ok, false);
  });

  it('ADV-014: TLS+age+no phish must not become DUVERYHODNE (A3 combo lite)', () => {
    const b = buildFactBundle({
      url: 'https://long-lived-unknown-shop.example/',
      rawText: 'Kvalitní zboží, rychlé doručení',
      sslDomainInfo: {
        domain: 'long-lived-unknown-shop.example',
        isSslValid: true,
        creationDate: '2012-01-01',
        domainAgeYears: 14,
      },
      phishingChecked: true,
      phishingMatched: false,
    });
    assert.equal(b.threatFinding, 'NO_VERIFIED_THREAT_FOUND');
    assert.notEqual(decideFromFacts(b).safetyLevel, 'DUVERYHODNE');
  });

  it('ADV-017: phishing WhyPanel is NALEZENO not SELHALO', () => {
    const b = buildFactBundle({
      url: 'https://zasilkovna-platba-cz.online/pay',
      phishingChecked: true,
      phishingMatched: true,
      phishingKilled: true,
      phishingPattern: 'Falešná Zásilkovna',
    });
    const d = decideFromFacts(b);
    const why = buildWhyPanel(b, { ...d, actionAdvice: ['Nic neplaťte.'] });
    const ph = why.checks.find((c) => c.id === 'phishing');
    assert.equal(ph?.status, 'NALEZENO');
    assert.equal(ph?.statusLabel, 'Nalezena shoda');
    assert.notEqual(ph?.status, 'SELHALO');
  });

  it('ADV-018: evidence graph has no orphans under attack-like text input', () => {
    const b = buildFactBundle({
      url: 'https://www.bazos.cz/x',
      rawText: 'Kurýr zadejte číslo karty anydesk',
      sslDomainInfo: { domain: 'www.bazos.cz', isSslValid: true },
      phishingChecked: true,
    });
    assert.deepEqual(assertVerifiedFactsHaveEvidence(b), []);
    assert.deepEqual(assertNoOrphanEvidence(b), []);
  });

  it('ADV-A3 merge: whyPanel always offers help when OPATRNOSTI (NO-VERDICT ≠ NO-HELP)', () => {
    const b = buildFactBundle({
      url: 'https://example.com/',
      rawText: 'Nabídka',
      sslDomainInfo: { domain: 'example.com', isSslValid: true },
      phishingChecked: true,
    });
    const d = decideFromFacts(b);
    const m = mergeAnalysisResult({
      factBundle: b,
      decision: d,
      ai: null,
      aiAccepted: false,
      verdictSource: 'hybrid_rules',
      rulesVersion: 'adv-lab',
    });
    assert.equal(m.noVerdictIsNotNoHelp, true);
    const why = m.whyPanel as { show: boolean; recommendations: string[] };
    assert.equal(why.show, true);
    assert.ok(why.recommendations.length >= 1);
  });
});
