/**
 * AI Output Validation / Rejection kill switch (SGW-008 §5, P0).
 * Invalid or speculative AI output must NEVER be shown as-is.
 *
 * PR #1 review: banlist alone is insufficient — unsubstantiated world-claims
 * (IČO, "ověřený obchod", long history…) must also fail, even without
 * "pravděpodobně". Structured claim arrays from AI are not trusted;
 * server rebuilds them from FACTS (see mergeResult).
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
  actionAdvice?: string[] | unknown;
  actionRecommendation?: string;
  riskFactors?: unknown;
  positiveFactors?: unknown;
  sellerChecks?: unknown;
  trustedAlternatives?: unknown;
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
 * @param knownFactIds — if provided, any AI structured claim with factIds must reference these.
 */
export function validateAiPresentation(
  ai: AiPresentationPayload | null | undefined,
  decision: RuleDecision,
  officialDomainStatus: OfficialDomainStatus,
  factBundle?: FactBundle
): AiValidationResult {
  const reasons: string[] = [];
  const knownFactIds = new Set((factBundle?.facts || []).map((f) => f.factId));

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

  // Banlist + unsubstantiated world-claims across free-text presentation fields only
  // (structured arrays are discarded by merge — still scan so reject is loud)
  const presentationBlobs = [
    ai.headline,
    ai.summaryForSenior,
    ...(Array.isArray(ai.actionAdvice) ? (ai.actionAdvice as unknown[]).map(String) : []),
    ai.priceEvaluation?.priceComment,
    ai.priceEvaluation?.estimatedMarketPrice,
  ].filter((x): x is string => typeof x === 'string');

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

  // Full payload banlist (catch leaks in discarded arrays that indicate bad model behavior)
  const allBlobs = collectTextBlobs(ai);
  for (const blob of allBlobs) {
    const hit = isForbiddenSpeculationText(blob);
    if (hit) {
      reasons.push(`forbidden speculation phrase in payload: /${hit}/`);
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

  // Any non-empty estimated market price without explicit "neověřeno" is inventing
  const price = ai.priceEvaluation?.estimatedMarketPrice;
  const priceComment = ai.priceEvaluation?.priceComment || '';
  if (typeof price === 'string' && price.trim().length > 0) {
    if (!/nepodařilo se ověřit|neověř|není k dispozici|neznám/i.test(price + ' ' + priceComment)) {
      reasons.push('estimatedMarketPrice without explicit unverified language (invented price claim)');
    }
  }
  if (/odpovídá trhu|tržní cena je|běžná cena je/i.test(priceComment)) {
    reasons.push('asserts market price without verified source language');
  }

  // Structured AI claim arrays: if present, each entry must bind factIds to known facts
  const claimArrays: { name: string; value: unknown }[] = [
    { name: 'riskFactors', value: ai.riskFactors },
    { name: 'positiveFactors', value: ai.positiveFactors },
    { name: 'sellerChecks', value: ai.sellerChecks },
  ];
  for (const { name, value } of claimArrays) {
    if (!Array.isArray(value) || value.length === 0) continue;
    for (let i = 0; i < value.length; i++) {
      const item = value[i];
      // sellerChecks may be strings — strings without factIds are unsubstantiated claims
      if (typeof item === 'string') {
        reasons.push(`${name}[${i}] is bare string claim without factIds (use server FACTS only)`);
        continue;
      }
      if (!item || typeof item !== 'object') {
        reasons.push(`${name}[${i}] invalid shape`);
        continue;
      }
      const rec = item as Record<string, unknown>;
      const factIds = rec.factIds;
      if (!Array.isArray(factIds) || factIds.length === 0) {
        reasons.push(`${name}[${i}] missing factIds binding (claim→fact→evidence required)`);
        continue;
      }
      for (const id of factIds) {
        if (typeof id !== 'string' || !knownFactIds.has(id)) {
          reasons.push(`${name}[${i}] factId not in server FACTS: ${String(id)}`);
        }
      }
      // still ban world-claims in description even with factIds if text invents extra
      const textBits = [rec.title, rec.description, rec.fact].filter((x) => typeof x === 'string') as string[];
      for (const t of textBits) {
        // Allow restating if factIds present; only catch inventable extras that fact cannot cover
        // Keep strict: unsubstantiated patterns still blocked unless single-fact echo is short
        if (containsUnsubstantiatedWorldClaim(t) && !factIdsCoverClaim(t, factBundle)) {
          reasons.push(`${name}[${i}] unsubstantiated claim not covered by bound facts`);
        }
      }
    }
  }

  // trustedAlternatives from AI: only allow known names; descriptions must not claim verification
  if (Array.isArray(ai.trustedAlternatives)) {
    for (let i = 0; i < ai.trustedAlternatives.length; i++) {
      const alt = ai.trustedAlternatives[i] as Record<string, unknown>;
      if (!alt || typeof alt !== 'object') {
        reasons.push(`trustedAlternatives[${i}] invalid`);
        continue;
      }
      const name = String(alt.name || '');
      const desc = String(alt.description || '');
      if (!/heureka|alza|datart|bazoš|bazos|sbazar/i.test(name)) {
        reasons.push(`trustedAlternatives[${i}] invents non-whitelisted service: ${name}`);
      }
      if (/ověřen|bezpečn|garant|důvěryhodn/i.test(desc) && !/ne ověření|není.*verdikt|obecn/i.test(desc)) {
        reasons.push(`trustedAlternatives[${i}] presents service as security verification`);
      }
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
  if (allBlobs.some((b) => /\d+\s*%\s*bezpečn/i.test(b) || /100\s*%\s*safe/i.test(b))) {
    reasons.push('uses percent-safe metaphor forbidden by Truth Contract');
  }

  if (reasons.length > 0) {
    return { ok: false, reasons };
  }
  return { ok: true };
}

/** Heuristic: claim text is "covered" if a bound fact string shares a distinctive token. */
function factIdsCoverClaim(claimText: string, factBundle?: FactBundle): boolean {
  if (!factBundle) return false;
  const lower = claimText.toLowerCase();
  // Domain age / SSL facts can cover technical claims; IČO etc. never covered without explicit fact
  if (/\bi[cč]o\b|certifikovan|tisíce spokojených|oficiální partner/i.test(lower)) {
    return factBundle.facts.some(
      (f) =>
        f.verificationStatus === 'VERIFIED' &&
        (/i[cč]o|certifik|partner/i.test(f.fact) || false)
    );
  }
  return true;
}
