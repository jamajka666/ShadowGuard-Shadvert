/**
 * Merge Rule Engine decision + optional validated AI presentation into AdCheckResult shape.
 *
 * Canonical path only: FACTS → Rule Engine → mergeResult → USER.
 * AI may only supply headline + summaryForSenior after validation.
 * actionAdvice, claims, alternatives, unverifiedClaims = server-owned.
 */

import type { FactBundle } from './facts';
import type { RuleDecision } from './ruleEngine';
import { buildUnverifiedClaims, templatePresentation } from './ruleEngine';
import type { AiPresentationPayload } from './aiOutputValidator';
import { GENERAL_KNOWN_SERVICE_TIPS } from './truthContract';

export type VerdictSource =
  | 'phishing_kill'
  | 'hybrid_rules'
  | 'ai'
  | 'ai_rejected'
  | 'cache';

function buildRiskFactorsFromEngine(decision: RuleDecision, factBundle: FactBundle) {
  const fromSignals = decision.signals.map((s, i) => ({
    id: s.signalId || `sig-${i}`,
    severity: 'STREDNI' as const,
    title: s.label,
    description:
      'Podpůrný signál podle našich pravidel — sám o sobě neznamená podvod (SIGNAL, ne verdikt).',
    factIds: [] as string[],
    claimSource: 'rule_engine_signal' as const,
  }));

  const fromFacts = factBundle.facts
    .filter((f) => f.verificationStatus === 'VERIFIED' || f.verificationStatus === 'DERIVED')
    .filter(
      (f) =>
        /phishing|neplatn|TLS|SSRF|podvod/i.test(f.fact) ||
        f.source === 'phishing_validator' ||
        f.source === 'ssrf_guard'
    )
    .map((f) => ({
      id: f.factId,
      severity: (f.source === 'phishing_validator' ? 'VYSOKE' : 'STREDNI') as 'VYSOKE' | 'STREDNI',
      title: f.fact.slice(0, 80),
      description: `Zdroj: ${f.source} · ${f.verificationStatus}`,
      factIds: [f.factId],
      claimSource: 'server_fact' as const,
    }));

  if (decision.safetyLevel === 'PODVOD' && fromSignals.length === 0 && fromFacts.length === 0) {
    return [
      {
        id: 'rf-engine',
        severity: 'VYSOKE' as const,
        title: 'Pravidla vyhodnotila nabídku jako nebezpečnou',
        description: decision.reasoningTrace,
        factIds: [] as string[],
        claimSource: 'rule_engine' as const,
      },
    ];
  }

  return [...fromFacts, ...fromSignals];
}

function buildPositiveFactorsFromFacts(factBundle: FactBundle) {
  const out: {
    id: string;
    title: string;
    description: string;
    factIds: string[];
    claimSource: 'server_fact';
  }[] = [];

  if (factBundle.knownOfficialHost) {
    const f = factBundle.facts.find((x) => x.source === 'official_host_list' && x.verificationStatus === 'VERIFIED');
    out.push({
      id: f?.factId || 'pf-official',
      title: 'Hostname je na seznamu dlouhodobě známých služeb',
      description:
        'PROKAZANO_OFICIALNI = identita domény. Není to důkaz, že konkrétní inzerát, prodejce nebo zpráva je bezpečná.',
      factIds: f ? [f.factId] : [],
      claimSource: 'server_fact',
    });
  }

  if (factBundle.sslValid === true) {
    const f = factBundle.facts.find((x) => x.source === 'server_tls_probe' && /platný/i.test(x.fact));
    out.push({
      id: f?.factId || 'pf-tls',
      title: 'TLS/SSL certifikát je podle měření platný',
      description: 'Technický fakt o šifrování spojení — ne důkaz důvěryhodnosti obchodu ani nabídky.',
      factIds: f ? [f.factId] : [],
      claimSource: 'server_fact',
    });
  }

  return out;
}

export function generalKnownServiceTips() {
  return GENERAL_KNOWN_SERVICE_TIPS.map((t) => ({
    ...t,
    claimStatus: 'GENERAL_KNOWN_SERVICE_NOT_VERDICT' as const,
  }));
}

