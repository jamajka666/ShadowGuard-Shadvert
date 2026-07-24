export interface PhishingCheckResult {
  isPhishing: boolean;
  severity: 'HIGH' | 'MEDIUM' | 'SAFE';
  reason?: string;
  matchedPattern?: string;
  domainName?: string;
  isKilledBeforeGemini?: boolean;
}

// Official trusted Czech domain suffixes
const LEGIT_DOMAINS = [
  'bazos.cz',
  'sbazar.cz',
  'zasilkovna.cz',
  'packeta.cz',
  'packeta.com',
  'dpd.cz',
  'dpd.com',
  'ppl.cz',
  'ceskaposta.cz',
  'balikovna.cz',
  'vinted.cz',
  'alza.cz',
  'datart.cz',
  'mall.cz',
  'czc.cz',
  'heureka.cz',
  'sauto.cz',
  'reality.idnes.cz',
  'facebook.com',
  'm.facebook.com',
  'instagram.com',
];

// Dangerous phishing keywords/patterns in domain names
const PHISHING_DOMAIN_PATTERNS = [
  { pattern: /zasilkovna[-_]?platba/i, label: 'Falešná Zásilkovna (platba)' },
  { pattern: /zasilkovna[-_]?doriceni/i, label: 'Falešná Zásilkovna (doručení)' },
  { pattern: /zasilkovna[-_]?vyzvednuti/i, label: 'Falešná Zásilkovna (vyzvednutí)' },
  { pattern: /packeta[-_]?secure/i, label: 'Falešná Packeta/Zásilkovna' },
  { pattern: /dpd[-_]?(kurir|kuryr|platba|zasilka|vyzvednuti|overeni)/i, label: 'Falešný DPD kurýr' },
  { pattern: /ppl[-_]?(kurir|kuryr|platba|zasilka)/i, label: 'Falešný PPL kurýr' },
  { pattern: /ceskaposta[-_]?(zasilka|platba|overeni)/i, label: 'Falešná Česká pošta' },
  { pattern: /balikovna[-_]?(platba|vyzvednuti|overeni)/i, label: 'Falešná Balíkovna' },
  { pattern: /bazos[-_]?(platba|potvrzeni|kuryr|kuryr|garance|bezpecna)/i, label: 'Falešný klon Bazoš.cz' },
  { pattern: /sbazar[-_]?(doriceni|platba|kuryr|kuryr)/i, label: 'Falešný klon Sbazar.cz' },
  { pattern: /vinted[-_]?(kurier|kuryr|platba|vyzvednuti)/i, label: 'Falešný klon Vinted' },
  { pattern: /cz[-_]?platby/i, label: 'Podezřelý platební portál cz-platby' },
  { pattern: /secure[-_]?pay[-_]?cz/i, label: 'Falešná platební brána secure-pay' },
  { pattern: /doprava[-_]?platba/i, label: 'Podvodný odkaz na doprava-platba' },
  { pattern: /overeni[-_]?karty/i, label: 'Phishingová stránka pro ověření karty' },
  { pattern: /garance[-_]?penez/i, label: 'Falešná garance peněz' },
];

// Suspicious Top Level Domains commonly used for phishing
const SUSPICIOUS_TLDS = [
  '.online',
  '.site',
  '.store',
  '.top',
  '.xyz',
  '.info',
  '.click',
  '.link',
  '.club',
  '.live',
  '.shop',
  '.tk',
  '.ga',
  '.cf',
  '.gq',
  '.ml',
  '.zip',
  '.mov',
  '.cc',
  '.phishing',
];

// Known typosquatted brand variations
const TYPOSQUATTED_PATTERNS = [
  /bazoos\.cz/i,
  /bazos-cz\.com/i,
  /zasilkowna\.cz/i,
  /zasilkovna-cz\.com/i,
  /alzaa\.cz/i,
  /ceskapostaa\.cz/i,
];

/**
 * Validates a URL against known phishing domains and fraudulent patterns.
 */
