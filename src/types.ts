export type SafetyLevel = 'DUVERYHODNE' | 'OPATRNOSTI' | 'PODVOD';

export type UserRoleMode = 'senior' | 'expert';

export type ThemeMode = 'shadowguard' | 'cyberpunk' | 'highContrast' | 'classic';

export interface RiskFactor {
  id: string;
  severity: 'VYSOKE' | 'STREDNI' | 'NIZKE';
  title: string;
  description: string;
}

export interface PositiveFactor {
  id: string;
  title: string;
  description: string;
}

export interface TrustedAlternative {
  name: string;
  url: string;
  description: string;
  estimatedPrice?: string;
  badge?: string;
}

export interface SSLDomainInfo {
  domain: string;
  isSslValid: boolean;
  sslIssuer?: string;
  sslValidFrom?: string;
  sslValidTo?: string;
  sslDaysRemaining?: number;
  sslProtocol?: string;
  domainAgeYears?: number;
  domainAgeText?: string;
  registrar?: string;
  creationDate?: string;
  ipAddress?: string;
  country?: string;
  trustScore?: number;
  warnings?: string[];
  checkedAt?: string;
  error?: string;
}

export type OfficialDomainStatus =
  | 'PROKAZANO_OFICIALNI'
  | 'PROKAZANO_NEOFICIALNI'
  | 'NEOVERENO';

export type VerificationStatus = 'VERIFIED' | 'DERIVED' | 'UNVERIFIED';

export interface EvidenceFact {
  factId?: string;
  fact: string;
  source: string;
  verificationStatus: VerificationStatus;
}

export interface AdCheckResult {
  id: string;
  timestamp: number;
  inputUrl?: string;
  inputSnippet?: string;
  safetyLevel: SafetyLevel;
  /** Internal score by our rules — NOT “percent safe” (SGW-008). */
  trustScore: number;
  trustScoreLabel?: string;
  headline: string;
  summaryForSenior: string;
  actionRecommendation: 'KOUPIT_BEZPECNE' | 'POUZE_OSOBNI_PREDANI' | 'NEKUPOVAT_NEPLATIT';
  actionAdvice: string[];
  riskFactors: RiskFactor[];
  positiveFactors: PositiveFactor[];
  sellerChecks: string[];
  urlAnalysis: {
    domainName: string;
    isOfficialDomain: boolean;
    officialDomainStatus?: OfficialDomainStatus;
    domainWarning?: string;
  };
  priceEvaluation: {
    /** Only true with dedicated price evidence; omit/undefined if not evaluated. */
    isPriceSuspicious?: boolean;
    priceComment: string;
    estimatedMarketPrice?: string;
    suggestedSearchTerm?: string;
  };
  eshopVisualAnalysis?: {
    isEshopDetected: boolean;
    visualTrustGrade?: 'VYBORNE' | 'USPOKOJIVE' | 'PODROBNOSTI_CHYBI' | 'PODVODNE';
    designComment?: string;
    detectedVisualFlags?: string[];
    contactInfoVisibility?: string;
  };
  sslDomainInfo?: SSLDomainInfo;
  trustedAlternatives?: TrustedAlternative[];
  groundingSources?: { title: string; url: string }[];
  evidenceFacts?: EvidenceFact[];
  unverifiedClaims?: string[];
  /** Expandable "Proč?" panel — answers why we cannot claim more (Trust UX). */
  whyPanel?: {
    show: boolean;
    title: string;
    lead: string;
    doesNotMean: string;
    checks: {
      id: string;
      label: string;
      icon: string;
      status: 'OVERENO' | 'NEOVERENO' | 'SELHALO' | 'SIGNAL' | 'NEPROVEDENO';
      meaning: string;
      kind: string;
    }[];
    recommendations: string[];
    primaryKind: string;
    structure: {
      verified: string[];
      notVerified: string[];
      whyBlocksStrongerVerdict: string;
      doesNotMean: string;
      recommend: string[];
    };
  };
  noVerdictIsNotNoHelp?: boolean;
  reasoningTrace?: string;
  scoreBreakdown?: { label: string; delta: number }[];
  internalVerdict?: 'DUVERYHODNE' | 'OPATRNOSTI' | 'PODVOD' | 'NEVIME';
  threatFinding?: 'CONFIRMED_THREAT' | 'NO_VERIFIED_THREAT_FOUND' | 'UNKNOWN';
  category?: string;
  isFallback?: boolean;
  aiRejectReasons?: string[];
  /** Hybrid rules version — same input + same rulesVersion should yield stable safetyLevel for rule path */
  rulesVersion?: string;
  /** How the verdict was produced */
  verdictSource?: 'phishing_kill' | 'hybrid_rules' | 'ai' | 'ai_rejected' | 'cache';
  cached?: boolean;
}

export interface ScamAlertItem {
  id: string;
  title: string;
  summary: string;
  riskCategory: string;
  severity: 'VYSOKE' | 'STREDNI' | 'NIZKE';
  date: string;
  recommendedAction: string;
  sourceTitle?: string;
  sourceUrl?: string;
}

export interface ScamAlertsResponse {
  alerts: ScamAlertItem[];
  lastUpdated: string;
  groundingSources?: { title: string; url: string }[];
  isLiveGrounding?: boolean;
}

export interface PredefinedScenario {
  id: string;
  title: string;
  subtitle: string;
  url: string;
  textSnippet?: string;
  badge: 'PODVOD' | 'OPATRNOSTI' | 'DUVERYHODNE';
  category: string;
}
