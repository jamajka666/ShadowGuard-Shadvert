/**
 * Truth Contract + Rule Engine + AI validator unit tests (SGW-008 / D-022).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildFactBundle } from '../src/trust/facts.ts';
import { decideFromFacts } from '../src/trust/ruleEngine.ts';
import { validateAiPresentation } from '../src/trust/aiOutputValidator.ts';
import { mergeAnalysisResult, generalKnownServiceTips } from '../src/trust/mergeResult.ts';
import {
  isForbiddenSpeculationText,
  mapInternalVerdictToUi,
  RULES_VERSION_TRUTH,
} from '../src/trust/truthContract.ts';

describe('Truth Contract constants', () => {
  it('maps NEVIME to OPATRNOSTI for First Creation UI', () => {
    assert.equal(mapInternalVerdictToUi('NEVIME'), 'OPATRNOSTI');
    assert.equal(mapInternalVerdictToUi('PODVOD'), 'PODVOD');
  });

  it('detects forbidden speculation phrases', () => {
    assert.ok(isForbiddenSpeculationText('Toto je pravděpodobně podvod'));
    assert.ok(isForbiddenSpeculationText('Vypadá to jako oficiální obchod'));
    assert.equal(isForbiddenSpeculationText('Doména byla zaregistrována 21. 7. 2026.'), null);
  });

  it('exposes rules version for cache key stability', () => {
    assert.match(RULES_VERSION_TRUTH, /truth-contract/);
  });
});

describe('Rule Engine — TLD is SIGNAL only (TRUST-ENGINE-001)', () => {
  it('cheap TLD alone does not yield PODVOD', () => {
    const facts = buildFactBundle({
      url: 'https://super-akce.online/iphone',
      rawText: 'Prodám telefon ve skvělé ceně, osobní předání Praha',
      hasImage: false,
      sslDomainInfo: {
        domain: 'super-akce.online',
        isSslValid: true,
        domainAgeYears: 2,
      },
    });
    const d = decideFromFacts(facts);
    assert.notEqual(d.safetyLevel, 'PODVOD');
    assert.ok(d.signals.some((s) => s.signalId === 'sig-cheap-tld') || facts.cheapTld);
  });

  it('adversarial: .site / .xyz / .online alone never create PODVOD', () => {
    for (const host of ['akce.site', 'shop.xyz', 'deal.online']) {
      const facts = buildFactBundle({
        url: `https://${host}/`,
        rawText: 'Nabídka zboží, kontakt e-mailem',
        sslDomainInfo: { domain: host, isSslValid: true, domainAgeYears: 5 },
        // MEDIUM TLD from phishingValidator must NOT be passed as phishingMatched
        phishingMatched: false,
      });
      const d = decideFromFacts(facts);
      assert.notEqual(d.safetyLevel, 'PODVOD', `${host} must not be PODVOD alone`);
      assert.notEqual(d.safetyLevel, 'DUVERYHODNE', `${host} must not be auto-trusted`);
    }
  });

  it('MEDIUM TLD phishing flag must not be treated as hard match (contract note)', () => {
    // Simulates server mapping: only HIGH/kill → phishingMatched
    const soft = buildFactBundle({
      url: 'https://random-deal.online/',
      rawText: 'Běžná nabídka bez kurýra',
      sslDomainInfo: { domain: 'random-deal.online', isSslValid: true, domainAgeYears: 3 },
      phishingMatched: false,
    });
    assert.equal(decideFromFacts(soft).safetyLevel !== 'PODVOD', true);
    const hard = buildFactBundle({
      url: 'https://random-deal.online/',
      phishingMatched: true,
      phishingKilled: true,
      phishingPattern: 'real kill pattern',
    });
    assert.equal(decideFromFacts(hard).safetyLevel, 'PODVOD');
  });

  it('young domain + cheap TLD without scam markers stays OPATRNOSTI', () => {
    const facts = buildFactBundle({
      url: 'https://novy-shop.xyz',
      rawText: 'Nový e-shop s elektronikou',
      sslDomainInfo: {
        domain: 'novy-shop.xyz',
        isSslValid: true,
        domainAgeYears: 0.05,
      },
    });
    const d = decideFromFacts(facts);
    assert.equal(d.safetyLevel, 'OPATRNOSTI');
    assert.notEqual(d.internalVerdict, 'PODVOD');
  });
});

describe('Rule Engine — hard evidence', () => {
  it('phishing match yields PODVOD', () => {
    const facts = buildFactBundle({
      url: 'https://zasilkovna-platba-cz.online',
      phishingMatched: true,
      phishingKilled: true,
      phishingPattern: 'zasilkovna-platba',
    });
    const d = decideFromFacts(facts);
    assert.equal(d.safetyLevel, 'PODVOD');
    assert.equal(d.actionRecommendation, 'NEKUPOVAT_NEPLATIT');
  });

  it('known official host is PROKAZANO_OFICIALNI but NOT auto DUVERYHODNE', () => {
    const facts = buildFactBundle({
      url: 'https://www.bazos.cz/inzerat/123',
      rawText: 'Prodám kolo, osobní předání',
      sslDomainInfo: { domain: 'www.bazos.cz', isSslValid: true, domainAgeYears: 20 },
    });
    const d = decideFromFacts(facts);
    assert.equal(facts.officialDomainStatus, 'PROKAZANO_OFICIALNI');
    assert.equal(d.safetyLevel, 'OPATRNOSTI');
    assert.notEqual(d.safetyLevel, 'DUVERYHODNE');
    assert.match(d.reasoningTrace, /PROKAZANO_OFICIALNI|neprokazuje|≠/i);
  });

  it('adversarial: official domain + scam content → PODVOD never DUVERYHODNE', () => {
    const facts = buildFactBundle({
      url: 'https://www.bazos.cz/inzerat/999',
      rawText:
        'Kurýr vám pošle odkaz. Pro potvrzení přijetí zadejte číslo karty na platební stránce.',
      sslDomainInfo: { domain: 'www.bazos.cz', isSslValid: true, domainAgeYears: 20 },
    });
    const d = decideFromFacts(facts);
    assert.equal(facts.officialDomainStatus, 'PROKAZANO_OFICIALNI');
    assert.equal(d.safetyLevel, 'PODVOD');
    assert.notEqual(d.safetyLevel, 'DUVERYHODNE');
  });

  it('insufficient data yields NEVIME (UI OPATRNOSTI)', () => {
    const facts = buildFactBundle({});
    const d = decideFromFacts(facts);
    assert.equal(d.internalVerdict, 'NEVIME');
    assert.equal(d.safetyLevel, 'OPATRNOSTI');
    assert.equal(d.insufficientEvidence, true);
  });

  it('adversarial: UNKNOWN/NEVIME never maps to DUVERYHODNE', () => {
    const facts = buildFactBundle({ url: '', rawText: '', hasImage: false });
    const d = decideFromFacts(facts);
    assert.equal(d.internalVerdict, 'NEVIME');
    assert.notEqual(d.safetyLevel, 'DUVERYHODNE');
    assert.equal(d.safetyLevel, 'OPATRNOSTI');
  });

  it('NO_VERIFIED_THREAT_FOUND is not the same as DUVERYHODNE', () => {
    const facts = buildFactBundle({
      url: 'https://random-unknown-shop-example.cz',
      rawText: 'Prodáváme elektroniku',
      sslDomainInfo: {
        domain: 'random-unknown-shop-example.cz',
        isSslValid: true,
        domainAgeYears: 8,
      },
    });
    const d = decideFromFacts(facts);
    // Valid SSL + old domain + no phishing ≠ proven safe shop
    assert.notEqual(d.safetyLevel, 'DUVERYHODNE');
    assert.ok(
      facts.threatFinding === 'NO_VERIFIED_THREAT_FOUND' || facts.threatFinding === 'UNKNOWN'
    );
  });
});

describe('AI Output Validator kill switch', () => {
  const baseDecision = decideFromFacts(
    buildFactBundle({
      url: 'https://example.com',
      rawText: 'Nabídka',
      sslDomainInfo: { domain: 'example.com', isSslValid: true },
    })
  );

  it('rejects speculation phrases', () => {
    const v = validateAiPresentation(
      {
        headline: 'Test',
        summaryForSenior: 'Toto pravděpodobně bude v pořádku pro nákup.',
      },
      baseDecision,
      'NEOVERENO'
    );
    assert.equal(v.ok, false);
    if (!v.ok) assert.ok(v.reasons.some((r) => r.includes('forbidden')));
  });

  it('adversarial: rejects common false-confidence AI lines', () => {
    const attacks = [
      'Tento web je pravděpodobně bezpečný.',
      'Doména je pravděpodobně oficiální.',
      'Vypadá to jako oficiální obchod.',
      'Tento obchod je pravděpodobně bezpečný pro nákup.',
      'Je téměř jistě legitimní e-shop.',
    ];
    for (const summaryForSenior of attacks) {
      const v = validateAiPresentation(
        { headline: 'OK', summaryForSenior },
        baseDecision,
        'NEOVERENO'
      );
      assert.equal(v.ok, false, `should reject: ${summaryForSenior}`);
    }
  });

  it('rejects official claim without PROKAZANO_OFICIALNI', () => {
    const v = validateAiPresentation(
      {
        headline: 'Oficiální obchod',
        summaryForSenior: 'Jedná se o oficiální obchod společnosti X s plnou důvěrou.',
        urlAnalysis: { isOfficialDomain: true, officialDomainStatus: 'PROKAZANO_OFICIALNI' },
      },
      baseDecision,
      'NEOVERENO'
    );
    assert.equal(v.ok, false);
  });

  it('rejects AI softening of PODVOD', () => {
    const podvod = decideFromFacts(
      buildFactBundle({ phishingMatched: true, phishingKilled: true, url: 'https://evil.test' })
    );
    const v = validateAiPresentation(
      {
        headline: 'OK',
        summaryForSenior: 'Podle dostupných údajů není důvod k panice.',
        safetyLevel: 'DUVERYHODNE',
      },
      podvod,
      'NEOVERENO'
    );
    assert.equal(v.ok, false);
    if (!v.ok) assert.ok(v.reasons.some((r) => r.includes('soften')));
  });

  it('accepts clean presentation (headline+summary only)', () => {
    const v = validateAiPresentation(
      {
        headline: 'Vyžaduje opatrnost',
        summaryForSenior:
          'Nemáme dostatek ověřených údajů o prodejci. Doporučujeme osobní předání a neplatit předem.',
      },
      baseDecision,
      'NEOVERENO'
    );
    assert.equal(v.ok, true);
  });

  it('P0: rejects invented world-claims without "pravděpodobně"', () => {
    const cases = [
      'Prodejce má uvedené IČO a je v pořádku.',
      'Obchod má dlouhou historii a tisíce spokojených zákazníků.',
      'Jedná se o ověřený e-shop s garancí nákupu.',
    ];
    for (const summaryForSenior of cases) {
      const v = validateAiPresentation(
        { headline: 'OK', summaryForSenior },
        baseDecision,
        'NEOVERENO'
      );
      assert.equal(v.ok, false, `should reject: ${summaryForSenior}`);
    }
  });

  it('P0: rejects AI-supplied actionAdvice / structured claims', () => {
    const v = validateAiPresentation(
      {
        headline: 'Shrnutí',
        summaryForSenior: 'Nemáme dostatek ověřených údajů pro silné tvrzení.',
        actionAdvice: ['Buďte opatrní'],
        positiveFactors: [{ id: 'x', title: 'X', description: 'Y' }],
      },
      baseDecision,
      'NEOVERENO'
    );
    assert.equal(v.ok, false);
    if (!v.ok) {
      assert.ok(v.reasons.some((r) => /actionAdvice|positiveFactors/i.test(r)));
    }
  });

  it('adversarial: rejected AI must not be treated as pass', () => {
    const v = validateAiPresentation(
      {
        headline: 'Bezpečné',
        summaryForSenior: 'Obchod vypadá to jako oficiální a je pravděpodobně bezpečný.',
        safetyLevel: 'DUVERYHODNE',
      },
      baseDecision,
      'NEOVERENO'
    );
    assert.equal(v.ok, false);
  });
});

describe('P1 derived facts + server-owned claims', () => {
  it('domainAgeYears is DERIVED from creationDate fact', () => {
    const facts = buildFactBundle({
      url: 'https://example.com',
      sslDomainInfo: {
        domain: 'example.com',
        isSslValid: true,
        creationDate: '2018-01-01',
        domainAgeYears: 8,
      },
    });
    const age = facts.facts.find((f) => f.source === 'rdap_whois_derived');
    const creation = facts.facts.find((f) => f.source === 'rdap_whois');
    assert.ok(age);
    assert.equal(age!.verificationStatus, 'DERIVED');
    assert.ok(creation);
    assert.equal(creation!.verificationStatus, 'VERIFIED');
    assert.deepEqual(age!.derivedFromFactIds, [creation!.factId]);
  });

  it('mergeResult never passes AI claims; actionAdvice is server template', () => {
    const facts = buildFactBundle({
      url: 'https://www.bazos.cz/x',
      rawText: 'kolo',
      sslDomainInfo: { domain: 'www.bazos.cz', isSslValid: true, domainAgeYears: 20 },
    });
    const decision = decideFromFacts(facts);
    const merged = mergeAnalysisResult({
      url: 'https://www.bazos.cz/x',
      factBundle: facts,
      decision,
      ai: {
        headline: 'OK',
        summaryForSenior: 'Známá doména ze seznamu. Buďte opatrní u soukromého prodejce.',
        actionAdvice: ['AI vymyšlená rada s IČO'],
        positiveFactors: [
          { id: 'lie', title: 'IČO', description: 'Prodejce má IČO a dlouhou historii' },
        ],
        sellerChecks: ['Prodejce má IČO'],
        unverifiedClaims: ['AI tvrdí že firma nemá dluhy — neověřeno'],
      },
      aiAccepted: true,
      verdictSource: 'ai',
      rulesVersion: 'test',
    });
    assert.equal(decision.safetyLevel, 'OPATRNOSTI');
    const positives = merged.positiveFactors as { description?: string; title?: string }[];
    const seller = merged.sellerChecks as string[];
    const advice = merged.actionAdvice as string[];
    assert.ok(Array.isArray(positives));
    assert.ok(!positives.some((p) => /i[cč]o|dlouhou/i.test(String(p.description) + String(p.title))));
    assert.equal(seller.length, 0);
    assert.ok(!advice.some((a) => /AI vymyšlen|i[cč]o/i.test(a)));
    assert.ok(advice.length >= 1);
    assert.equal(merged.groundingIsNotEvidence, true);
    const unverified = merged.unverifiedClaims as string[];
    assert.ok(unverified.every((u) => !/dluhy/i.test(u)));
    assert.ok(unverified.some((u) => /IČO|prodejce/i.test(u)));
    const alts = merged.trustedAlternatives as { badge?: string; claimStatus?: string }[];
    assert.ok(alts.every((a) => a.claimStatus === 'GENERAL_KNOWN_SERVICE_NOT_VERDICT'));
    const visual = merged.eshopVisualAnalysis as { isEshopDetected?: boolean; visualInputPresent?: boolean };
    assert.equal(visual.isEshopDetected, false);
  });

  it('mergeResult phishing path uses server riskFactors with factIds', () => {
    const facts = buildFactBundle({
      url: 'https://zasilkovna-platba-cz.online/pay',
      phishingMatched: true,
      phishingKilled: true,
      phishingPattern: 'Falešná Zásilkovna',
    });
    const decision = decideFromFacts(facts);
    const merged = mergeAnalysisResult({
      factBundle: facts,
      decision,
      ai: null,
      aiAccepted: false,
      verdictSource: 'phishing_kill',
      rulesVersion: 'test',
    });
    assert.equal(merged.safetyLevel, 'PODVOD');
    assert.equal(merged.verdictSource, 'phishing_kill');
    const risks = merged.riskFactors as { factIds?: string[]; claimSource?: string }[];
    assert.ok(risks.length >= 1);
    assert.ok(risks.some((r) => r.claimSource === 'server_fact' || r.claimSource === 'rule_engine'));
    assert.match(String(merged.headline), /nebezpečn|Zastavte/i);
  });

  it('generalKnownServiceTips are not security verdicts', () => {
    const tips = generalKnownServiceTips();
    assert.ok(tips.length >= 2);
    assert.ok(tips.every((t) => /ne ověření|NENÍ/i.test(t.description + t.badge)));
  });
});
