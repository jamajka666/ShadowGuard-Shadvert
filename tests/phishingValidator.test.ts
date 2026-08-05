import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { checkPhishingUrl } from '../src/utils/phishingValidator.ts';

/**
 * Golden hybrid path: same malicious URL must always kill before Gemini
 * with PODVOD-class signal (isKilledBeforeGemini).
 */
describe('phishingValidator golden (Trust Engine hybrid)', () => {
  const killCases = [
    'https://zasilkovna-platba-cz.online/pay',
    'http://dpd-kuryr-platba.xyz/form',
    'https://bazos.cz.secure-pay.xyz/login',
    'http://45.142.214.11/steal',
    'https://bazoos.cz/inzerat',
  ];

  for (const url of killCases) {
    it(`kills before Gemini: ${url}`, () => {
      const r = checkPhishingUrl(url);
      assert.equal(r.isPhishing, true);
      assert.equal(r.isKilledBeforeGemini, true);
      assert.equal(r.severity, 'HIGH');
    });
  }

  const safeCases = [
    'https://www.bazos.cz/inzerat/123',
    'https://sbazar.cz/',
    'https://www.alza.cz/product',
    'https://www.zasilkovna.cz/',
  ];

  for (const url of safeCases) {
    it(`allows legit domain: ${url}`, () => {
      const r = checkPhishingUrl(url);
      assert.equal(r.isPhishing, false);
      assert.equal(r.severity, 'SAFE');
    });
  }
});
