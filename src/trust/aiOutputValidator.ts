/**
 * AI Output Validation / Rejection kill switch (SGW-008 §5, P0).
 *
 * AI is allowed ONLY: headline + summaryForSenior (presentation copy).
 * actionAdvice, riskFactors, positiveFactors, sellerChecks, alternatives,
 * unverifiedClaims are server-owned and discarded if present in AI payload.
 */

import {
  collectTextBlobs,
  containsUnsubstantiatedWorldClaim,
  isForbiddenSpeculationText,
  type OfficialDomainStatus,
  type UiSafetyLevel,
} from './truthContract';
import type { RuleDecision } from './ruleEngine';
import type { FactBundle } from './facts';

export type AiValidationResult =
  | { ok: true }
  | { ok: false; reasons: string[] };

export interface AiPresentationPayload {
  headline?: string;
  summaryForSenior?: string;
  /** @deprecated server-owned — if present and non-empty, rejected (attack surface) */
  actionAdvice?: string[] | unknown;
  actionRecommendation?: string;
  riskFactors?: unknown;
  positiveFactors?: unknown;
  sellerChecks?: unknown;
  trustedAlternatives?: unknown;
  unverifiedClaims?: unknown;
  priceEvaluation?: {
    isPriceSuspicious?: boolean;
    priceComment?: string;
    estimatedMarketPrice?: string;
    suggestedSearchTerm?: string;
  };
  urlAnalysis?: {
    domainName?: string;
    isOfficialDomain?: boolean;
    officialDomainStatus?: string;
    domainWarning?: string;
  };
  safetyLevel?: string;
  trustScore?: number;
  [key: string]: unknown;
}

/**
 * Validate AI presentation fields only (headline + summary).
 */
export function validateAiPresentation(
  ai: AiPresentationPayload | null | undefined,
  decision: RuleDecision,
  officialDomainStatus: OfficialDomainStatus,
  _factBundle?: FactBundle
): AiValidationResult {
  const reasons: string[] = [];

  if (!ai || typeof ai !== 'object') {
    return { ok: false, reasons: ['AI output missing or not an object'] };
  }

  if (!ai.summaryForSenior || typeof ai.summaryForSenior !== 'string' || ai.summaryForSenior.trim().length < 10) {
    reasons.push('summaryForSenior missing or too short');
  }
  if (!ai.headline || typeof ai.headline !== 'string' || ai.headline.trim().length < 3) {
    reasons.push('headline missing or too short');
  }

  // Reject AI trying to own structured claims / advice (schema should not ask for them)
  if (Array.isArray(ai.actionAdvice) && ai.actionAdvice.length > 0) {
    reasons.push('AI must not supply actionAdvice (server-owned templates only)');
  }
  if (Array.isArray(ai.riskFactors) && ai.riskFactors.length > 0) {
    reasons.push('AI must not supply riskFactors (server-owned from FACTS)');
  }
  if (Array.isArray(ai.positiveFactors) && ai.positiveFactors.length > 0) {
    reasons.push('AI must not supply positiveFactors (server-owned from FACTS)');
  }
  if (Array.isArray(ai.sellerChecks) && ai.sellerChecks.length > 0) {
    reasons.push('AI must not supply sellerChecks (server-owned)');
  }
  if (Array.isArray(ai.trustedAlternatives) && ai.trustedAlternatives.length > 0) {
    reasons.push('AI must not supply trustedAlternatives (server-owned)');
  }
  if (Array.isArray(ai.unverifiedClaims) && ai.unverifiedClaims.length > 0) {
    reasons.push('AI must not supply unverifiedClaims (server-owned)');
  }

  const presentationBlobs = [ai.headline, ai.summaryForSenior].filter(
    (x): x is string => typeof x === 'string'
  );

  for (const blob of presentationBlobs) {
    const hit = isForbiddenSpeculationText(blob);
    if (hit) {
      reasons.push(`forbidden speculation phrase matched: /${hit}/`);
      break;
    }
  }
  for (const blob of presentationBlobs) {
    const hit = containsUnsubstantiatedWorldClaim(blob);
    if (hit) {
      reasons.push(`unsubstantiated world-claim in presentation text: /${hit}/`);
      break;
    }
  }

  // Soften PODVOD
  if (decision.safetyLevel === 'PODVOD' && typeof ai.safetyLevel === 'string') {
    const aiLevel = ai.safetyLevel.toUpperCase() as UiSafetyLevel;
    if (aiLevel === 'DUVERYHODNE' || aiLevel === 'OPATRNOSTI') {
      reasons.push('AI attempted to soften Rule Engine PODVOD verdict');
    }
  }

  // Official claims in free text without status
  const officialClaim =
    ai.urlAnalysis?.isOfficialDomain === true ||
    ai.urlAnalysis?.officialDomainStatus === 'PROKAZANO_OFICIALNI' ||
    (typeof ai.summaryForSenior === 'string' &&
      /\boficiální\b/i.test(ai.summaryForSenior) &&
      !/\bnepodařilo se ověřit\b/i.test(ai.summaryForSenior) &&
      !/\bneověř/i.test(ai.summaryForSenior) &&
      !/\bznám(á|ou) (služb|domén)/i.test(ai.summaryForSenior));

  if (officialClaim && officialDomainStatus !== 'PROKAZANO_OFICIALNI') {
    reasons.push('claims official domain without PROKAZANO_OFICIALNI');
  }

  // Invented price in free text
  if (typeof ai.summaryForSenior === 'string' && /odpovídá trhu|tržní cena|cca \d+\s*kč/i.test(ai.summaryForSenior)) {
    reasons.push('asserts price claim without server verification');
  }

  const allBlobs = collectTextBlobs({ headline: ai.headline, summary: ai.summaryForSenior });
  if (allBlobs.some((b) => /\d+\s*%\s*bezpečn/i.test(b) || /100\s*%\s*safe/i.test(b))) {
    reasons.push('uses percent-safe metaphor forbidden by Truth Contract');
  }

  if (reasons.length > 0) {
    return { ok: false, reasons };
  }
  return { ok: true };
}
