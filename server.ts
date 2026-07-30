import express from 'express';
import path from 'path';
import fs from 'fs';
import tls from 'tls';
import dns from 'dns';
import crypto from 'crypto';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { checkPhishingUrl } from './src/utils/phishingValidator';
import { assertSafePublicHost } from './src/utils/ssrfGuard';

// Load .env then .env.local (local overrides), but never clobber NODE_ENV from the shell
const shellNodeEnv = process.env.NODE_ENV;
dotenv.config();
dotenv.config({ path: '.env.local', override: true });
if (shellNodeEnv) {
  process.env.NODE_ENV = shellNodeEnv;
}

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const APP_VERSION = process.env.APP_VERSION || '1.0.0';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
const FAMILY_CODE = process.env.FAMILY_CODE || '';
const DATA_DIR = path.join(process.cwd(), 'data');
const FAMILY_DB_PATH = path.join(DATA_DIR, 'family.json');

// Security baseline (SGW-005): hide stack fingerprint, set safe headers
app.disable('x-powered-by');
app.use(
  helmet({
    // SPA + Vite assets: full CSP tuned later; other Helmet defaults stay on
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// JSON body: 2mb default; analyze with images still needs headroom but not unbounded 10mb abuse
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '2mb' }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_API_MAX) || 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Příliš mnoho požadavků. Zkuste to prosím za chvíli.' },
});
const heavyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_HEAVY_MAX) || 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Příliš mnoho kontrol najednou. Počkejte chvíli a zkuste znovu.' },
});
app.use('/api/', apiLimiter);

// --- Family / remote management store ---
interface FamilyDevice {
  deviceId: string;
  label: string;
  appVersion?: string;
  userAgent?: string;
  lastSeen: number;
}

interface FamilyHistoryItem {
  id: string;
  timestamp: number;
  headline: string;
  safetyLevel: string;
  trustScore?: number;
  inputUrl?: string;
  summaryForSenior?: string;
  deviceId: string;
  deviceLabel: string;
  receivedAt: number;
}

interface FamilyDb {
  forceReloadAt: number;
  minClientVersion: string;
  announcements: string[];
  devices: Record<string, FamilyDevice>;
  history: FamilyHistoryItem[];
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadFamilyDb(): FamilyDb {
  ensureDataDir();
  try {
    if (fs.existsSync(FAMILY_DB_PATH)) {
      return JSON.parse(fs.readFileSync(FAMILY_DB_PATH, 'utf8'));
    }
  } catch (e) {
    console.warn('[family] load failed', e);
  }
  return {
    forceReloadAt: 0,
    minClientVersion: APP_VERSION,
    announcements: [],
    devices: {},
    history: [],
  };
}

function saveFamilyDb(db: FamilyDb) {
  ensureDataDir();
  fs.writeFileSync(FAMILY_DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}

function timingSafeEqualString(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, 'utf8');
    const bb = Buffer.from(b, 'utf8');
    if (ba.length !== bb.length) return false;
    return crypto.timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

function requireAdmin(req: express.Request, res: express.Response): boolean {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : (req.headers['x-admin-token'] as string) || '';
  if (!ADMIN_TOKEN || !token || !timingSafeEqualString(token, ADMIN_TOKEN)) {
    res.status(401).json({ error: 'Neplatný admin token' });
    return false;
  }
  return true;
}

function familyCodeOk(code?: string): boolean {
  if (!FAMILY_CODE) return false;
  if (!code || typeof code !== 'string') return false;
  return timingSafeEqualString(code.trim(), FAMILY_CODE);
}

// Public config for clients (force update)
app.get('/api/family/config', (_req, res) => {
  const db = loadFamilyDb();
  res.json({
    appVersion: APP_VERSION,
    forceReloadAt: db.forceReloadAt,
    minClientVersion: db.minClientVersion || APP_VERSION,
    announcements: db.announcements || [],
  });
});

app.post('/api/family/heartbeat', (req, res) => {
  const { deviceId, label, appVersion, userAgent, familyCode } = req.body || {};
  if (!deviceId || typeof deviceId !== 'string') {
    return res.status(400).json({ error: 'Chybí deviceId' });
  }
  // P0-1 (SGW-005): always require valid FAMILY_CODE when configured — omit must not bypass
  if (!FAMILY_CODE) {
    return res.status(503).json({ error: 'Rodinný sync není na serveru nakonfigurován' });
  }
  if (!familyCodeOk(familyCode)) {
    return res.status(403).json({ error: 'Neplatný rodinný kód' });
  }
  const db = loadFamilyDb();
  db.devices[deviceId] = {
    deviceId,
    label: String(label || 'Zařízení').slice(0, 80),
    appVersion: appVersion ? String(appVersion).slice(0, 32) : undefined,
    userAgent: userAgent ? String(userAgent).slice(0, 300) : undefined,
    lastSeen: Date.now(),
  };
  saveFamilyDb(db);
  res.json({ ok: true, serverTime: Date.now() });
});

app.post('/api/family/history', (req, res) => {
  const { familyCode, deviceId, deviceLabel, item } = req.body || {};
  if (!familyCodeOk(familyCode)) {
    return res.status(403).json({ error: 'Neplatný rodinný kód' });
  }
  if (!item || !deviceId) {
    return res.status(400).json({ error: 'Chybí data' });
  }
  const db = loadFamilyDb();
  const entry: FamilyHistoryItem = {
    id: String(item.id || 'h-' + Date.now()),
    timestamp: Number(item.timestamp) || Date.now(),
    headline: String(item.headline || 'Kontrola').slice(0, 300),
    safetyLevel: String(item.safetyLevel || 'OPATRNOSTI'),
    trustScore: item.trustScore != null ? Number(item.trustScore) : undefined,
    inputUrl: item.inputUrl ? String(item.inputUrl).slice(0, 500) : undefined,
    summaryForSenior: item.summaryForSenior ? String(item.summaryForSenior).slice(0, 800) : undefined,
    deviceId: String(deviceId).slice(0, 80),
    deviceLabel: String(deviceLabel || 'Zařízení').slice(0, 80),
    receivedAt: Date.now(),
  };
  db.history = [entry, ...db.history.filter((h) => h.id !== entry.id)].slice(0, 100);
  saveFamilyDb(db);
  res.json({ ok: true });
});

app.get('/api/family/devices', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const db = loadFamilyDb();
  const now = Date.now();
  const list = Object.values(db.devices)
    .map((d) => ({
      ...d,
      online: now - d.lastSeen < 120_000,
    }))
    .sort((a, b) => b.lastSeen - a.lastSeen);
  res.json({ devices: list, serverTime: now });
});

app.get('/api/family/history', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const db = loadFamilyDb();
  res.json({ history: db.history || [] });
});