export function mergeAnalysisResult(opts: {
  url?: string;
  rawText?: string;
  factBundle: FactBundle;
  decision: RuleDecision;
  ai?: AiPresentationPayload | null;
  aiAccepted: boolean;
  sslDomainInfo?: unknown;
  groundingSources?: { title: string; url: string }[];
  verdictSource: VerdictSource;
  rulesVersion: string;
}): Record<string, unknown> {
  const { factBundle, decision, ai, aiAccepted, url, rawText } = opts;
  const tpl = templatePresentation(decision, factBundle.hostname, {
    phishingPattern: factBundle.phishingPattern,
    knownOfficialHost: factBundle.knownOfficialHost,
  });

  // AI: only headline + summary after validator pass (never actionAdvice / claims)
  const useAi = aiAccepted && ai;
  const headline = useAi && ai.headline ? String(ai.headline) : tpl.headline;
  const summaryForSenior =
    useAi && ai.summaryForSenior ? String(ai.summaryForSenior) : tpl.summaryForSenior;
  const actionAdvice = tpl.actionAdvice;

  const riskFactors = buildRiskFactorsFromEngine(decision, factBundle);
  const positiveFactors = buildPositiveFactorsFromFacts(factBundle);
  const sellerChecks: string[] = [];
  const isOfficial = factBundle.officialDomainStatus === 'PROKAZANO_OFICIALNI';

  const groundingCandidates = (opts.groundingSources || []).map((g) => ({
    title: g.title,
    url: g.url,
    role: 'grounding_candidate' as const,
    note: 'Kandidát na kontrolu — NENÍ automaticky ověřený důkaz serveru.',
  }));

  const domainWarning =
    decision.safetyLevel === 'PODVOD'
      ? factBundle.phishingMatched
        ? `DETEKOVÁN PHISHING: ${factBundle.phishingPattern || 'shoda v databázi'}`
        : 'Tato doména nebo nabídka je podle ověřených znaků nebezpečná.'
      : factBundle.officialDomainStatus === 'NEOVERENO'
        ? 'Nepodařilo se ověřit, že jde o oficiální doménu.'
        : factBundle.knownOfficialHost
          ? 'Doména je známá, ale konkrétní nabídka není prokázána jako bezpečná.'
          : undefined;

  return {
    id: 'res-' + Date.now(),
    timestamp: Date.now(),
    inputUrl: url,
    inputSnippet: rawText,
    safetyLevel: decision.safetyLevel,
    trustScore: decision.trustScore,
    headline,
    summaryForSenior,
    actionRecommendation: decision.actionRecommendation,
    actionAdvice,
    riskFactors,
    positiveFactors,
    sellerChecks,
    urlAnalysis: {
      domainName: factBundle.hostname || '—',
      isOfficialDomain: isOfficial,
      officialDomainStatus: factBundle.officialDomainStatus,
      domainWarning,
    },
    priceEvaluation: {
      // Only set true when we have dedicated price evidence (none yet)
      isPriceSuspicious: undefined,
      priceComment: 'Cenu se nepodařilo ověřit z dostupných serverových důkazů.',
      estimatedMarketPrice: undefined,
      suggestedSearchTerm: undefined,
    },
    eshopVisualAnalysis: {
      visualInputPresent: Boolean(factBundle.hasImage),
      // Do not claim e-shop detection from mere image presence
      isEshopDetected: false,
      designComment: factBundle.hasImage
        ? 'Byl přiložen vizuální vstup. Neprohlašujeme, že jde o e-shop, ani vizuální důvěryhodnost jako ověřený fakt.'
        : undefined,
    },
    trustedAlternatives: generalKnownServiceTips(),
    sslDomainInfo: opts.sslDomainInfo,
    groundingSources: groundingCandidates.length > 0 ? groundingCandidates : undefined,
    groundingIsNotEvidence: true,
    groundingNote:
      'Grounding (např. Google Search u modelu) je kandidát ke kontrole, nikoli automatický certifikát pravdy. Server-verified evidence je v evidenceFacts.',
    evidenceFacts: factBundle.facts.map((f) => ({
      fact: f.fact,
      source: f.source,
      verificationStatus: f.verificationStatus,
      factId: f.factId,
      evidenceIds: f.evidenceIds,
      derivedFromFactIds: f.derivedFromFactIds,
    })),
    evidence: factBundle.evidence,
    unverifiedClaims: buildUnverifiedClaims(factBundle),
    reasoningTrace: decision.reasoningTrace,
    scoreBreakdown: decision.scoreBreakdown,
    internalVerdict: decision.internalVerdict,
    threatFinding: factBundle.threatFinding,
    trustScoreLabel: 'Interní skóre podle našich pravidel (ne procento bezpečnosti)',
    claimsPolicy:
      'Structured claims + actionAdvice are server-built from FACTS+rules only. AI may only phrase headline/summary after validation. PROKAZANO_OFICIALNI ≠ PROKAZANO_BEZPECNE.',
    isFallback: !useAi,
    rulesVersion: opts.rulesVersion,
    verdictSource: opts.verdictSource,
    cached: false,
  };
}