export function checkPhishingUrl(urlInput: string): PhishingCheckResult {
  if (!urlInput || typeof urlInput !== 'string') {
    return { isPhishing: false, severity: 'SAFE' };
  }

  const trimmed = urlInput.trim();
  if (!trimmed) {
    return { isPhishing: false, severity: 'SAFE' };
  }

  let hostname = '';
  try {
    const fullUrl = trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : 'https://' + trimmed;
    const urlObj = new URL(fullUrl);
    hostname = urlObj.hostname.toLowerCase();
  } catch {
    hostname = trimmed.toLowerCase().split('/')[0];
  }

  // 1. Check if it's an exact legit domain or official subdomain
  const isExactLegit = LEGIT_DOMAINS.some(
    (legit) => hostname === legit || hostname.endsWith('.' + legit)
  );

  if (isExactLegit) {
    return {
      isPhishing: false,
      severity: 'SAFE',
      domainName: hostname,
    };
  }

  // 2. Check IP Address URLs (e.g. http://192.168.1.1 or http://45.142.214.11)
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipRegex.test(hostname)) {
    return {
      isPhishing: true,
      severity: 'HIGH',
      reason: 'Odkaz směřuje na čistou IP adresu bez doménového jména. To je typický znak podvodného serveru.',
      matchedPattern: 'Surová IP adresa místo domény',
      domainName: hostname,
      isKilledBeforeGemini: true,
    };
  }

  // 3. Check for specific courier/marketplace phishing keywords in domain name
  for (const item of PHISHING_DOMAIN_PATTERNS) {
    if (item.pattern.test(hostname)) {
      return {
        isPhishing: true,
        severity: 'HIGH',
        reason: `Odhalena známá phishingová doména imituijící oficiální službu: ${item.label}.`,
        matchedPattern: item.label,
        domainName: hostname,
        isKilledBeforeGemini: true,
      };
    }
  }

  // 4. Check for Subdomain Masking / Fake Prefixes
  // e.g. "bazos.cz.secure-pay.xyz" or "zasilkovna.cz.pay-overeni.top"
  for (const legit of ['bazos.cz', 'sbazar.cz', 'zasilkovna.cz', 'dpd.cz', 'ppl.cz', 'vinted.cz', 'alza.cz']) {
    if (hostname.includes(legit) && !hostname.endsWith('.' + legit) && hostname !== legit) {
      return {
        isPhishing: true,
        severity: 'HIGH',
        reason: `Maskovaná doména! Odkaz předstírá, že směřuje na ${legit}, ale ve skutečnosti vede na cizí nebezpečný server.`,
        matchedPattern: `Maskování domény ${legit}`,
        domainName: hostname,
        isKilledBeforeGemini: true,
      };
    }
  }

  // 5. Check typosquatting
  for (const typoPattern of TYPOSQUATTED_PATTERNS) {
    if (typoPattern.test(hostname)) {
      return {
        isPhishing: true,
        severity: 'HIGH',
        reason: 'Odkaz používá komolený název oficiální služby (typosquatting) pro oklamání oběti.',
        matchedPattern: 'Komolená doména (Typosquatting)',
        domainName: hostname,
        isKilledBeforeGemini: true,
      };
    }
  }

  // 6. Check for courier/brand words combined with suspicious TLDs
  const containsBrandKeyword = /(zasilk|dpd|ppl|posta|balik|bazos|sbazar|vinted|alza|platba|kuryr|kurier)/i.test(hostname);
  const hasSuspiciousTLD = SUSPICIOUS_TLDS.some((tld) => hostname.endsWith(tld));

  if (containsBrandKeyword && hasSuspiciousTLD) {
    return {
      isPhishing: true,
      severity: 'HIGH',
      reason: `Podezřelá doména s koncovkou ${hostname.substring(hostname.lastIndexOf('.'))}. Oficiální české služby nepoužívají tyto neobvyklé koncovky pro platby.`,
      matchedPattern: `Podezřelá TLD koncovka s názvem značky`,
      domainName: hostname,
      isKilledBeforeGemini: true,
    };
  }

  // If suspicious TLD alone without explicit brand name
  if (hasSuspiciousTLD) {
    return {
      isPhishing: true,
      severity: 'MEDIUM',
      reason: `Adresa používá neobvyklou koncovku (${hostname.substring(hostname.lastIndexOf('.'))}), které bývají často zneužívány k podvodným účelům.`,
      matchedPattern: `Podezřelá doménová koncovka`,
      domainName: hostname,
      isKilledBeforeGemini: false,
    };
  }

  return {
    isPhishing: false,
    severity: 'SAFE',
    domainName: hostname,
  };
}
