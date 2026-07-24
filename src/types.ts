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

export interface AdCheckResult {
  id: string;
  timestamp: number;
  inputUrl?: string;
  inputSnippet?: string;
  safetyLevel: SafetyLevel;
  trustScore: number; // 0 to 100
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
    domainWarning?: string;
  };
  priceEvaluation: {
    isPriceSuspicious: boolean;
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
  category?: string;
  isFallback?: boolean;
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
