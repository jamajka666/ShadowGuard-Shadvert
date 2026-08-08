/**
 * Layer 2 — deterministic Rule Engine.
 * Owns final safetyLevel + trustScore (AI does not).
 * SGW-008 / D-022.
 */

import { mapInternalVerdictToUi, type InternalVerdict, type SignalItem, type UiSafetyLevel } from './truthContract';
import type { FactBundle } from './facts';

export interface RuleDecision {
  internalVerdict: InternalVerdict;
  /** First Creation UI level (NEVIME → OPATRNOSTI). */
  safetyLevel: UiSafetyLevel;
  trustScore: number;
  signals: SignalItem[];
  scoreBreakdown: { label: string; delta: number }[];
  actionRecommendation: 'KOUPIT_BEZPECNE' | 'POUZE_OSOBNI_PREDANI' | 'NEKUPOVAT_NEPLATIT';
  /** True when verdict is driven by insufficient evidence. */
  insufficientEvidence: boolean;
  reasoningTrace: string;
}

const SCAM_TEXT_MARKERS = [
  'kurýr',
  'kuryr',
  'zasilkovna-platba',
  'zásilkovna-platba',
  'potvrdit přijetí',
  'potvrdit prijeti',
  'zadejte číslo karty',
  'zadejte cislo karty',
  'ověření karty',
  'overeni karty',
  'anydesk',
  'teamviewer',
  'garance výnosu',
  'garance vynosu',
  'zdvojnásobení vkladu',
];

function clampScore(n: number): number {
  return Math.max(5, Math.min(100, Math.round(n)));
}

/**
 * Decide verdict from FACTS + text markers only.
 * TLD and domain age are SIGNALS — they never alone yield PODVOD.
 */
