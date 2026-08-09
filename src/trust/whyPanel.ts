/**
 * Trust UX: "NEVÍME / OPATRNOSTI" must answer "A proč?" with orientation, not panic.
 *
 * Principles (SGW-008 Trust & Accountability / Demo Gate):
 * - NO-VERDICT ≠ NO-HELP
 * - Never only "we don't know" — always: what we checked, what we couldn't, why, what it does NOT mean, what to do
 * - Language: bylos zjištěno / nebylo ověřeno / kontrola selhala / varovný signál
 */

import type { FactBundle } from './facts';
import type { RuleDecision } from './ruleEngine';

/** Internal reasons why we cannot issue a stronger verdict. */
export type InsufficientEvidenceKind =
  | 'NOT_CHECKED'
  | 'CHECK_FAILED'
  | 'INSUFFICIENT_EVIDENCE'
  | 'CONFLICTING_EVIDENCE'
  | 'SIGNAL_ONLY';

export type CheckUiStatus = 'OVERENO' | 'NEOVERENO' | 'SELHALO' | 'SIGNAL' | 'NEPROVEDENO';

export interface WhyCheckRow {
  id: string;
  label: string;
  /** Short emoji/icon hint for simple UI */
  icon: string;
  status: CheckUiStatus;
  /** Human: co to znamená */
  meaning: string;
  /** Internal classification (not shown as jargon to seniors by default) */
  kind: InsufficientEvidenceKind;
}

export interface WhyPanel {
  /** Show expandable "Proč?" panel */
  show: boolean;
  /** Short title for the panel */
  title: string;
  /** One-line calm framing */
  lead: string;
  /** What this result does NOT mean */
  doesNotMean: string;
  /** Rows for the table */
  checks: WhyCheckRow[];
  /** What we recommend (safe next step) — may overlap actionAdvice */
  recommendations: string[];
  /** Primary internal kind for analytics */
  primaryKind: InsufficientEvidenceKind;
  /** Five-part structure for Demo Gate / accountability */
  structure: {
    verified: string[];
    notVerified: string[];
    whyBlocksStrongerVerdict: string;
    doesNotMean: string;
    recommend: string[];
  };
}

function row(
  partial: Omit<WhyCheckRow, 'icon'> & { icon?: string }
): WhyCheckRow {
  return {
    icon: partial.icon || '•',
    ...partial,
  };
}

/**
 * Build user-facing "Proč?" panel from FACTS + decision.
 * Always available when verdict is OPATRNOSTI or NEVIME (internal).
 */
