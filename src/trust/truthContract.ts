/**
 * ShadowGuard Truth Contract — runtime constants (SGW-008 / D-022).
 * Claim traceability over absolute world-truth guarantees.
 */

export const TRUTH_CONTRACT_VERSION = '1.0.1';
/** Bump when rule mapping / kill thresholds change (invalidates verdict cache). */
export const RULES_VERSION_TRUTH = 'rules-2026-08-08-truth-contract.3';

/** Internal analysis verdict before First Creation UI mapping. */
export type InternalVerdict = 'DUVERYHODNE' | 'OPATRNOSTI' | 'PODVOD' | 'NEVIME';

/** UI-facing safety levels (First Creation keeps 3 colours). */
export type UiSafetyLevel = 'DUVERYHODNE' | 'OPATRNOSTI' | 'PODVOD';

/**
 * VERIFIED = measured from source; DERIVED = calculated from a VERIFIED fact;
 * UNVERIFIED = missing / cannot assert.
 */
export type VerificationStatus = 'VERIFIED' | 'DERIVED' | 'UNVERIFIED';

export type OfficialDomainStatus =
  | 'PROKAZANO_OFICIALNI'
  | 'PROKAZANO_NEOFICIALNI'
  | 'NEOVERENO';

export type ThreatFinding = 'CONFIRMED_THREAT' | 'NO_VERIFIED_THREAT_FOUND' | 'UNKNOWN';

/** Comment / review integrity (future P2) — no LIKELY_AUTHENTIC. */
export type CommentIntegrityStatus =
  | 'UNVERIFIED'
  | 'SUSPICIOUS'
  | 'CONFIRMED_FAKE'
  | 'VERIFIED_AUTHENTIC';

export interface EvidenceItem {
  evidenceId: string;
  type: string;
  source: string;
  collectedAt: string;
  value: string;
  verificationStatus: VerificationStatus;
}

export interface FactItem {
  factId: string;
  fact: string;
  source: string;
  collectedAt: string;
  verificationStatus: VerificationStatus;
  evidenceIds?: string[];
  /** For DERIVED: parent factId(s) used in calculation. */
  derivedFromFactIds?: string[];
}

/**
 * Free-text patterns that assert unmeasured world-facts (P0 review PR #1).
 * Ban in AI presentation unless only restating server FACTS (enforced by stripping structured claims).
 */
export const UNSUBSTANTIATED_WORLD_CLAIM_PATTERNS: RegExp[] = [
  /\bi[cč]o\b/i,
  /dlouhou histori/i,
  /dlouholetou/i,
  /ověřený prodejce/i,
  /ověřený obchod/i,
  /ověřený e-?shop/i,
  /certifikovan/i,
  /tisíce spokojených/i,
  /spolehlivý prodejce/i,
  /oficiální partner/i,
  /garance nákupu/i,
  /heuréka ověř/i,
  /má uvedené i[cč]o/i,
  /firma existuje/i,
  /právnická osoba/i,
];

/** Known service tips — NOT a per-offer security verdict. */
export const GENERAL_KNOWN_SERVICE_TIPS = [
  {
    name: 'Heureka.cz',
    url: 'https://www.heureka.cz',
    description:
      'Obecná dlouhodobě známá česká služba pro srovnání cen. Toto NENÍ bezpečnostní verdikt k vaší konkrétní nabídce.',
    badge: 'Obecný tip (ne ověření)',
  },
  {
    name: 'Alza.cz',
    url: 'https://www.alza.cz',
    description:
      'Obecná dlouhodobě známá česká služba. Toto NENÍ důkaz, že vaše nabídka je bezpečná, ani ověření prodejce.',
    badge: 'Obecný tip (ne ověření)',
  },
  {
    name: 'Bazoš.cz',
    url: 'https://www.bazos.cz',
    description:
      'Známý inzertní portál. I na známém portálu platí opatrnost u soukromých prodejců a osobní předání.',
    badge: 'Obecný tip (ne ověření)',
  },
] as const;

export function containsUnsubstantiatedWorldClaim(text: string): string | null {
  if (!text) return null;
  for (const re of UNSUBSTANTIATED_WORLD_CLAIM_PATTERNS) {
    if (re.test(text)) return re.source;
  }
  return null;
}

export interface SignalItem {
  signalId: string;
  label: string;
  /** Score delta applied by rule engine (can be negative). */
  scoreDelta: number;
  /** Never alone produces PODVOD. */
  aloneCannotMakePodvod: true;
}

export interface ClaimItem {
  claim: string;
  factIds: string[];
  verificationStatus: VerificationStatus;
}

/**
 * Speculative / probability language forbidden in user-facing AI text (CS + common EN).
 * Note: avoid \\b for Czech diacritics — JS word boundaries are ASCII-oriented.
 */
export const FORBIDDEN_SPECULATION_PHRASES: RegExp[] = [
  /pravděpodobně/i,
  /vypadá to jako/i,
  /s vysokou pravděpodobností/i,
  /typicky/i,
  /obvykle/i,
  /může jít o/i,
  /nejspíš/i,
  /domnívám se/i,
  /spíše to bude/i,
  /aspoň se zdá/i,
  /se zdá, že/i,
  /téměř jistě/i,
  /skoro jistě/i,
  /\bprobably\b/i,
  /\blikely\b/i,
  /\bmight be\b/i,
  /\bappears to be\b/i,
  /\balmost certainly\b/i,
];

/** Known exact official hostnames (Layer 1 whitelist). */
export const OFFICIAL_HOSTS = new Set([
  'bazos.cz',
  'www.bazos.cz',
  'sbazar.cz',
  'www.sbazar.cz',
  'alza.cz',
  'www.alza.cz',
  'datart.cz',
  'www.datart.cz',
  'heureka.cz',
  'www.heureka.cz',
  'mall.cz',
  'www.mall.cz',
  'czc.cz',
  'www.czc.cz',
  'policie.cz',
  'www.policie.cz',
  'coi.cz',
  'www.coi.cz',
]);

/** Cheap TLDs = supporting SIGNAL only (TRUST-ENGINE-001). */
export const CHEAP_TLD_SUFFIXES = ['.online', '.top', '.site', '.xyz', '.info', '.store'] as const;

/**
 * Map internal NEVIME → UI OPATRNOSTI (D-019 First Creation freeze).
 */
export function mapInternalVerdictToUi(v: InternalVerdict): UiSafetyLevel {
  if (v === 'NEVIME') return 'OPATRNOSTI';
  return v;
}

export function isForbiddenSpeculationText(text: string): string | null {
  if (!text || typeof text !== 'string') return null;
  for (const re of FORBIDDEN_SPECULATION_PHRASES) {
    if (re.test(text)) {
      return re.source;
    }
  }
  return null;
}

export function collectTextBlobs(obj: unknown, out: string[] = []): string[] {
  if (obj == null) return out;
  if (typeof obj === 'string') {
    out.push(obj);
    return out;
  }
  if (Array.isArray(obj)) {
    for (const item of obj) collectTextBlobs(item, out);
    return out;
  }
  if (typeof obj === 'object') {
    for (const v of Object.values(obj as Record<string, unknown>)) {
      collectTextBlobs(v, out);
    }
  }
  return out;
}