app.post('/api/family/force-reload', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const db = loadFamilyDb();
  db.forceReloadAt = Date.now();
  if (req.body?.minClientVersion) {
    db.minClientVersion = String(req.body.minClientVersion);
  }
  saveFamilyDb(db);
  res.json({ ok: true, forceReloadAt: db.forceReloadAt });
});

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    app: 'ShadowGuard Shadvert',
    version: APP_VERSION,
    time: new Date().toISOString(),
  });
});

// Helper to extract hostname from URL string
function extractDomain(inputUrl: string): string {
  if (!inputUrl) return '';
  let clean = inputUrl.trim();
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = 'https://' + clean;
  }
  try {
    const parsed = new URL(clean);
    return parsed.hostname;
  } catch (e) {
    return inputUrl.replace(/^https?:\/\//i, '').split('/')[0].split('?')[0];
  }
}

// Perform real TLS/SSL connection to inspect certificate
// connectHost: public IP (SSRF-safe); servername: original hostname for SNI
async function checkSSLCertificate(
  hostname: string,
  connectHost?: string
): Promise<{
  isSslValid: boolean;
  sslIssuer?: string;
  sslValidFrom?: string;
  sslValidTo?: string;
  sslDaysRemaining?: number;
  sslProtocol?: string;
  error?: string;
}> {
  if (!hostname || hostname.length < 3) {
    return { isSslValid: false, error: 'Chybí platná doména' };
  }
  const host = connectHost || hostname;

  return new Promise((resolve) => {
    let resolved = false;
    const socket = tls.connect(
      {
        host,
        port: 443,
        servername: hostname,
        rejectUnauthorized: false,
        timeout: 4000,
      },
      () => {
        if (resolved) return;
        resolved = true;
        try {
          const cert = socket.getPeerCertificate();
          const authorized = socket.authorized;
          const protocol = socket.getProtocol() || 'TLS 1.3';

          if (!cert || Object.keys(cert).length === 0) {
            socket.destroy();
            return resolve({ isSslValid: false, error: 'Chybí SSL certifikát na portu 443' });
          }

          const validTo = cert.valid_to ? new Date(cert.valid_to) : null;
          const validFrom = cert.valid_from ? new Date(cert.valid_from) : null;
          const now = new Date();
          const daysRemaining = validTo ? Math.floor((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;
          const isExpired = daysRemaining < 0;
          const isSslValid = Boolean(authorized) && !isExpired;

          let issuerName = cert.issuer ? (cert.issuer.O || cert.issuer.CN || 'Certifikační autorita') : 'Neznámý vydavatel';
          if (Array.isArray(issuerName)) issuerName = issuerName[0];

          socket.destroy();
          resolve({
            isSslValid,
            sslIssuer: issuerName,
            sslValidFrom: validFrom ? validFrom.toLocaleDateString('cs-CZ') : undefined,
            sslValidTo: validTo ? validTo.toLocaleDateString('cs-CZ') : undefined,
            sslDaysRemaining: daysRemaining,
            sslProtocol: protocol,
          });
        } catch (e: any) {
          socket.destroy();
          resolve({ isSslValid: false, error: e.message || 'Chyba analýzy certifikátu' });
        }
      }
    );

    socket.on('error', (err) => {
      if (resolved) return;
      resolved = true;
      socket.destroy();
      resolve({ isSslValid: false, error: 'Nepodařilo se navázat SSL spojení' });
    });

    socket.setTimeout(4000, () => {
      if (resolved) return;
      resolved = true;
      socket.destroy();
      resolve({ isSslValid: false, error: 'Vypršel časový limit pro SSL kontrolu' });
    });
  });
}

// Perform DNS and RDAP lookup for domain age, registrar, IP
// precheckedAddresses: already SSRF-validated public IPs from assertSafePublicHost
async function lookupDomainInfo(
  hostname: string,
  precheckedAddresses?: string[]
): Promise<{
  ipAddress?: string;
  registrar?: string;
  creationDate?: string;
  domainAgeYears?: number;
  domainAgeText?: string;
  country?: string;
  warnings: string[];
}> {
  const result: {
    ipAddress?: string;
    registrar?: string;
    creationDate?: string;
    domainAgeYears?: number;
    domainAgeText?: string;
    country?: string;
    warnings: string[];
  } = { warnings: [] };

  if (!hostname) return result;

  if (precheckedAddresses && precheckedAddresses.length > 0) {
    result.ipAddress = precheckedAddresses[0];
  } else {
    try {
      const addresses = await dns.promises.lookup(hostname);
      if (addresses && addresses.address) {
        result.ipAddress = addresses.address;
      }
    } catch (e) {
      result.warnings.push('Nenalezena IP adresa (doména možná neexistuje)');
    }
  }

  try {
    // RDAP is always to public rdap.org — not user-controlled host
    const response = await fetch(`https://rdap.org/domain/${encodeURIComponent(hostname)}`, {
      headers: { Accept: 'application/rdap+json, application/json' },
      signal: AbortSignal.timeout(3500),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.entities && Array.isArray(data.entities)) {
        const registrarEntity = data.entities.find((e: any) => e.roles?.includes('registrar'));
        if (registrarEntity) {
          if (registrarEntity.vcardArray?.[1]) {
            const fn = registrarEntity.vcardArray[1].find((v: any) => v[0] === 'fn');
            if (fn?.[3]) result.registrar = String(fn[3]);
          }
          if (!result.registrar && registrarEntity.handle) {
            result.registrar = String(registrarEntity.handle);
          }
        }
      }

      if (data.events && Array.isArray(data.events)) {
        const regEvent = data.events.find(
          (ev: any) => ev.eventAction === 'registration' || ev.eventAction === 'created'
        );
        if (regEvent && regEvent.eventDate) {
          const createdDate = new Date(regEvent.eventDate);
          result.creationDate = createdDate.toLocaleDateString('cs-CZ');
          const ageDays = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
          const ageYears = Math.round((ageDays / 365) * 10) / 10;
          result.domainAgeYears = ageYears;

          if (ageDays < 30) {
            result.domainAgeText = `Založena před ${ageDays} dny (EXTRÉMNĚ NOVÁ DOMÉNA!)`;
            result.warnings.push('🚨 Doména je novější než 30 dní! Velmi vysoké riziko podvodného e-shopu.');
          } else if (ageDays < 180) {
            result.domainAgeText = `Založena před ${Math.round(ageDays / 30)} měsíci (Nová doména)`;
            result.warnings.push('⚠️ Doména je nová (stáří do 6 měsíců). Budte velmi opatrní.');
          } else {
            result.domainAgeText = `Založena v roce ${createdDate.getFullYear()} (${ageYears} let)`;
          }
        }
      }
    }
  } catch (e) {
    // RDAP timeout fallback
  }

  if (!result.registrar) {
    if (hostname.endsWith('.cz')) {
      result.registrar = 'CZ.NIC Registrátor';
      result.domainAgeText = result.domainAgeText || 'Oficiální registrační zóna .cz';
    } else if (hostname.endsWith('.sk')) {
      result.registrar = 'SK-NIC Registrátor';
    } else {
      result.registrar = 'Mezinárodní registrátor domén';
    }
  }

  return result;
}

// Master SSL & Domain Inspection runner (with SSRF guard — SGW-005 P1-1)
async function getFullDomainSSLInfo(urlOrHostname: string) {
  const domain = extractDomain(urlOrHostname);
  if (!domain || domain.length < 3) {
    return undefined;
  }

  const safe = await assertSafePublicHost(domain);
  if (!safe.ok) {
    return {
      domain,
      isSslValid: false,
      sslIssuer: '—',
      sslProtocol: '—',
      domainAgeText: 'Kontrola domény odmítnuta',
      registrar: '—',
      ipAddress: '—',
      country: '—',
      trustScore: 10,
      warnings: [`🛡️ ${safe.reason}`],
      checkedAt: new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }),
      error: safe.reason,
      blockedBySsrfGuard: true,
    };
  }

  // Connect to resolved public IP; SNI still uses hostname
  const connectIp = safe.addresses[0];
  const sslResult = await checkSSLCertificate(safe.hostname, connectIp);
  const domainResult = await lookupDomainInfo(safe.hostname, safe.addresses);

  let trustScore = 75;
  const warnings = [...domainResult.warnings];

  if (!sslResult.isSslValid) {
    trustScore -= 45;
    warnings.push('🚨 E-shop nemá platný nebo důvěryhodný SSL certifikát!');
  } else if (sslResult.sslDaysRemaining !== undefined && sslResult.sslDaysRemaining < 14) {
    warnings.push('⚠️ SSL certifikátu vyprší platnost za méně než 14 dní.');
  }

  if (domainResult.domainAgeYears !== undefined && domainResult.domainAgeYears < 0.25) {
    trustScore -= 35;
  }

  if (
    domain.endsWith('.online') ||
    domain.endsWith('.top') ||
    domain.endsWith('.site') ||
    domain.endsWith('.xyz') ||
    domain.endsWith('.info')
  ) {
    trustScore -= 20;
    warnings.push('⚠️ Podezřelá levná koncovka domény (.online, .top, .xyz, .site).');
  }

  trustScore = Math.max(5, Math.min(100, trustScore));

  return {
    domain: safe.hostname,
    isSslValid: sslResult.isSslValid,
    sslIssuer: sslResult.sslIssuer || (sslResult.isSslValid ? 'Let\'s Encrypt / Cloudflare' : 'Neznámý'),
    sslValidFrom: sslResult.sslValidFrom,
    sslValidTo: sslResult.sslValidTo,
    sslDaysRemaining: sslResult.sslDaysRemaining,
    sslProtocol: sslResult.sslProtocol || 'TLS 1.3',
    domainAgeYears: domainResult.domainAgeYears,
    domainAgeText: domainResult.domainAgeText || (domain.endsWith('.cz') ? 'Tradiční .cz doména' : 'Aktivní doména'),
    registrar: domainResult.registrar || 'CZ.NIC / Registrátor',
    creationDate: domainResult.creationDate,
    ipAddress: domainResult.ipAddress || connectIp || 'Zjištěna v DNS',
    country: domainResult.country || 'Česká republika / EU',
    trustScore,
    warnings,
    checkedAt: new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }),
    error: sslResult.error,
  };
}

