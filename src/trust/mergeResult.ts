/**
 * Merge Rule Engine decision + optional validated AI presentation into AdCheckResult shape.
 */

import type { FactBundle } from './facts';
import type { RuleDecision } from './ruleEngine';
import { templatePresentation } from './ruleEngine';
import type { AiPresentationPayload } from './aiOutputValidator';

export type VerdictSource =
  | 'phishing_kill'
  | 'hybrid_rules'
  | 'ai'
  | 'ai_rejected'
  | 'cache';

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

  const riskFactors =
    useAi && Array.isArray(ai.riskFactors) && ai.riskFactors.length > 0
      ? ai.riskFactors
      : decision.signals.map((s, i) => ({
          id: s.signalId || `sig-${i}`,
          severity: 'STREDNI' as const,
          title: s.label,
          description: 'Podpůrný signál podle našich pravidel — sám o sobě neznamená podvod.',
        }));

  const positiveFactors =
    useAi && Array.isArray(ai.positiveFactors) ? ai.positiveFactors : [];

  const sellerChecks =
    useAi && Array.isArray(ai.sellerChecks) ? ai.sellerChecks : [];

  const isOfficial = factBundle.officialDomainStatus === 'PROKAZANO_OFICIALNI';

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
      domainName: factBundle.hostname || (useAi && ai?.urlAnalysis?.domainName) || '—',
      isOfficialDomain: isOfficial,
      officialDomainStatus: factBundle.officialDomainStatus,
      domainWarning:
        decision.safetyLevel === 'PODVOD'
          ? 'Tato doména nebo nabídka je podle ověřených znaků nebezpečná.'
          : factBundle.officialDomainStatus === 'NEOVERENO'
            ? 'Nepodařilo se ověřit, že jde o oficiální doménu.'
            : undefined,
    },
    priceEvaluation: useAi && ai.priceEvaluation
      ? {
          isPriceSuspicious: Boolean(ai.priceEvaluation.isPriceSuspicious),
          priceComment:
            ai.priceEvaluation.priceComment ||
            'Cenu se nepodařilo ověřit z dostupných důkazů.',
          estimatedMarketPrice: ai.priceEvaluation.estimatedMarketPrice,
          suggestedSearchTerm: ai.priceEvaluation.suggestedSearchTerm,
        }
      : {
          isPriceSuspicious: decision.safetyLevel === 'PODVOD',
          priceComment: 'Cenu se nepodařilo ověřit z dostupných důkazů.',
        },
    eshopVisualAnalysis: useAi && ai.eshopVisualAnalysis
      ? ai.eshopVisualAnalysis
      : {
          isEshopDetected: Boolean(factBundle.hasImage),
        },
    trustedAlternatives: useAi && Array.isArray(ai.trustedAlternatives)
      ? ai.trustedAlternatives
      : [
          {
            name: 'Heureka.cz',
            url: 'https://www.heureka.cz',
            description: 'Srovnání cen u ověřených obchodníků.',
            badge: 'Srovnávač',
          },
          {
            name: 'Alza.cz',
            url: 'https://www.alza.cz',
            description: 'Dlouhodobě známý český e-shop.',
            badge: 'Známý prodejce',
          },
        ],
    sslDomainInfo: opts.sslDomainInfo,
    groundingSources: opts.groundingSources,
    evidenceFacts: factBundle.facts.map((f) => ({
      fact: f.fact,
      source: f.source,
      verificationStatus: f.verificationStatus,
      factId: f.factId,
    })),
    unverifiedClaims: useAi && Array.isArray(ai.unverifiedClaims) ? ai.unverifiedClaims : [],
    reasoningTrace: decision.reasoningTrace,
    scoreBreakdown: decision.scoreBreakdown,
    internalVerdict: decision.internalVerdict,
    threatFinding: factBundle.threatFinding,
    trustScoreLabel: 'Interní skóre podle našich pravidel (ne procento bezpečnosti)',
    isFallback: !useAi,
    rulesVersion: opts.rulesVersion,
    verdictSource: opts.verdictSource,
    cached: false,
  };
}