export function buildWhyPanel(factBundle: FactBundle, decision: RuleDecision): WhyPanel {
  const checks: WhyCheckRow[] = [];

  // Domain / hostname
  if (factBundle.hostname) {
    checks.push(
      row({
        id: 'domain',
        label: 'Doména',
        icon: '🌐',
        status: 'OVERENO',
        meaning: `Adresa odpovídá: ${factBundle.hostname}`,
        kind: 'INSUFFICIENT_EVIDENCE',
      })
    );
  } else {
    checks.push(
      row({
        id: 'domain',
        label: 'Doména',
        icon: '🌐',
        status: 'NEPROVEDENO',
        meaning: 'Nebyla k dispozici platná URL ke kontrole domény.',
        kind: 'NOT_CHECKED',
      })
    );
  }

  // Official list
  if (factBundle.knownOfficialHost) {
    checks.push(
      row({
        id: 'official',
        label: 'Známá služba',
        icon: '📋',
        status: 'OVERENO',
        meaning:
          'Doména je na seznamu známých služeb (identita domény). To neprokazuje bezpečnost konkrétní nabídky.',
        kind: 'INSUFFICIENT_EVIDENCE',
      })
    );
  } else if (factBundle.hostname) {
    checks.push(
      row({
        id: 'official',
        label: 'Známá služba',
        icon: '📋',
        status: 'NEOVERENO',
        meaning: 'Nepodařilo se ověřit oficiálnost domény ze známého seznamu.',
        kind: 'INSUFFICIENT_EVIDENCE',
      })
    );
  }

  // TLS
  if (factBundle.sslValid === true) {
    checks.push(
      row({
        id: 'https',
        label: 'HTTPS / certifikát',
        icon: '🔐',
        status: 'OVERENO',
        meaning: 'Spojení je podle měření šifrované (platný certifikát).',
        kind: 'INSUFFICIENT_EVIDENCE',
      })
    );
  } else if (factBundle.sslValid === false) {
    checks.push(
      row({
        id: 'https',
        label: 'HTTPS / certifikát',
        icon: '🔐',
        status: 'SELHALO',
        meaning: 'Certifikát je neplatný nebo nedůvěryhodný — to je varovný technický signál.',
        kind: 'CHECK_FAILED',
      })
    );
  } else {
    checks.push(
      row({
        id: 'https',
        label: 'HTTPS / certifikát',
        icon: '🔐',
        status: 'NEPROVEDENO',
        meaning: 'TLS kontrola neproběhla (chybí měření).',
        kind: 'NOT_CHECKED',
      })
    );
  }

  // Phishing
  if (factBundle.phishingMatched) {
    checks.push(
      row({
        id: 'phishing',
        label: 'Phishing databáze',
        icon: '🎣',
        status: 'SELHALO',
        meaning: `Nalezena shoda s interní databází${factBundle.phishingPattern ? `: ${factBundle.phishingPattern}` : ''}.`,
        kind: 'CONFLICTING_EVIDENCE',
      })
    );
  } else if (factBundle.phishingChecked) {
    checks.push(
      row({
        id: 'phishing',
        label: 'Phishing databáze',
        icon: '🎣',
        status: 'OVERENO',
        meaning:
          'Kontrola proběhla: žádná hard shoda. To neznamená, že je nabídka bezpečná — jen že v této databázi match není.',
        kind: 'INSUFFICIENT_EVIDENCE',
      })
    );
  } else {
    checks.push(
      row({
        id: 'phishing',
        label: 'Phishing databáze',
        icon: '🎣',
        status: 'NEPROVEDENO',
        meaning: 'Phishing kontrola neproběhla (např. chybí URL).',
        kind: 'NOT_CHECKED',
      })
    );
  }

  // Seller / identity — we never have hard proof yet
  checks.push(
    row({
      id: 'seller',
      label: 'Prodejce / IČO',
      icon: '🏪',
      status: 'NEOVERENO',
      meaning: 'Nemáme serverový důkaz o identitě prodejce ani IČO.',
      kind: 'INSUFFICIENT_EVIDENCE',
    })
  );

  // Price
  checks.push(
    row({
      id: 'price',
      label: 'Cena',
      icon: '💳',
      status: 'NEOVERENO',
      meaning: 'Cenu jsme z dostupných důkazů neověřili.',
      kind: 'INSUFFICIENT_EVIDENCE',
    })
  );

  // Text signals
  if (factBundle.scamTextMarkers.length > 0) {
    checks.push(
      row({
        id: 'text_signals',
        label: 'Text nabídky',
        icon: '⚠️',
        status: 'SIGNAL',
        meaning: factBundle.educationalScamFraming
          ? `Text zmiňuje podvodní vzory v kontextu varování/vysvětlení (${factBundle.scamTextMarkers.join(', ')}).`
          : `V textu jsou varovné vzory (${factBundle.scamTextMarkers.join(', ')}) — signál, ne automatický důkaz podvodu.`,
        kind: 'SIGNAL_ONLY',
      })
    );
  }

  const verified = checks.filter((c) => c.status === 'OVERENO').map((c) => `${c.label}: ${c.meaning}`);
  const notVerified = checks
    .filter((c) => c.status === 'NEOVERENO' || c.status === 'NEPROVEDENO' || c.status === 'SELHALO' || c.status === 'SIGNAL')
    .map((c) => `${c.label}: ${c.meaning}`);

  const primaryKind: InsufficientEvidenceKind =
    checks.find((c) => c.kind === 'CHECK_FAILED')?.kind ||
    checks.find((c) => c.kind === 'SIGNAL_ONLY')?.kind ||
    checks.find((c) => c.kind === 'NOT_CHECKED')?.kind ||
    'INSUFFICIENT_EVIDENCE';

  const doesNotMean =
    decision.safetyLevel === 'PODVOD'
      ? 'Neznamená to právní rozsudek — znamená to, že máme silný serverový důkaz rizika a doporučujeme nepokračovat v platbě.'
      : 'Neznamená to automaticky, že jde o podvod. Znamená to, že nemáme dost ověřených důkazů pro silnější verdikt „bezpečné“.';

  const whyBlocks =
    decision.internalVerdict === 'NEVIME' || decision.insufficientEvidence
      ? 'Chybí dostatek ověřených důkazů o prodejci, nabídce nebo některých kontrolách. Bez nich bychom lhalí, kdybychom řekli „je to bezpečné“.'
      : decision.safetyLevel === 'OPATRNOSTI'
        ? 'Máme jen část obrázku: některé kontroly prošly, jiné chybí nebo jsou jen varovné signály. Síla tvrzení nesmí překročit sílu důkazu.'
        : decision.reasoningTrace;

  const recommendations =
    decision.actionAdvice && decision.actionAdvice.length > 0
      ? decision.actionAdvice
      : [
          'Zatím nezadávejte údaje z karty a neprovádějte platbu.',
          'Pokud chcete pokračovat, otevřete oficiální web služby z adresy, kterou znáte.',
          'Když si nejste jistí, zeptejte se někoho z rodiny dřív, než budete pokračovat.',
        ];

  // Always show for OPATRNOSTI / NEVIME / PODVOD (user always asks "why?")
  const show =
    decision.safetyLevel === 'OPATRNOSTI' ||
    decision.safetyLevel === 'PODVOD' ||
    decision.internalVerdict === 'NEVIME' ||
    decision.insufficientEvidence;

  const lead =
    decision.safetyLevel === 'PODVOD'
      ? 'Máme silný důkaz rizika. Níže vidíte, co přesně systém zjistil.'
      : 'Nemůžeme dát silnější verdikt — a tady přesně vidíte proč. Víme, co nevíme, a víme, co teď raději nedělat.';

  return {
    show,
    title: 'Proč tento výsledek?',
    lead,
    doesNotMean,
    checks,
    recommendations,
    primaryKind,
    structure: {
      verified,
      notVerified,
      whyBlocksStrongerVerdict: whyBlocks,
      doesNotMean,
      recommend: recommendations,
    },
  };
}