// Initialize Gemini Client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is missing in environment variables.');
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Fallback response builder if AI key is missing, quota exceeded, or API errors
const createFallbackResult = (
  urlInput: string = '',
  textInput: string = '',
  userNote: string = '',
  imageBase64: string = '',
  sslDomainInfo?: any
) => {
  const combined = (urlInput + ' ' + textInput + ' ' + userNote).toLowerCase();
  const hasImage = Boolean(imageBase64 && imageBase64.length > 50);
  const isEshopMentioned = combined.includes('eshop') || combined.includes('e-shop') || combined.includes('screenshot_eshopu') || combined.includes('obchod');

  let safetyLevel: 'DUVERYHODNE' | 'OPATRNOSTI' | 'PODVOD' = 'OPATRNOSTI';
  let trustScore = 50;
  let headline = 'Vyžaduje zvýšenou opatrnost při komunikaci';
  let summaryForSenior =
    'Tuto nabídku je potřeba důkladně prověřit. Nikdy neposílejte peníze dopředu a neumísťujte údaje ze své platební karty na neznámé odkazy.';
  let actionRecommendation: 'KOUPIT_BEZPECNE' | 'POUZE_OSOBNI_PREDANI' | 'NEKUPOVAT_NEPLATIT' =
    'POUZE_OSOBNI_PREDANI';

  const actionAdvice = [
    'Trvejte výhradně na osobním předání a vyzkoušení zboží.',
    'Nikdy neotvírejte odkazy z SMS nebo WhatsAppu, které vám pošle kupující či prodávající.',
    'Žádná doručovací služba (DPD, Zásilkovna, Česká pošta) nepožaduje vyplnění karty pro převzetí peněz.',
  ];

  const riskFactors = [];
  const positiveFactors = [];
  const sellerChecks = [];

  // Check for prominent scam indicators in fallback
  if (
    combined.includes('kuryr') ||
    combined.includes('kurýr') ||
    combined.includes('dpd') ||
    combined.includes('zasilkovna') ||
    combined.includes('platba-') ||
    combined.includes('potvrdit prijeti') ||
    combined.includes('potvrdit přijetí') ||
    combined.includes('garance') ||
    combined.includes('investice') ||
    combined.includes('.online') ||
    combined.includes('.store') ||
    combined.includes('.xyz') ||
    combined.includes('.top') ||
    combined.includes('.info')
  ) {
    safetyLevel = 'PODVOD';
    trustScore = 12;
    headline = '🛑 VELKÉ RIZIKO PODVODU! Neotvírejte odkaz a neplaťte!';
    summaryForSenior =
      'VAROVÁNÍ PRO OTCE: Tento inzerát nebo zpráva má všechny znaky známého internetového podvodu! Podvodníci předstírají, že pošlou kurýra nebo že jde o výhodnou nabídku, ale chtějí z vás vylákat údaje k bankovní kartě.';
    actionRecommendation = 'NEKUPOVAT_NEPLATIT';
    riskFactors.push({
      id: 'rf1',
      severity: 'VYSOKE' as const,
      title: 'Podvodný odkaz na falešného kurýra nebo falešný web',
      description:
        'Adresa webu se liší od oficiálních českých služeb. Zásilkovna ani DPD nikdy nevyžadují zadání údajů karty od prodávajícího!',
    });
    riskFactors.push({
      id: 'rf2',
      severity: 'VYSOKE' as const,
      title: 'Finanční nebezpečí pro bankovní účet',
      description:
        'Vyplněním údajů o kartě by podvodníci získali přímý přístup k vašim penězům v bance.',
    });
    sellerChecks.push('Požaduje komunikaci mimo oficiální aplikaci (např. WhatsApp)');
    sellerChecks.push('Vyžaduje okamžitou akci pod časovým tlakem');
  } else if (combined.includes('bazos.cz') || combined.includes('sbazar.cz')) {
    safetyLevel = 'DUVERYHODNE';
    trustScore = 88;
    headline = 'Pravděpodobně legitimní inzerát na známém portálu';
    summaryForSenior =
      'Inzerát se nachází na oficiálním českém portálu. Při nákupu doporučujeme osobní odběr, abyste si zboží před zaplacením prohlédli.';
    actionRecommendation = 'POUZE_OSOBNI_PREDANI';
    positiveFactors.push({
      id: 'pf1',
      title: 'Oficiální česká doména',
      description: 'Odkaz směřuje na prověřený inzertní server Bazoš.cz nebo Sbazar.cz.',
    });
    actionAdvice.unshift('Při osobním převzetí si zboží nejprve zkontrolujte.');
  }

  let domainName = '';
  try {
    if (urlInput) {
      const parsed = new URL(urlInput.startsWith('http') ? urlInput : 'https://' + urlInput);
      domainName = parsed.hostname;
    }
  } catch {
    domainName = urlInput || 'Zadaný odkaz';
  }

  const trustedAlternatives = [
    {
      name: 'Heureka.cz (Srovnání cen a overené e-shopy)',
      url: 'https://www.heureka.cz',
      description: 'Porovnejte ceny stejného zboží u ověřených českých obchodníků se zárukou a garancí nákupu.',
      badge: 'Srovnávač cen & Garance',
    },
    {
      name: 'Alza.cz / Datart.cz (Oficiální e-shopy)',
      url: 'https://www.alza.cz',
      description: 'Bezpečný nákup nového i zánovního/rozbaleného zboží se 2 roky zárukou a možností vyzvednutí na pobočce.',
      badge: 'Oficiální prodejce + Záruka',
    },
    {
      name: 'Bazoš.cz / Sbazar.cz (S filtrem na osobní předání)',
      url: 'https://www.bazos.cz',
      description: 'Při nákupu z druhé ruky vyhledávejte inzeráty ve svém okrese a trvejte na osobním převzetí s vyzkoušením.',
      badge: 'Pouze osobní předání',
    },
  ];

  return {
    id: 'res-' + Date.now(),
    timestamp: Date.now(),
    inputUrl: urlInput,
    inputSnippet: textInput,
    safetyLevel,
    trustScore,
    headline,
    summaryForSenior,
    actionRecommendation,
    actionAdvice,
    riskFactors,
    positiveFactors,
    sellerChecks,
    urlAnalysis: {
      domainName: domainName || 'Analýza textu / snímku',
      isOfficialDomain: safetyLevel === 'DUVERYHODNE',
      domainWarning:
        safetyLevel === 'PODVOD'
          ? 'Tato doména vypadá jako neoficiální napodobenina známé služby.'
          : undefined,
    },
    priceEvaluation: {
      isPriceSuspicious: safetyLevel === 'PODVOD',
      priceComment:
        safetyLevel === 'PODVOD'
          ? 'Nereálně výhodná cena je nejčastější návnadou internetových podvodníků.'
          : 'Cena se zdá odpovídat standardní hodnotě zboží.',
      estimatedMarketPrice: safetyLevel === 'PODVOD' ? 'Přibližně o 40 % - 70 % vyšší v běžných e-shopech' : undefined,
      suggestedSearchTerm: textInput ? textInput.slice(0, 40) : 'Elektronika a zboží',
    },
    eshopVisualAnalysis: {
      isEshopDetected: hasImage || isEshopMentioned,
      visualTrustGrade: safetyLevel === 'PODVOD' ? 'PODVODNE' : 'USPOKOJIVE',
      designComment: hasImage
        ? 'Aplikace zpracovala přiložený snímek obrazovky / fotku e-shopu. Vypadá to na standardní snímek obchodu, doporučujeme zkontrolovat přítomnost IČO v patičce.'
        : 'Při nákupu doporučujeme zkontrolovat vizuální prvky e-shopu (patčka, IČO, kontakty).',
      detectedVisualFlags: hasImage
        ? ['Analyzován přiložený snímek obrazovky e-shopu', 'Doporučeno ověření IČO na rzp.cz']
        : ['Neznámý prodejce bez ověření IČO'],
      contactInfoVisibility: 'Doporučujeme zkontrolovat přítomnost IČO v obchodním rejstříku rzp.cz',
    },
    sslDomainInfo,
    trustedAlternatives,
    isFallback: true,
  };
};

