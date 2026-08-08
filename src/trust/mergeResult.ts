/**
 * Merge Rule Engine decision + optional validated AI presentation into AdCheckResult shape.
 *
 * PR #1 P0: free-form AI claim arrays are NOT trusted as facts.
 * Server rebuilds riskFactors / positiveFactors / sellerChecks / trustedAlternatives
 * from FACTS + Rule Engine only. AI may only supply presentation copy (headline, summary, advice).
 */

import type { FactBundle } from './facts';
import type { RuleDecision } from './ruleEngine';
import { templatePresentation } from './ruleEngine';
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
        'Přesná shoda s interním seznamem. Neznamená to automaticky, že konkrétní prodejce nebo inzerát je bez rizika.',
      factIds: f ? [f.factId] : [],
      claimSource: 'server_fact',
    });
  }

  if (factBundle.sslValid === true) {
    const f = factBundle.facts.find((x) => x.source === 'server_tls_probe' && /platný/i.test(x.fact));
    out.push({
      id: f?.factId || 'pf-tls',
      title: 'TLS/SSL certifikát je podle měření platný',
      description: 'Technický fakt o šifrování spojení — ne důkaz důvěryhodnosti obchodu.',
      factIds: f ? [f.factId] : [],
      claimSource: 'server_fact',
    });
  }

  return out;
}

/** General known services — explicitly NOT a security verdict for this offer. */
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
  const tpl = templatePresentation(decision, factBundle.hostname);

  const useAi = aiAccepted && ai;
  const headline = useAi && ai.headline ? String(ai.headline) : tpl.headline;
  const summaryForSenior =
    useAi && ai.summaryForSenior ? String(ai.summaryForSenior) : tpl.summaryForSenior;
  const actionAdvice =
    useAi && Array.isArray(ai.actionAdvice) && ai.actionAdvice.length > 0
      ? (ai.actionAdvice as string[])
      : tpl.actionAdvice;

  // P0: structured claims ONLY from server FACTS + Rule Engine
  const riskFactors = buildRiskFactorsFromEngine(decision, factBundle);
  const positiveFactors = buildPositiveFactorsFromFacts(factBundle);
  const sellerChecks: string[] = []; // never invent seller checks without evidence module

  const isOfficial = factBundle.officialDomainStatus === 'PROKAZANO_OFICIALNI';

  const groundingCandidates = (opts.groundingSources || []).map((g) => ({
    title: g.title,
    url: g.url,
    role: 'grounding_candidate' as const,
    note: 'Kandidát na kontrolu — NENÍ automaticky ověřený důkaz serveru.',
  }));

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
      domainWarning:
        decision.safetyLevel === 'PODVOD'
          ? 'Tato doména nebo nabídka je podle ověřených znaků nebezpečná.'
          : factBundle.officialDomainStatus === 'NEOVERENO'
            ? 'Nepodařilo se ověřit, že jde o oficiální doménu.'
            : undefined,
    },
    priceEvaluation: {
      isPriceSuspicious: decision.safetyLevel === 'PODVOD',
      // Never take invented market price from AI into user payload
      priceComment: 'Cenu se nepodařilo ověřit z dostupných serverových důkazů.',
      estimatedMarketPrice: undefined,
      suggestedSearchTerm:
        useAi && ai.priceEvaluation?.suggestedSearchTerm
          ? String(ai.priceEvaluation.suggestedSearchTerm).slice(0, 80)
          : undefined,
    },
    eshopVisualAnalysis: {
      // Visual claims from AI are not server-verified evidence — keep minimal
      isEshopDetected: Boolean(factBundle.hasImage),
      designComment: factBundle.hasImage
        ? 'Snímek byl přiložen. Vizuální „důvěryhodnost“ bez samostatného měření neprohlašujeme za ověřený fakt.'
        : undefined,
    },
    trustedAlternatives: generalKnownServiceTips(),
    sslDomainInfo: opts.sslDomainInfo,
    // P1: grounding ≠ evidence
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
    unverifiedClaims: useAi && Array.isArray(ai.unverifiedClaims) ? ai.unverifiedClaims : [],
    reasoningTrace: decision.reasoningTrace,
    scoreBreakdown: decision.scoreBreakdown,
    internalVerdict: decision.internalVerdict,
    threatFinding: factBundle.threatFinding,
    trustScoreLabel: 'Interní skóre podle našich pravidel (ne procento bezpečnosti)',
    claimsPolicy:
      'User-facing structured claims (risk/positive/seller/alternatives) are server-built from FACTS+rules only. AI may only phrase headline/summary/advice.',
    isFallback: !useAi,
    rulesVersion: opts.rulesVersion,
    verdictSource: opts.verdictSource,
    cached: false,
  };
}
