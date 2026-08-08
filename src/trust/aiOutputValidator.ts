/**
 * AI Output Validation / Rejection kill switch (SGW-008 §5, P0).
 * Invalid or speculative AI output must NEVER be shown as-is.
 */

import {
  collectTextBlobs,
  isForbiddenSpeculationText,
  type OfficialDomainStatus,
  type UiSafetyLevel,
} from './truthContract';
import type { RuleDecision } from './ruleEngine';

export type AiValidationResult =
  | { ok: true }
  | { ok: false; reasons: string[] };

export interface AiPresentationPayload {
  headline?: string;
  summaryForSenior?: string;
  actionAdvice?: string[] | unknown;
  actionRecommendation?: string;
  riskFactors?: unknown;
  positiveFactors?: unknown;
  sellerChecks?: unknown;
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
 * Validate AI JSON against Truth Contract before any user-facing merge.
 */
export function validateAiPresentation(
  ai: AiPresentationPayload | null | undefined,
  decision: RuleDecision,
  officialDomainStatus: OfficialDomainStatus
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
  if (!Array.isArray(ai.actionAdvice) || ai.actionAdvice.length === 0) {
    reasons.push('actionAdvice must be a non-empty array');
  }

  // Banlist across all string fields
  const blobs = collectTextBlobs(ai);
  for (const blob of blobs) {
    const hit = isForbiddenSpeculationText(blob);
    if (hit) {
      reasons.push(`forbidden speculation phrase matched: /${hit}/`);
      break;
    }
  }

  // AI must not claim official without proof
  const officialClaim =
    ai.urlAnalysis?.isOfficialDomain === true ||
    ai.urlAnalysis?.officialDomainStatus === 'PROKAZANO_OFICIALNI' ||
    (typeof ai.summaryForSenior === 'string' &&
      /\boficiální\b/i.test(ai.summaryForSenior) &&
      !/\bnepodařilo se ověřit\b/i.test(ai.summaryForSenior) &&
      !/\bneověř/i.test(ai.summaryForSenior));

  if (officialClaim && officialDomainStatus !== 'PROKAZANO_OFICIALNI') {
    reasons.push('claims official domain without PROKAZANO_OFICIALNI');
  }

  // Invented market price without grounding — if estimatedMarketPrice looks precise and comment doesn't admit unknown
  const price = ai.priceEvaluation?.estimatedMarketPrice;
  const priceComment = ai.priceEvaluation?.priceComment || '';
  if (
    typeof price === 'string' &&
    price.trim().length > 0 &&
    !/nepodařilo se ověřit|neověř|není k dispozici|neznám/i.test(price + ' ' + priceComment)
  ) {
    // Soft: only reject if comment asserts market match with certainty language already caught by banlist
    // Additional: reject dollar amounts invented with "odpovídá trhu" style
    if (/odpovídá trhu|tržní cena je|běžná cena je/i.test(priceComment)) {
      reasons.push('asserts market price without verified source language');
    }
  }

  // AI proposed safetyLevel that softens hard PODVOD from rules
  if (decision.safetyLevel === 'PODVOD' && typeof ai.safetyLevel === 'string') {
    const aiLevel = ai.safetyLevel.toUpperCase() as UiSafetyLevel;
    if (aiLevel === 'DUVERYHODNE' || aiLevel === 'OPATRNOSTI') {
      reasons.push('AI attempted to soften Rule Engine PODVOD verdict');
    }
  }

  // Percent-safe metaphor
  if (blobs.some((b) => /\d+\s*%\s*bezpečn/i.test(b) || /100\s*%\s*safe/i.test(b))) {
    reasons.push('uses percent-safe metaphor forbidden by Truth Contract');
  }

  if (reasons.length > 0) {
    return { ok: false, reasons };
  }
  return { ok: true };
}
