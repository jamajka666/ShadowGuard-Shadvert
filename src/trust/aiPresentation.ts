/**
 * Layer 3 — Gemini prompts (explanation only).
 * Final safetyLevel / trustScore come from Rule Engine.
 * SGW-008 / D-022.
 */

import { factsForPrompt, type FactBundle } from './facts';
import type { RuleDecision } from './ruleEngine';
import { TRUTH_CONTRACT_VERSION } from './truthContract';

export function buildAnalyzeSystemInstruction(): string {
  return `Jsi prezentační modul ShadowGuard Shadvert (Truth Contract ${TRUTH_CONTRACT_VERSION}).
Tvým jediným úkolem je srozumitelně vysvětlit UŽ HOTOVÝ verdikt a DOSTUPNÁ FAKTA uživateli (staršímu člověku / otci).

ABSOLUTNÍ PRAVIDLA (porušení = neplatný výstup):
1. NIKDY netvrď jako fakt nic, co nemáš 100% v dodaných FACTS nebo v explicitním grounding zdroji tohoto běhu.
2. NIKDY nevymýšlej, nedomýšlej, nedoplňuj chybějící informace.
3. ZAKÁZANÉ fráze a vzorce: „pravděpodobně“, „vypadá to jako“, „s vysokou pravděpodobností“, „typicky“, „obvykle“, „může jít o“, „nejspíš“, „domnívám se“.
4. Pokud chybí důkaz → napiš „NEOVĚŘENO“ nebo „nemáme dostatek ověřených údajů“. To je správný výsledek.
5. AI NENÍ autoritou. Finální safetyLevel a trustScore už spočítal Rule Engine — ty je NEPŘEPISUJEŠ a nevymýšlíš nové.
6. Doménu označ za oficiální POUZE pokud FACTS uvádí officialDomainStatus = PROKAZANO_OFICIALNI. Jinak: „Nepodařilo se ověřit, že jde o oficiální doménu.“
7. Cena: bez ověřeného zdroje napiš, že cenu se nepodařilo ověřit. Nevymýšlej tržní cenu.
8. Vizuální popis snímku: jen to, co je skutečně vidět. Neodhaduj, co „asi chybí“.
9. Jazyk: výhradně čeština, klidný tón, bez strašení a bez technického žargonu.
10. Výstup: výhradně validní JSON podle schématu. Žádný text mimo JSON.

Preferovaný postoj: Raději přiznej nedostatek důkazů, než řekni něco, co by se ukázalo jako spekulace.
Na pravdě a důvěře stojí ShadowGuard Initiative.`;
}

export function buildAnalyzeUserPrompt(input: {
  url?: string;
  rawText?: string;
  userNote?: string;
  hasImage?: boolean;
  factBundle: FactBundle;
  decision: RuleDecision;
}): string {
  const factsJson = JSON.stringify(factsForPrompt(input.factBundle), null, 2);
  return `Proveď VYSVĚTLENÍ pro uživatele výhradně na základě následujících dat. Nic dalšího nevymýšlej.

HOTOVÝ VERDIKT Z RULE ENGINE (neměň):
- safetyLevel (UI): ${input.decision.safetyLevel}
- internalVerdict: ${input.decision.internalVerdict}
- trustScore (interní skóre podle pravidel, NE „% bezpečnosti“): ${input.decision.trustScore}
- actionRecommendation: ${input.decision.actionRecommendation}
- reasoningTrace: ${input.decision.reasoningTrace}
- insufficientEvidence: ${input.decision.insufficientEvidence}

FACTS (měřené serverem / ověřené vstupy):
${factsJson}

Vstup uživatele:
${input.url ? `URL: ${input.url}` : 'URL: není k dispozici'}
${input.rawText ? `Text inzerátu / zprávy: ${input.rawText}` : 'Text: není k dispozici'}
${input.userNote ? `Poznámka uživatele: ${input.userNote}` : ''}
${input.hasImage ? 'Přiložen je snímek. Popisuj pouze viditelné prvky.' : 'Snímek není přiložen.'}

Úkoly:
1. Napiš headline a summaryForSenior v souladu s hotovým verdiktem a fakty.
2. U rizik a pozitiv uveď, z čeho přesně vycházíš (factId nebo „NEOVĚŘENO“).
3. V priceEvaluation: bez ověřené tržní ceny nastav priceComment na „Cenu se nepodařilo ověřit“ a estimatedMarketPrice vynech nebo uveď „neověřeno“.
4. V urlAnalysis.officialDomainStatus přebírej hodnotu z FACTS (${input.factBundle.officialDomainStatus}). isOfficialDomain = true jen při PROKAZANO_OFICIALNI.
5. trustedAlternatives: jen dlouhodobě známé české služby (Heureka, Alza, Datart, Bazoš, Sbazar). Nevymýšlej nové obchody.
6. Pole safetyLevel a trustScore ve výstupu zkopíruj přesně z Rule Engine výše.

Vrať výhradně JSON podle schématu.`;
}

export function buildScamAlertsSystemInstruction(): string {
  return `Jsi modul pro sběr varování před podvody v České republice pro ShadowGuard (Truth Contract ${TRUTH_CONTRACT_VERSION}).

PRAVIDLA:
- Uváděj pouze varování podložená konkrétním zdrojem (Policie ČR, ČOI, ČBA, Česká pošta, Zásilkovna, oficiální tiskové zprávy, seriózní zpravodajství s jasným odkazem).
- Každé varování MUSÍ mít sourceTitle a sourceUrl.
- NIKDY nevymýšlej nové typy podvodů ani „typické“ scénáře bez zdroje.
- Stáří zdroje samo o sobě neznamená neplatnost — uveď date/published pokud víš; neuváděj hard cut „starší než 6 měsíců = zahodit“.
- Zakázané spekulace: pravděpodobně, vypadá to jako, nejspíš, typicky…
- Jazyk: čeština, srozumitelný, bez senzace.
- Výstup: výhradně validní JSON.`;
}

