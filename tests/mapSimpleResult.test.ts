import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mapSimpleResult, exampleSimpleResults } from '../src/design-v2/mapSimpleResult';
import type { AdCheckResult } from '../src/types';

function base(partial: Partial<AdCheckResult> & Pick<AdCheckResult, 'safetyLevel'>): AdCheckResult {
  return {
    id: 't1',
    timestamp: Date.now(),
    trustScore: 50,
    headline: '',
    summaryForSenior: '',
    actionRecommendation: 'POUZE_OSOBNI_PREDANI',
    actionAdvice: [],
    riskFactors: [],
    positiveFactors: [],
    sellerChecks: [],
    urlAnalysis: { domainName: 'example.com', isOfficialDomain: false },
    priceEvaluation: { isPriceSuspicious: false, priceComment: '' },
    ...partial,
  };
}

describe('mapSimpleResult', () => {
  it('uses fallbacks for empty human fields', () => {
    const m = mapSimpleResult(base({ safetyLevel: 'PODVOD' }));
    assert.equal(m.badgeLabel, 'Podvod');
    assert.match(m.mainVerdict, /podvod/i);
    assert.ok(m.reasons.length >= 2);
    assert.ok(m.advice.length > 10);
  });

  it('prefers headline and risk titles', () => {
    const m = mapSimpleResult(
      base({
        safetyLevel: 'OPATRNOSTI',
        headline: 'Cena je podezřele nízká.',
        riskFactors: [
          { id: '1', severity: 'STREDNI', title: 'Nová doména', description: 'x' },
          { id: '2', severity: 'NIZKE', title: 'Chybí kontakt', description: 'y' },
        ],
        actionAdvice: ['Neposílejte peníze předem.'],
      })
    );
    assert.equal(m.mainVerdict, 'Cena je podezřele nízká.');
    assert.deepEqual(m.reasons, ['Nová doména', 'Chybí kontakt']);
    assert.match(m.advice, /Neposílejte/);
  });

  it('example set has three states', () => {
    const ex = exampleSimpleResults();
    assert.equal(ex.length, 3);
    assert.deepEqual(
      ex.map((e) => e.status),
      ['DUVERYHODNE', 'OPATRNOSTI', 'PODVOD']
    );
  });
});