export function decideFromFacts(bundle: FactBundle): RuleDecision {
  const signals: SignalItem[] = [];
  const scoreBreakdown: { label: string; delta: number }[] = [];
  let score = 70;
  scoreBreakdown.push({ label: 'základ', delta: 70 });

  // --- Hard evidence: phishing kill ---
  if (bundle.phishingMatched) {
    return {
      internalVerdict: 'PODVOD',
      safetyLevel: 'PODVOD',
      trustScore: 5,
      signals,
      scoreBreakdown: [
        { label: 'základ', delta: 70 },
        { label: 'phishing_db match', delta: -65 },
      ],
      actionRecommendation: 'NEKUPOVAT_NEPLATIT',
      insufficientEvidence: false,
      reasoningTrace:
        'Verdikt PODVOD: shoda s interní phishing databází (prokázaný důkaz). AI tento verdikt nesmí změkčit.',
    };
  }

  // Strong text / URL scam markers (multiple structural cues)
  const text = bundle.textCombined;
  const scamHits = SCAM_TEXT_MARKERS.filter((m) => text.includes(m));
  if (scamHits.length >= 1 && (text.includes('karta') || text.includes('kartu') || text.includes('platba') || scamHits.length >= 2)) {
    return {
      internalVerdict: 'PODVOD',
      safetyLevel: 'PODVOD',
      trustScore: 12,
      signals,
      scoreBreakdown: [
        { label: 'základ', delta: 70 },
        { label: `scam text markers: ${scamHits.join(', ')}`, delta: -58 },
      ],
      actionRecommendation: 'NEKUPOVAT_NEPLATIT',
      insufficientEvidence: false,
      reasoningTrace: `Verdikt PODVOD: silné textové markery známých podvodů (${scamHits.join(', ')}).`,
    };
  }

  // SSL invalid — strong negative but with other signals can be PODVOD; alone → OPATRNOSTI high risk
  if (bundle.sslValid === false) {
    score -= 40;
    scoreBreakdown.push({ label: 'neplatné TLS', delta: -40 });
  }

  // SIGNALS only (cannot alone make PODVOD)
  if (bundle.cheapTld) {
    const delta = -12;
    score += delta;
    scoreBreakdown.push({ label: 'levná TLD (signal)', delta });
    signals.push({
      signalId: 'sig-cheap-tld',
      label: 'Levná / rizikovější koncovka domény (podpůrný signál)',
      scoreDelta: delta,
      aloneCannotMakePodvod: true,
    });
  }

  if (bundle.domainAgeYears != null && bundle.domainAgeYears < 0.25) {
    const delta = -18;
    score += delta;
    scoreBreakdown.push({ label: 'mladá doména < 3 měsíce (signal)', delta });
    signals.push({
      signalId: 'sig-young-domain',
      label: 'Doména je mladší než cca 3 měsíce (podpůrný signál)',
      scoreDelta: delta,
      aloneCannotMakePodvod: true,
    });
  } else if (bundle.domainAgeYears != null && bundle.domainAgeYears < 1) {
    const delta = -8;
    score += delta;
    scoreBreakdown.push({ label: 'doména < 1 rok (signal)', delta });
    signals.push({
      signalId: 'sig-youngish-domain',
      label: 'Doména je mladší než 1 rok (podpůrný signál)',
      scoreDelta: delta,
      aloneCannotMakePodvod: true,
    });
  }

  // PROKAZANO_OFICIALNI is a strong FACT about domain identity — NOT proof that a
  // specific ad/offer/seller is safe (PR #1 re-review). Marketplace listings on
  // bazos.cz etc. can still contain courier/card scams. Until we have
  // PROKAZANO_BEZPECNE evidence for the offer itself, do not emit DUVERYHODNE.
  if (bundle.knownOfficialHost && bundle.sslValid !== false) {
    score += 12;
    scoreBreakdown.push({ label: 'přesná shoda oficiální hostname (identita, ne bezpečnost nabídky)', delta: 12 });
    return {
      internalVerdict: 'OPATRNOSTI',
      safetyLevel: 'OPATRNOSTI',
      trustScore: clampScore(score),
      signals,
      scoreBreakdown,
      actionRecommendation: 'POUZE_OSOBNI_PREDANI',
      insufficientEvidence: true,
      reasoningTrace:
        'Verdikt OPATRNOSTI: doména je na seznamu známých služeb (PROKAZANO_OFICIALNI), ale to neprokazuje bezpečnost konkrétní nabídky, prodejce ani obsahu. PROKAZANO_OFICIALNI ≠ PROKAZANO_BEZPECNE. NO_VERIFIED_THREAT_FOUND ≠ DUVERYHODNE.',
    };
  }

  // Insufficient measured data
  if (bundle.insufficientData || (!bundle.hasUrl && !bundle.hasText && !bundle.hasImage)) {
    return {
      internalVerdict: 'NEVIME',
      safetyLevel: mapInternalVerdictToUi('NEVIME'),
      trustScore: 45,
      signals,
      scoreBreakdown: [{ label: 'nedostatek dat', delta: 45 }],
      actionRecommendation: 'POUZE_OSOBNI_PREDANI',
      insufficientEvidence: true,
      reasoningTrace:
        'Verdikt NEVÍME (UI: OPATRNOSTI): nemáme dostatek ověřených údajů pro jednoznačný verdikt. To je správný výsledek podle Truth Contractu.',
    };
  }

  // Young domain + cheap TLD together → still OPATRNOSTI, not PODVOD alone
  const onlySignals =
    signals.length > 0 &&
    bundle.sslValid !== false &&
    scamHits.length === 0 &&
    !bundle.phishingMatched;

  if (onlySignals && score < 55) {
    return {
      internalVerdict: 'OPATRNOSTI',
      safetyLevel: 'OPATRNOSTI',
      trustScore: clampScore(score),
      signals,
      scoreBreakdown,
      actionRecommendation: 'POUZE_OSOBNI_PREDANI',
      insufficientEvidence: false,
      reasoningTrace:
        'Verdikt OPATRNOSTI: pouze podpůrné signály (např. TLD, stáří). Žádný samostatný signál nepostačuje k PODVOD. Absence silné hrozby ≠ důkaz bezpečnosti.',
    };
  }

  if (bundle.sslValid === false && (bundle.cheapTld || (bundle.domainAgeYears != null && bundle.domainAgeYears < 0.25))) {
    // Multiple independent negative measured facts → still OPATRNOSTI unless scam text
    // (invalid SSL + young is serious caution, not automatic legal "scam proof")
    return {
      internalVerdict: 'OPATRNOSTI',
      safetyLevel: 'OPATRNOSTI',
      trustScore: clampScore(Math.min(score, 25)),
      signals,
      scoreBreakdown,
      actionRecommendation: 'NEKUPOVAT_NEPLATIT',
      insufficientEvidence: false,
      reasoningTrace:
        'Verdikt OPATRNOSTI (vysoké riziko): neplatné TLS a další signály. Bez potvrzení z phishing DB neprohlašujeme automaticky PODVOD jako právní fakt — doporučujeme neplatit.',
    };
  }

  // Default: some data, no hard proof either way
  if (!bundle.hasText && !bundle.hasImage && bundle.hasUrl && bundle.sslValid === true && signals.length === 0) {
    return {
      internalVerdict: 'OPATRNOSTI',
      safetyLevel: 'OPATRNOSTI',
      trustScore: clampScore(score),
      signals,
      scoreBreakdown,
      actionRecommendation: 'POUZE_OSOBNI_PREDANI',
      insufficientEvidence: true,
      reasoningTrace:
        'Verdikt OPATRNOSTI: máme platné TLS, ale málo kontextu o nabídce. NO_VERIFIED_THREAT_FOUND ≠ DUVERYHODNE.',
    };
  }

  return {
    internalVerdict: 'OPATRNOSTI',
    safetyLevel: 'OPATRNOSTI',
    trustScore: clampScore(score),
    signals,
    scoreBreakdown,
    actionRecommendation: 'POUZE_OSOBNI_PREDANI',
    insufficientEvidence: bundle.facts.filter((f) => f.verificationStatus === 'VERIFIED').length < 2,
    reasoningTrace:
      'Verdikt OPATRNOSTI: výchozí poctivý stav při neúplných důkazech. Lepší opatrnost než nepodložená jistota.',
  };
}