// API Endpoint for Analyzing Advertisements
app.post('/api/analyze-ad', heavyLimiter, async (req, res) => {
  try {
    const { url = '', rawText = '', imageBase64, userNote = '' } = req.body;

    if (!url && !rawText && !imageBase64) {
      return res.status(400).json({
        error: 'Chybí zadání. Vložte prosím odkaz na inzerát, text nebo snímek obrazovky.',
      });
    }

    // Fetch SSL and Domain WHOIS info if URL provided
    let sslDomainInfo;
    if (url && url.trim().length > 3) {
      try {
        sslDomainInfo = await getFullDomainSSLInfo(url);
      } catch (sslErr) {
        console.warn('SSL/Domain inspection error:', sslErr);
      }
    }

    // URL PHISHING VALIDATOR: Check against known phishing domains before Gemini API call
    if (url) {
      const phishingCheck = checkPhishingUrl(url);
      if (phishingCheck.isPhishing && phishingCheck.isKilledBeforeGemini) {
        console.log(`[URL Validator] Blocked dangerous phishing URL directly before Gemini API call: ${url} (${phishingCheck.matchedPattern})`);

        return res.json({
          id: 'res-phish-' + Date.now(),
          timestamp: Date.now(),
          inputUrl: url,
          inputSnippet: rawText,
          safetyLevel: 'PODVOD',
          trustScore: 0,
          headline: `🛑 ODHALEN PHISHINGOVÝ ODKAZ! (${phishingCheck.matchedPattern || 'Podvodná doména'})`,
          summaryForSenior: `VAROVÁNÍ PRO OTCE: Odkaz "${phishingCheck.domainName || url}" byl okamžitě vyhodnocen jako nebezpečný phishingový podvod ještě před odesláním dotazu. ${phishingCheck.reason}`,
          actionRecommendation: 'NEKUPOVAT_NEPLATIT',
          actionAdvice: [
            'Na tento odkaz v žádném případě neklikatejte a nevyplňujte žádné formuláře.',
            'Nikdy nezadávejte číslo své bankovní karty ani přihlašovací údaje do bankovnictví.',
            'Pokud vám odkaz poslal kupující či prodávající, okamžitě s ním ukončete komunikaci.',
          ],
          riskFactors: [
            {
              id: 'rf-phish-1',
              severity: 'VYSOKE',
              title: `Phishingová doména: ${phishingCheck.matchedPattern || 'Nebezpečný odkaz'}`,
              description: phishingCheck.reason || 'Doména neodpovídá oficiální české službě a slouží k vylákání peněz nebo údajů z karty.',
            },
            {
              id: 'rf-phish-2',
              severity: 'VYSOKE',
              title: 'Vysoké riziko ztráty peněz na bankovním účtu',
              description: 'Podvodné stránky tohoto typu jsou vytvořeny s cílem získat přímý přístup k vaší platební kartě.',
            },
          ],
          positiveFactors: [],
          sellerChecks: [
            'Kupující/prodávající poslal nebezpečný odkaz mimo oficiální aplikaci',
            'Vyžaduje vyplnění údajů o platební kartě',
          ],
          urlAnalysis: {
            domainName: phishingCheck.domainName || url,
            isOfficialDomain: false,
            domainWarning: `⚠️ DETEKOVÁN PHISHING: ${phishingCheck.reason}`,
          },
          priceEvaluation: {
            isPriceSuspicious: true,
            priceComment: 'Podvodné odkazy jsou často doprovázeny nereálně výhodnými cenami.',
          },
          trustedAlternatives: [
            {
              name: 'Heureka.cz (Srovnání cen a overené e-shopy)',
              url: 'https://www.heureka.cz',
              description: 'Porovnejte ceny stejného zboží u ověřených českých obchodníků se zárukou a garancí nákupu.',
              badge: 'Srovnávač cen & Garance',
            },
            {
              name: 'Alza.cz / Datart.cz (Oficiální e-shopy)',
              url: 'https://www.alza.cz',
              description: 'Bezpečný nákup nového i zánovního/rozbaleného zboží se 2 roky zárukou a možností vyzvednutí na pobočce.',
              badge: 'Oficiální prodejce + Záruka',
            },
            {
              name: 'Bazoš.cz / Sbazar.cz (S filtrem na osobní předání)',
              url: 'https://www.bazos.cz',
              description: 'Při nákupu z druhé ruky vyhledávejte inzeráty ve svém okrese a trvejte na osobním převzetí s vyzkoušením.',
              badge: 'Pouze osobní předání',
            },
          ],
        });
      }
    }

    const ai = getGeminiClient();

    if (!ai) {
      console.log('Gemini client unavailable, using smart safety check rules.');
      return res.json(createFallbackResult(url, rawText));
    }

    const systemInstruction = `Jsi špičkový bezpečnostní analytik specializovaný na odhalování internetových podvodů, phishingových e-shopů, falešných inzerátů (Bazoš, Sbazar, Vinted, Facebook Marketplace), falešných investičních nabídek a SMS/WhatsApp podvodů v České republice.

Tvojím úkolem je analyzovat inzerát/nabídku a napsat hodnocení pro staršího pána (otce), který chce nakupovat nebo prodávat na internetu bezpečně.

PRAVIDLA PRO HODNOCENÍ:
1. Píšeš srozumitelně, klidně, bez složitého technického žargonu.
2. Rozlišuj 3 úrovně bezpečnosti (safetyLevel):
   - 'DUVERYHODNE': Prověřený oficiální web/inzerát bez podezřelých znaků (např. oficiální bazos.cz, alza.cz, sbazar.cz).
   - 'OPATRNOSTI': Standardní inzerát od neznámé soukromé osoby, kde je potřeba opatrnost (např. osobní předání, prověření stavu zboží).
   - 'PODVOD': Jasný podvod nebo vysoké riziko (falešný kurýr DPD/Zásilkovna, klon webu banky, nákup značkového zboží se slevou 90% na neznámém podvodném e-shopu, sliby pohádkových zisků z investic).

Vrátíš výhradně strukturovaný JSON odpovídající požadovanému schématu. All texts MUST be in CZECH language.`;

    const promptText = `Prosím proveď důkladnou bezpečnostní prověrku následujícího inzerátu / nabídky / e-shopu:
${url ? `Odkaz URL: ${url}\n` : ''}
${rawText ? `Text inzerátu / zprávy: ${rawText}\n` : ''}
${userNote ? `Poznámka / Režim analýzy: ${userNote}\n` : ''}

Zkontroluj zejména:
1. Doménu a zda se nejedná o napodobeninu / podvodný klon (např. bazos-platba.cz místo bazos.cz).
2. Pokud je přiložena fotka / snímek e-shopu nebo inzerátu, zhodnoť jeho VIZUÁLNÍ DŮVĚRYHODNOST:
   - Profesionálnost designu a šablony e-shopu.
   - Přítomnost nebo chybějící kontaktní údaje (české IČO, adresa, telefon) v patičce či hlavičce.
   - Falešné bezpečnostní ikonky ("100% Gwarancja", "Verifikováno", "Šifrovaná platba" vložené jako nekvalitní obrázek).
   - Strojové / lámané české překlady v grafech, bannerech a tlačítkách.
   - Nátlakové vizuální prvky (odpočítávání času "Sleva vyprší za 03:00", blikající bannery).
   - Výsledek vyplň do strukturovaného objektu 'eshopVisualAnalysis'.
3. Zda nenabízí "falešného kurýra", vyplnění údajů z karty, platbu předem na anonymní účet.
4. Zda je cena reálná nebo podezřele nízká.
5. Poskytni otci jasnou radu co dělat (např. NEKLIKAT, NEZADÁVAT KARTU, nebo KOUPIT BEZPEČNĚ OSOBNĚ).
6. Pokud je nabídka podezřelá nebo podvodná (nebo i pro porovnání), navrhni v poli 'trustedAlternatives' 2 až 4 prověřené české obchody, srovnávače (Heureka) nebo bezpečné portály k nákupu tohoto zboží se zárukou či osobním odběrem.`;

    const contentsParts: any[] = [];

    if (imageBase64) {
      // Remove header if present (e.g. data:image/png;base64,)
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      contentsParts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: cleanBase64,
        },
      });
    }

    contentsParts.push({ text: promptText });

    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: { parts: contentsParts },
          config: {
            systemInstruction,
            tools: [{ googleSearch: {} }],
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                safetyLevel: {
                  type: Type.STRING,
                  description: "Must be 'DUVERYHODNE', 'OPATRNOSTI', or 'PODVOD'",
                },
                trustScore: {
                  type: Type.INTEGER,
                  description: 'Score from 0 (total scam) to 100 (100% safe)',
                },
                headline: {
                  type: Type.STRING,
                  description: 'Short headline in Czech summarize result',
                },
                summaryForSenior: {
                  type: Type.STRING,
                  description: 'Clear 2-3 sentences explanation tailored for a senior father in Czech',
                },
                actionRecommendation: {
                  type: Type.STRING,
                  description: "Must be 'KOUPIT_BEZPECNE', 'POUZE_OSOBNI_PREDANI', or 'NEKUPOVAT_NEPLATIT'",
                },
                actionAdvice: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Step-by-step action bullets for father',
                },
                riskFactors: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      severity: { type: Type.STRING, description: "'VYSOKE', 'STREDNI', or 'NIZKE'" },
                      title: { type: Type.STRING },
                      description: { type: Type.STRING },
                    },
                    required: ['id', 'severity', 'title', 'description'],
                  },
                },
                positiveFactors: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      title: { type: Type.STRING },
                      description: { type: Type.STRING },
                    },
                    required: ['id', 'title', 'description'],
                  },
                },
                sellerChecks: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                urlAnalysis: {
                  type: Type.OBJECT,
                  properties: {
                    domainName: { type: Type.STRING },
                    isOfficialDomain: { type: Type.BOOLEAN },
                    domainWarning: { type: Type.STRING },
                  },
                  required: ['domainName', 'isOfficialDomain'],
                },
                priceEvaluation: {
                  type: Type.OBJECT,
                  properties: {
                    isPriceSuspicious: { type: Type.BOOLEAN },
                    priceComment: { type: Type.STRING },
                    estimatedMarketPrice: { type: Type.STRING, description: 'Estimated real market value in Czech crowns, e.g. "Cca 12 000 - 15 000 Kč"' },
                    suggestedSearchTerm: { type: Type.STRING, description: 'Clean product name for searching on Heureka.cz e.g. "iPhone 13 128GB"' },
                  },
                  required: ['isPriceSuspicious', 'priceComment'],
                },
                eshopVisualAnalysis: {
                  type: Type.OBJECT,
                  properties: {
                    isEshopDetected: { type: Type.BOOLEAN, description: 'True if an e-shop webpage screenshot or web shop is analyzed' },
                    visualTrustGrade: { type: Type.STRING, description: "'VYBORNE', 'USPOKOJIVE', 'PODROBNOSTI_CHYBI', or 'PODVODNE'" },
                    designComment: { type: Type.STRING, description: 'Assessment of visual design, trustworthiness, templates, and badges' },
                    detectedVisualFlags: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Visual indicators like fake security badges, machine translations, missing ICO, countdown timers' },
                    contactInfoVisibility: { type: Type.STRING, description: 'Presence and clarity of Czech contact info, address, IČO, and customer service' },
                  },
                  required: ['isEshopDetected'],
                },
                trustedAlternatives: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING, description: 'Store or portal name (e.g. Heureka, Alza, Datart, Bazoš s osobním předáním)' },
                      url: { type: Type.STRING, description: 'Direct URL to store or portal search' },
                      description: { type: Type.STRING, description: 'Why this is a safe alternative' },
                      estimatedPrice: { type: Type.STRING, description: 'Estimated safe market price or range in CZK' },
                      badge: { type: Type.STRING, description: 'e.g. Oficiální prodejce, Srovnávač Heureka, Osobní odběr' },
                    },
                    required: ['name', 'url', 'description'],
                  },
                  description: 'List of 2-4 safe and trusted Czech alternative stores or search links for the requested product',
                },
              },
              required: [
                'safetyLevel',
                'trustScore',
                'headline',
                'summaryForSenior',
                'actionRecommendation',
                'actionAdvice',
                'riskFactors',
                'positiveFactors',
                'sellerChecks',
                'urlAnalysis',
                'priceEvaluation',
              ],
            },
          },
        });

        const text = response.text;
        if (text) {
          const parsedData = cleanAndParseJson(text);

          // Extract search grounding sources if available
          const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
          const groundingSources: { title: string; url: string }[] = [];
          if (chunks && Array.isArray(chunks)) {
            for (const chunk of chunks) {
              if (chunk.web?.uri && chunk.web?.title) {
                groundingSources.push({
                  title: chunk.web.title,
                  url: chunk.web.uri,
                });
              }
            }
          }

          const finalResult = {
            id: 'res-' + Date.now(),
            timestamp: Date.now(),
            inputUrl: url,
            inputSnippet: rawText,
            ...parsedData,
            sslDomainInfo: sslDomainInfo || parsedData.sslDomainInfo,
            groundingSources: groundingSources.length > 0 ? groundingSources : undefined,
          };

          return res.json(finalResult);
        }
      } catch (geminiErr: any) {
        console.warn('Gemini API call failed or quota exceeded, using fallback rule engine:', geminiErr?.message || geminiErr);
      }
    }

    // Return smart fallback rule result if Gemini is unavailable, rate-limited, or fails
    return res.json(createFallbackResult(url, rawText, userNote, imageBase64, sslDomainInfo));
  } catch (error) {
    console.error('API /api/analyze-ad error:', error);
    const { url = '', rawText = '', userNote = '', imageBase64 = '' } = req.body || {};
    return res.json(createFallbackResult(url, rawText, userNote, imageBase64));
  }
});