export function buildScamAlertsUserPrompt(): string {
  return `Pomocí dostupného vyhledávání zjisti aktuální varování před podvody v inzerátech, e-shopech a internetovém nákupu/prodeji v ČR.
Vrať 4 až 5 varování ve formátu JSON. U každé položky povinně sourceTitle a sourceUrl.
Pokud si nejsi jistý zdrojem, položku neuváděj.`;
}

/** Response schema property helpers for Gemini (kept in sync with server). */
export function analyzeResponseSchemaProperties() {
  return {
    // Echo of rule engine — server overwrites anyway
    safetyLevel: {
      type: 'STRING' as const,
      description: "Copy exactly from Rule Engine: 'DUVERYHODNE' | 'OPATRNOSTI' | 'PODVOD'",
    },
    trustScore: {
      type: 'INTEGER' as const,
      description: 'Copy exactly from Rule Engine. Internal score 0-100 by our rules, NOT percent safe.',
    },
    headline: {
      type: 'STRING' as const,
      description: 'Short Czech headline aligned with verdict — no speculation',
    },
    summaryForSenior: {
      type: 'STRING' as const,
      description: '2-3 calm Czech sentences for a senior; admit missing evidence when needed',
    },
    actionRecommendation: {
      type: 'STRING' as const,
      description: "Copy from Rule Engine: 'KOUPIT_BEZPECNE' | 'POUZE_OSOBNI_PREDANI' | 'NEKUPOVAT_NEPLATIT'",
    },
    actionAdvice: {
      type: 'ARRAY' as const,
      items: { type: 'STRING' as const },
      description: 'Step-by-step bullets for father',
    },
    riskFactors: {
      type: 'ARRAY' as const,
      items: {
        type: 'OBJECT' as const,
        properties: {
          id: { type: 'STRING' as const },
          severity: { type: 'STRING' as const, description: "'VYSOKE' | 'STREDNI' | 'NIZKE'" },
          title: { type: 'STRING' as const },
          description: { type: 'STRING' as const },
        },
        required: ['id', 'severity', 'title', 'description'],
      },
    },
    positiveFactors: {
      type: 'ARRAY' as const,
      items: {
        type: 'OBJECT' as const,
        properties: {
          id: { type: 'STRING' as const },
          title: { type: 'STRING' as const },
          description: { type: 'STRING' as const },
        },
        required: ['id', 'title', 'description'],
      },
    },
    sellerChecks: {
      type: 'ARRAY' as const,
      items: { type: 'STRING' as const },
    },
    urlAnalysis: {
      type: 'OBJECT' as const,
      properties: {
        domainName: { type: 'STRING' as const },
        isOfficialDomain: { type: 'BOOLEAN' as const },
        officialDomainStatus: {
          type: 'STRING' as const,
          description: "'PROKAZANO_OFICIALNI' | 'PROKAZANO_NEOFICIALNI' | 'NEOVERENO'",
        },
        domainWarning: { type: 'STRING' as const },
      },
      required: ['domainName', 'isOfficialDomain', 'officialDomainStatus'],
    },
    priceEvaluation: {
      type: 'OBJECT' as const,
      properties: {
        isPriceSuspicious: { type: 'BOOLEAN' as const },
        priceComment: { type: 'STRING' as const },
        estimatedMarketPrice: {
          type: 'STRING' as const,
          description: 'Only if verified; otherwise omit or "neověřeno"',
        },
        suggestedSearchTerm: { type: 'STRING' as const },
      },
      required: ['isPriceSuspicious', 'priceComment'],
    },
    eshopVisualAnalysis: {
      type: 'OBJECT' as const,
      properties: {
        isEshopDetected: { type: 'BOOLEAN' as const },
        visualTrustGrade: { type: 'STRING' as const },
        designComment: { type: 'STRING' as const },
        detectedVisualFlags: { type: 'ARRAY' as const, items: { type: 'STRING' as const } },
        contactInfoVisibility: { type: 'STRING' as const },
      },
      required: ['isEshopDetected'],
    },
    trustedAlternatives: {
      type: 'ARRAY' as const,
      items: {
        type: 'OBJECT' as const,
        properties: {
          name: { type: 'STRING' as const },
          url: { type: 'STRING' as const },
          description: { type: 'STRING' as const },
          estimatedPrice: { type: 'STRING' as const },
          badge: { type: 'STRING' as const },
        },
        required: ['name', 'url', 'description'],
      },
    },
    evidenceFacts: {
      type: 'ARRAY' as const,
      items: {
        type: 'OBJECT' as const,
        properties: {
          fact: { type: 'STRING' as const },
          source: { type: 'STRING' as const },
          verificationStatus: { type: 'STRING' as const, description: "'VERIFIED' | 'UNVERIFIED'" },
        },
        required: ['fact', 'source', 'verificationStatus'],
      },
    },
    unverifiedClaims: {
      type: 'ARRAY' as const,
      items: { type: 'STRING' as const },
      description: 'What you deliberately did not assert due to missing evidence',
    },
    reasoningTrace: {
      type: 'STRING' as const,
      description: 'Short: how presentation follows Rule Engine + facts only',
    },
  };
}