/**
 * Server-owned presentation templates (headline/summary/advice).
 * actionAdvice is NEVER invented by AI — fixed safe strings per verdict (PR #1 re-review).
 */
export function templatePresentation(
  decision: RuleDecision,
  hostname: string | null,
  opts?: { phishingPattern?: string; knownOfficialHost?: boolean }
): {
  headline: string;
  summaryForSenior: string;
  actionAdvice: string[];
} {
  if (decision.safetyLevel === 'PODVOD') {
    const pattern = opts?.phishingPattern;
    return {
      headline: pattern
        ? `Zastavte se — odhalen nebezpečný odkaz (${pattern})`
        : 'Zastavte se — vysoké riziko podvodu',
      summaryForSenior: pattern
        ? `Odkaz byl vyhodnocen jako nebezpečný podle naší ověřené databáze (${pattern}). Neotvírejte podezřelé odkazy a nezadávejte údaje z platební karty.`
        : 'Podle ověřených znaků a našich pravidel jde o nebezpečnou nabídku. Neotvírejte podezřelé odkazy a nezadávejte údaje z platební karty.',
      actionAdvice: [
        'Nic neplaťte a nezadávejte číslo karty.',
        'Zavřete podezřelou stránku nebo zprávu.',
        'Pokud si nejste jistí, zeptejte se někoho z rodiny dřív, než budete pokračovat.',
      ],
    };
  }
  if (decision.insufficientEvidence || decision.internalVerdict === 'NEVIME') {
    if (opts?.knownOfficialHost && hostname) {
      return {
        headline: `Známá doména (${hostname}) — nabídku stejně pečlivě prověřte`,
        summaryForSenior:
          `Adresa patří k dlouhodobě známé službě (${hostname}). To dokládá jen identitu domény, ne bezpečnost konkrétního inzerátu, prodejce ani zprávy. Doporučujeme zvýšenou opatrnost.`,
        actionAdvice: [
          'U bazaru trvejte na osobním předání a kontrole zboží.',
          'Nereagujte na žádosti o platbu kartou mimo oficiální aplikaci.',
          'Nikdy neotevírejte odkazy z SMS/WhatsAppu od neznámého kupujícího.',
        ],
      };
    }
    return {
      headline: 'Nemáme dostatek ověřených údajů',
      summaryForSenior:
        'O této nabídce nemáme dostatek potvrzených informací, proto nemůžeme říct, že je bezpečná. Doporučujeme zvýšenou opatrnost a osobní předání, pokud budete pokračovat.',
      actionAdvice: [
        'Nic neplaťte předem neznámému prodejci.',
        'Ověřte si kontakt a ideálně zboží osobně.',
        'Když si nejste jistí, nabídku raději opusťte.',
      ],
    };
  }
  // DUVERYHODNE reserved for future PROKAZANO_BEZPECNE evidence path
  if (decision.safetyLevel === 'DUVERYHODNE') {
    return {
      headline: hostname ? `Silně podložená doména: ${hostname}` : 'Silně podložený výsledek',
      summaryForSenior:
        'Máme silné serverové důkazy pro tento verdikt. I tak zůstaňte opatrní u peněz a osobních údajů.',
      actionAdvice: [
        'Při nákupu používejte bezpečné platby a ověřené kanály.',
        'Nereagujte na žádosti o kartu mimo oficiální aplikaci.',
      ],
    };
  }
  return {
    headline: 'Vyžaduje zvýšenou opatrnost',
    summaryForSenior:
      'Tuto nabídku je potřeba důkladně prověřit. Nemáme potvrzený důkaz podvodu, ale ani dostatek důkazů pro plnou důvěru.',
    actionAdvice: [
      'Trvejte na osobním předání, pokud je to možné.',
      'Nikdy nevyplňujte údaje karty na neznámém odkazu z SMS nebo chatu.',
      'Když něco působí divně, raději nepokračujte.',
    ],
  };
}

/** Server-built list of things we explicitly did not verify (not AI prose). */
export function buildUnverifiedClaims(factBundle: FactBundle): string[] {
  const out: string[] = [];
  if (factBundle.officialDomainStatus === 'NEOVERENO') {
    out.push('Nepodařilo se ověřit, že jde o oficiální doménu ze známého seznamu.');
  }
  if (!factBundle.phishingMatched) {
    out.push('Nenašli jsme shodu v interní phishing databázi — to neznamená, že nabídka je bezpečná.');
  }
  out.push('Cenu zboží jsme z serverových důkazů neověřili.');
  out.push('Identitu prodejce / IČO / historii firmy jsme z serverových důkazů neověřili.');
  if (factBundle.hasImage) {
    out.push('Přiložený snímek jsme neinterpretovali jako důkaz o firmě ani e-shopu.');
  }
  return out;
}