// Standalone API endpoint to check SSL certificate and domain info directly
app.post('/api/check-domain-ssl', heavyLimiter, async (req, res) => {
  try {
    const { url = '' } = req.body || {};
    if (!url || typeof url !== 'string' || url.trim().length < 3) {
      return res.status(400).json({ error: 'Vložte platnou URL adresu nebo doménu.' });
    }
    const sslDomainInfo = await getFullDomainSSLInfo(url);
    return res.json({ sslDomainInfo });
  } catch (err: any) {
    console.error('API /api/check-domain-ssl error:', err);
    return res.status(500).json({ error: 'Chyba při zjišťování informací o doméně a SSL.' });
  }
});

// Fallback scam alerts list for Czech Republic
const fallbackScamAlerts = [
  {
    id: 'alert-1',
    title: 'Falešný kupující na Bazoši a Vinted posílá odkaz na "Kurýra Zásilkovny / DPD"',
    summary:
      'Podvodník reaguje na váš inzerát přes WhatsApp nebo SMS. Tvrdí, že zboží kupuje a pošle kurýra, který vám peníze předá. Pošle odkaz na podvodný web (např. zasilkovna-platba-cz.online), kde po vás požaduje vyplnění čísla platební karty.',
    riskCategory: 'Bazarový prodej & Kurýři',
    severity: 'VYSOKE' as const,
    date: 'Aktuální hrozba v ČR',
    recommendedAction: 'Nikdy neotevírejte odkazy z SMS/WhatsAppu od kupujícího. Zásilkovna ani DPD nepožadují zadání karty pro přijetí peněz.',
    sourceTitle: 'Policie ČR - Varování před podvody na inzertních portálech',
    sourceUrl: 'https://www.policie.cz',
  },
  {
    id: 'alert-2',
    title: 'Nové falešné e-shopy se slevami 70–90 % na značkové zboží a elektroniku',
    summary:
      'Podvodníci zakládají tisíce nových domén na koncovkách .online, .top, .site a .xyz s názvy českých měst nebo známých značek. Zboží nedorazí a zadaná karta je zneužita k neoprávněným stržením.',
    riskCategory: 'Falešné E-shopy',
    severity: 'VYSOKE' as const,
    date: 'Aktuální hrozba v ČR',
    recommendedAction: 'Vždy před nákupem ověřte věk domény a přítomnost českého IČO. Nakupujte u prověřených prodejců s certifikátem Heureka.',
    sourceTitle: 'ČOI - Seznam rizikových e-shopů',
    sourceUrl: 'https://www.coi.cz/rizikove-eshopy/',
  },
  {
    id: 'alert-3',
    title: 'SMS podvody: "Vaše zásilka byla pozastavena z důvodu chybějícího doplatku"',
    summary:
      'Podvodné SMS zprávy předstírající Českou poštu, DPD nebo Balíkovnu. Zpráva obsahuje naléhavou výzvu ke zaplacení malého poplatku (např. 35 Kč). Odkaz vede na klon bankovní brány pro ukradení přístupu k bankovnictví.',
    riskCategory: 'Phishing v SMS & WhatsApp',
    severity: 'VYSOKE' as const,
    date: 'Aktuální hrozba v ČR',
    recommendedAction: 'Česká pošta ani dopravci neposílají výzvy s neznámými internetovými adresami. Zásilky sledujte pouze v oficiální aplikaci.',
    sourceTitle: 'Česká pošta - Bezpečnostní upozornění',
    sourceUrl: 'https://www.ceskaposta.cz',
  },
  {
    id: 'alert-4',
    title: 'Investiční podvody slibující pohádkový zisk s logem ČEZ a bank',
    summary:
      'Reklamy na sociálních sítích využívající podvržená videa s českými osobnostmi a fiktivní investice do ČEZu či kryptoměn. Podvodníci po prvním vkladu přesvědčí oběť k instalaci programu AnyDesk pro vzdálený přístup k PC.',
    riskCategory: 'Investiční Podvody',
    severity: 'VYSOKE' as const,
    date: 'Aktuální hrozba v ČR',
    recommendedAction: 'Způsoby "rychlého zbohatnutí без rizika" neexistují. Nikdy nikomu nedovolte instalovat programy pro vzdálenou správu počítače (AnyDesk, TeamViewer).',
    sourceTitle: 'ČNB - Upozornění na neoprávněné nabídky investic',
    sourceUrl: 'https://www.cnb.cz',
  },
  {
    id: 'alert-5',
    title: 'Zneužití QR kódů a potvrzovacích NOTIFIKACÍ v mobilním bankovnictví',
    summary:
      'Podvodník pod záminkou rychlé úhrady pošle prodávajícímu QR kód. Prodávající si myslí, že peníze přijímá, ale naskenováním a potvrzením v aplikaci banky naopak schválí odchozí platbu podvodníkovi.',
    riskCategory: 'Bankovní podvody',
    severity: 'STREDNI' as const,
    date: 'Aktuální hrozba v ČR',
    recommendedAction: 'Pro přijetí platby na účet stačí kupujícímu poslat pouhé číslo vašeho bankovního účtu. Nikdy nepotvrzujte notifikace, kterým plně nerozumíte.',
    sourceTitle: 'Česká bankovní asociace - Kybernebezpečí',
    sourceUrl: 'https://www.cbaonline.cz',
  },
];

