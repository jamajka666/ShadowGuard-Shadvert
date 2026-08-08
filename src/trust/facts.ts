/**
 * Layer 1 — FACTS only (measured / known inputs). No inferences.
 * SGW-008 Truth Contract.
 */

import {
  OFFICIAL_HOSTS,
  CHEAP_TLD_SUFFIXES,
  type EvidenceItem,
  type FactItem,
  type OfficialDomainStatus,
  type ThreatFinding,
} from './truthContract';

export interface SslDomainLike {
  domain?: string;
  isSslValid?: boolean;
  sslIssuer?: string;
  sslValidFrom?: string;
  sslValidTo?: string;
  sslDaysRemaining?: number;
  domainAgeYears?: number;
  domainAgeText?: string;
  registrar?: string;
  creationDate?: string;
  ipAddress?: string;
  country?: string;
  warnings?: string[];
  error?: string;
  blockedBySsrfGuard?: boolean;
}

export interface FactBundle {
  collectedAt: string;
  hostname: string | null;
  officialDomainStatus: OfficialDomainStatus;
  threatFinding: ThreatFinding;
  evidence: EvidenceItem[];
  facts: FactItem[];
  /** True when we have almost nothing measured. */
  insufficientData: boolean;
  hasUrl: boolean;
  hasText: boolean;
  hasImage: boolean;
  phishingMatched: boolean;
  phishingPattern?: string;
  sslValid: boolean | null;
  domainAgeYears: number | null;
  cheapTld: boolean;
  knownOfficialHost: boolean;
  textCombined: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function extractHostname(urlInput: string): string | null {
  if (!urlInput || !urlInput.trim()) return null;
  try {
    const raw = urlInput.trim();
    const u = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
    return u.hostname.toLowerCase();
  } catch {
    return null;
  }
}

function isCheapTld(hostname: string | null): boolean {
  if (!hostname) return false;
  return CHEAP_TLD_SUFFIXES.some((s) => hostname.endsWith(s));
}

export function buildFactBundle(input: {
  url?: string;
  rawText?: string;
  userNote?: string;
  hasImage?: boolean;
  sslDomainInfo?: SslDomainLike | null;
  phishingMatched?: boolean;
  phishingPattern?: string;
  phishingKilled?: boolean;
}): FactBundle {
  const collectedAt = nowIso();
  const hostname =
    (input.sslDomainInfo?.domain && String(input.sslDomainInfo.domain).toLowerCase()) ||
    extractHostname(input.url || '');
  const evidence: EvidenceItem[] = [];
  const facts: FactItem[] = [];
  let eid = 0;
  let fid = 0;
  const nextE = (partial: Omit<EvidenceItem, 'evidenceId' | 'collectedAt'>): string => {
    const id = `e-${++eid}`;
    evidence.push({ ...partial, evidenceId: id, collectedAt });
    return id;
  };
  const nextF = (
    fact: string,
    source: string,
    verificationStatus: 'VERIFIED' | 'UNVERIFIED',
    evidenceIds?: string[]
  ) => {
    facts.push({
      factId: `f-${++fid}`,
      fact,
      source,
      collectedAt,
      verificationStatus,
      evidenceIds,
    });
  };

  if (hostname) {
    const e = nextE({
      type: 'hostname',
      source: 'url_parse',
      value: hostname,
      verificationStatus: 'VERIFIED',
    });
    nextF(`Hostname: ${hostname}`, 'url_parse', 'VERIFIED', [e]);
  }

  const knownOfficialHost = Boolean(hostname && OFFICIAL_HOSTS.has(hostname));
  let officialDomainStatus: OfficialDomainStatus = 'NEOVERENO';
  if (knownOfficialHost) {
    officialDomainStatus = 'PROKAZANO_OFICIALNI';
    nextF(
      `Hostname se přesně shoduje se známým oficiálním seznamem: ${hostname}`,
      'official_host_list',
      'VERIFIED'
    );
  } else if (hostname) {
    officialDomainStatus = 'NEOVERENO';
    nextF(
      'Nepodařilo se ověřit, že jde o oficiální doménu ze známého seznamu',
      'official_host_list',
      'UNVERIFIED'
    );
  }

  let sslValid: boolean | null = null;
  if (input.sslDomainInfo) {
    if (typeof input.sslDomainInfo.isSslValid === 'boolean') {
      sslValid = input.sslDomainInfo.isSslValid;
      const e = nextE({
        type: 'tls',
        source: 'server_tls_probe',
        value: sslValid ? 'valid' : 'invalid_or_untrusted',
        verificationStatus: 'VERIFIED',
      });
      nextF(
        sslValid
          ? `TLS/SSL: platný certifikát${input.sslDomainInfo.sslIssuer ? ` (${input.sslDomainInfo.sslIssuer})` : ''}`
          : 'TLS/SSL: neplatný nebo nedůvěryhodný certifikát',
        'server_tls_probe',
        'VERIFIED',
        [e]
      );
    }
    if (input.sslDomainInfo.creationDate) {
      const e = nextE({
        type: 'rdap_creation',
        source: 'rdap_whois',
        value: String(input.sslDomainInfo.creationDate),
        verificationStatus: 'VERIFIED',
      });
      nextF(
        `Datum registrace domény (ze zdroje RDAP/WHOIS): ${input.sslDomainInfo.creationDate}`,
        'rdap_whois',
        'VERIFIED',
        [e]
      );
    }
    if (typeof input.sslDomainInfo.domainAgeYears === 'number') {
      nextF(
        `Odvozený věk domény: ${input.sslDomainInfo.domainAgeYears.toFixed(2)} let (z data registrace)`,
        'rdap_whois_derived',
        'VERIFIED'
      );
    }
    if (input.sslDomainInfo.blockedBySsrfGuard) {
      nextF(
        `Kontrola domény odmítnuta SSRF ochranou: ${input.sslDomainInfo.error || 'blocked'}`,
        'ssrf_guard',
        'VERIFIED'
      );
    }
  }

  const phishingMatched = Boolean(input.phishingMatched);
  const phishingKilled = Boolean(input.phishingKilled);
  if (phishingMatched) {
    const e = nextE({
      type: 'phishing_db',
      source: 'phishing_validator',
      value: input.phishingPattern || 'match',
      verificationStatus: 'VERIFIED',
    });
    nextF(
      `Shoda s interní phishing / impersonation databází${input.phishingPattern ? `: ${input.phishingPattern}` : ''}`,
      'phishing_validator',
      'VERIFIED',
      [e]
    );
  }

  const cheapTld = isCheapTld(hostname);
  if (cheapTld && hostname) {
    nextF(
      `Koncovka domény je v seznamu levných TLD (podpůrný signál, ne důkaz podvodu): ${hostname}`,
      'tld_signal_list',
      'VERIFIED'
    );
  }

  const textCombined = [input.url, input.rawText, input.userNote]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  let threatFinding: ThreatFinding = 'UNKNOWN';
  if (phishingKilled || phishingMatched) {
    threatFinding = 'CONFIRMED_THREAT';
  } else if (facts.some((f) => f.verificationStatus === 'VERIFIED')) {
    threatFinding = 'NO_VERIFIED_THREAT_FOUND';
  }

  const hasUrl = Boolean(input.url && input.url.trim().length > 3);
  const hasText = Boolean(input.rawText && input.rawText.trim().length > 0);
  const hasImage = Boolean(input.hasImage);
  const insufficientData =
    !phishingMatched &&
    !knownOfficialHost &&
    sslValid == null &&
    !hasText &&
    !hasImage &&
    !hasUrl;

  return {
    collectedAt,
    hostname,
    officialDomainStatus,
    threatFinding,
    evidence,
    facts,
    insufficientData,
    hasUrl,
    hasText,
    hasImage,
    phishingMatched,
    phishingPattern: input.phishingPattern,
    sslValid,
    domainAgeYears:
      typeof input.sslDomainInfo?.domainAgeYears === 'number'
        ? input.sslDomainInfo.domainAgeYears
        : null,
    cheapTld,
    knownOfficialHost,
    textCombined,
  };
}

/** Compact JSON for Gemini FACTS block — measured only. */
export function factsForPrompt(bundle: FactBundle): Record<string, unknown> {
  return {
    truthContract: 'SGW-008',
    collectedAt: bundle.collectedAt,
    hostname: bundle.hostname,
    officialDomainStatus: bundle.officialDomainStatus,
    threatFinding: bundle.threatFinding,
    facts: bundle.facts.map((f) => ({
      factId: f.factId,
      fact: f.fact,
      source: f.source,
      verificationStatus: f.verificationStatus,
    })),
    notes: [
      'AI smí používat POUZE tato fakta a grounding zdroje z tohoto běhu.',
      'Absence hrozby v datech NENÍ důkaz bezpečnosti (NO_VERIFIED_THREAT_FOUND ≠ VERIFIED_SAFE).',
    ],
  };
}