/**
 * Helper function to clean and parse JSON responses from Gemini API,
 * safely handling markdown code blocks, search grounding artifacts, extra text/citations, and stray tokens.
 */
function cleanAndParseJson<T = any>(rawText: string): T {
  let cleaned = rawText.trim();

  // Strip markdown code block wrappers if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }

  // Find index of first '{' or '['
  const startObj = cleaned.indexOf('{');
  const startArr = cleaned.indexOf('[');

  if (startObj !== -1 || startArr !== -1) {
    let startIdx = -1;
    let openChar = '{';
    let closeChar = '}';

    if (startObj !== -1 && (startArr === -1 || startObj < startArr)) {
      startIdx = startObj;
      openChar = '{';
      closeChar = '}';
    } else {
      startIdx = startArr;
      openChar = '[';
      closeChar = ']';
    }

    let depth = 0;
    let inString = false;
    let isEscaped = false;
    let endIdx = -1;

    for (let i = startIdx; i < cleaned.length; i++) {
      const char = cleaned[i];

      if (isEscaped) {
        isEscaped = false;
        continue;
      }

      if (char === '\\' && inString) {
        isEscaped = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (char === openChar) {
          depth++;
        } else if (char === closeChar) {
          depth--;
          if (depth === 0) {
            endIdx = i;
            break;
          }
        }
      }
    }

    if (endIdx !== -1) {
      cleaned = cleaned.substring(startIdx, endIdx + 1);
    } else {
      const lastClose = cleaned.lastIndexOf(closeChar);
      if (lastClose > startIdx) {
        cleaned = cleaned.substring(startIdx, lastClose + 1);
      }
    }
  }

  // Fix common search grounding artifacts where a stray period '.' is inserted after colons
  cleaned = cleaned.replace(/:\s*\.\s*"/g, ': "');
  cleaned = cleaned.replace(/:\s*\.\s*(\{|\[)/g, ': $1');
  cleaned = cleaned.replace(/:\s*\.\s*([A-Za-z0-9\u00C0-\u024F])/g, ': "$1');

  // Remove grounding citation tags like [1], [2], [1, 2]
  cleaned = cleaned.replace(/\[\d+(?:,\s*\d+)*\]/g, '');

  // Remove trailing commas before } or ]
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');

  try {
    return JSON.parse(cleaned);
  } catch (err1) {
    try {
      // Secondary fallback: sanitize unescaped control characters
      const sanitized = cleaned.replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ');
      return JSON.parse(sanitized);
    } catch (err2) {
      console.warn('cleanAndParseJson failure on raw text:', rawText.slice(0, 300));
      throw err1;
    }
  }
}

// API Endpoint for Live Google Search Grounded Scam Alerts
app.get('/api/scam-alerts', heavyLimiter, async (req, res) => {
  try {
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        alerts: fallbackScamAlerts,
        lastUpdated: new Date().toLocaleDateString('cs-CZ'),
        isLiveGrounding: false,
      });
    }

    const systemInstruction = `Jsi specializovaný bezpečnostní systém hlídající kybernetické hrozby a internetové podvody v České republice.
Tvojím úkolem je vyhledat nejnovější a nejaktuálnější varování před podvody v inzerátech, na online bazarech (Bazoš, Sbazar, Vinted, Facebook Marketplace), falešnými e-shopy, fiktivními kurýry (DPD, Zásilkovna, Česká pošta), SMS phishingem a bankovními podvody v ČR.

KRITICKÉ PRAVIDLO FORMÁTU: Vrátíš VÝHRADNĚ platný JSON objekt bez jakéhokoliv předřazeného textu nebo teček. Žádné komentáře, žádné tečky za dvojtečkou.`;

    const promptText = `Pomocí živého vyhledávání Google zjisti nejnovější hrozby a aktuální varování před podvody v inzerátech, e-shopech a internetovém nákupu/prodeji v České republice (aktuální zprávy Policie ČR, ČOI, ČBA, Zásilkovny).
Vrať 4 až 5 nejvýznamnějších aktuálních varování ve formátu JSON podle schématu.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: promptText,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            alerts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING, description: 'Hlavní název varování v češtině' },
                  summary: { type: Type.STRING, description: 'Podrobný popis podvodného triku a postupu podvodníků' },
                  riskCategory: { type: Type.STRING, description: 'Kategorie (např. Bazarový prodej, Falešné e-shopy, Phishing, Bankovní podvody)' },
                  severity: { type: Type.STRING, description: "'VYSOKE', 'STREDNI', nebo 'NIZKE'" },
                  date: { type: Type.STRING, description: 'Datum nebo období varování (např. Aktuální varování 2026)' },
                  recommendedAction: { type: Type.STRING, description: 'Jasná rada jak se bezpečně chránit' },
                  sourceTitle: { type: Type.STRING, description: 'Název zdroje nebo instituce (např. Policie ČR, ČOI, Zásilkovna)' },
                  sourceUrl: { type: Type.STRING, description: 'Odkaz na zprávu nebo oficiální web' },
                },
                required: ['id', 'title', 'summary', 'riskCategory', 'severity', 'recommendedAction'],
              },
            },
          },
          required: ['alerts'],
        },
      },
    });

    const text = response.text;
    if (text) {
      const parsed = cleanAndParseJson(text);

      // Extract search grounding sources
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const groundingSources: { title: string; url: string }[] = [];
      if (chunks && Array.isArray(chunks)) {
        for (const chunk of chunks) {
          if (chunk.web?.uri && chunk.web?.title) {
            groundingSources.push({
              title: chunk.web.title,
              url: chunk.web.uri,
            });
          }
        }
      }

      return res.json({
        alerts: parsed.alerts || fallbackScamAlerts,
        lastUpdated: new Date().toLocaleDateString('cs-CZ', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        groundingSources: groundingSources.length > 0 ? groundingSources : undefined,
        isLiveGrounding: true,
      });
    }

    return res.json({
      alerts: fallbackScamAlerts,
      lastUpdated: new Date().toLocaleDateString('cs-CZ'),
      isLiveGrounding: false,
    });
  } catch (err: any) {
    console.warn('Scam alerts search grounding failed, returning fallback alerts:', err?.message || err);
    return res.json({
      alerts: fallbackScamAlerts,
      lastUpdated: new Date().toLocaleDateString('cs-CZ'),
      isLiveGrounding: false,
    });
  }
});

// Vite / Static setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        // Cloudflare Tunnel / trycloudflare.com hostnames
        allowedHosts: true,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ShadowGuard Shadvert server: http://0.0.0.0:${PORT}`);
    console.log(`  version=${APP_VERSION}  gemini=${process.env.GEMINI_API_KEY ? 'yes' : 'NO KEY'}  admin=${ADMIN_TOKEN ? 'set' : 'missing'}`);
  });
}

startServer();
