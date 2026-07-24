/**
 * Helper for processing Czech voice commands using Web Speech API
 * Includes silence detection buffer & echo suppression to prevent audio feedback loops
 */
import { speakText, stopSpeech } from './tts';

export interface VoiceCommandHandlers {
  onNavigateTab: (tab: 'analyzer' | 'alerts' | 'guide' | 'quiz' | 'history') => void;
  onOpenCriteria: () => void;
  onOpenFatherGuide: () => void;
  onOpenSendToSon: () => void;
  onOpenInstallPwa: () => void;
  onCloseModals: () => void;
  onSetThemeMode: (mode: 'cyberpunk' | 'highContrast' | 'classic' | 'shadowguard') => void;
  onSetFontSize: (size: 'normal' | 'large' | 'xlarge') => void;
  onSetAutoRead: (enabled: boolean) => void;
  onReadCurrentResult?: () => void;
  onReadLastHistoryItem?: () => void;
  onClearHistory?: () => void;
}

export interface MatchedCommandResult {
  text: string;
  actionName: string;
  success: boolean;
}

// Timestamp tracking for silence detection and command debouncing
let lastCommandExecutedTimestamp = 0;
const ECHO_DEBOUNCE_BUFFER_MS = 350;

/**
 * Speaks text after ensuring active microphone stream has settled and previous speech is stopped,
 * avoiding speaker-to-microphone feedback loops.
 */
export function speakTextWithEchoBuffer(text: string, delayMs: number = 250): void {
  stopSpeech();
  setTimeout(() => {
    speakText(text);
  }, delayMs);
}

export function parseAndExecuteVoiceCommand(
  transcript: string,
  handlers: VoiceCommandHandlers
): MatchedCommandResult | null {
  const clean = transcript.toLowerCase().trim();
  if (!clean) return null;

  // Silence detection & debounce check: ignore rapid duplicate triggers caused by audio feedback
  const now = Date.now();
  if (now - lastCommandExecutedTimestamp < ECHO_DEBOUNCE_BUFFER_MS) {
    console.log('[VoiceCommand] Ignored rapid input within silence buffer window');
    return null;
  }

  console.log('[VoiceCommand] Hearing:', clean);

  // 1. Navigation Commands
  if (clean.includes('varování') || clean.includes('hrozby') || clean.includes('aktuální podvody') || clean.includes('zprávy o podvodech')) {
    lastCommandExecutedTimestamp = Date.now();
    handlers.onNavigateTab('alerts');
    speakTextWithEchoBuffer('Otevírám sekci aktuálních varování před podvody v Česku');
    return { text: transcript, actionName: 'Otevření varování', success: true };
  }

  if (clean.includes('historii') || clean.includes('historie') || clean.includes('předchozí')) {
    lastCommandExecutedTimestamp = Date.now();
    handlers.onNavigateTab('history');
    speakTextWithEchoBuffer('Přecházím na historii inzerátů');
    return { text: transcript, actionName: 'Otevření historie', success: true };
  }

  if (clean.includes('kvíz') || clean.includes('quiz') || clean.includes('test') || clean.includes('procvič')) {
    lastCommandExecutedTimestamp = Date.now();
    handlers.onNavigateTab('quiz');
    speakTextWithEchoBuffer('Otevírám bezpečnostní kvíz');
    return { text: transcript, actionName: 'Otevření kvízu', success: true };
  }

  if (clean.includes('průvodce') || clean.includes('rady') || clean.includes('návod pro tátu') || clean.includes('senior')) {
    lastCommandExecutedTimestamp = Date.now();
    handlers.onNavigateTab('guide');
    speakTextWithEchoBuffer('Otevírám průvodce pro seniory');
    return { text: transcript, actionName: 'Otevření průvodce', success: true };
  }

  if (clean.includes('kontrola') || clean.includes('prověřit') || clean.includes('domů') || clean.includes('inzerát') || clean.includes('zpět na hlavní')) {
    lastCommandExecutedTimestamp = Date.now();
    handlers.onNavigateTab('analyzer');
    speakTextWithEchoBuffer('Přecházím na prověření inzerátu');
    return { text: transcript, actionName: 'Ověření inzerátu', success: true };
  }

  // 2. Modals & Guides
  if (clean.includes('pravid') || clean.includes('desatero') || clean.includes('kritéri') || clean.includes('zásady')) {
    lastCommandExecutedTimestamp = Date.now();
    handlers.onOpenCriteria();
    speakTextWithEchoBuffer('Zobrazuji 10 pravidel bezpečného inzerátu');
    return { text: transcript, actionName: 'Zobrazení desatera pravidel', success: true };
  }

  if (clean.includes('telefon') || clean.includes('volat syn') || clean.includes('volání') || clean.includes('tátovi')) {
    lastCommandExecutedTimestamp = Date.now();
    handlers.onOpenFatherGuide();
    speakTextWithEchoBuffer('Otevírám návod jak zavolat synovi');
    return { text: transcript, actionName: 'Návod pro telefonát', success: true };
  }

  if (clean.includes('poslat syn') || clean.includes('pomoc syna') || clean.includes('kontaktovat syna')) {
    lastCommandExecutedTimestamp = Date.now();
    handlers.onOpenSendToSon();
    speakTextWithEchoBuffer('Otevírám možnost odeslání inzerátu synovi');
    return { text: transcript, actionName: 'Odeslat synovi', success: true };
  }

  if (clean.includes('nainstalovat') || clean.includes('pwa') || clean.includes('plocha') || clean.includes('ikona')) {
    lastCommandExecutedTimestamp = Date.now();
    handlers.onOpenInstallPwa();
    speakTextWithEchoBuffer('Otevírám návod pro instalaci na plochu');
    return { text: transcript, actionName: 'Instalace na plochu', success: true };
  }

  if (clean.includes('zavřít') || clean.includes('zavři') || clean.includes('storno')) {
    lastCommandExecutedTimestamp = Date.now();
    handlers.onCloseModals();
    speakTextWithEchoBuffer('Zavírám dialogové okno');
    return { text: transcript, actionName: 'Zavření okna', success: true };
  }

  // 3. Theme & UI Settings (Direct light / dark / cyberpunk / high contrast toggles)
  if (
    clean.includes('světlý') ||
    clean.includes('světle') ||
    clean.includes('světlé') ||
    clean.includes('denní') ||
    clean.includes('klasický') ||
    clean.includes('bílé') ||
    clean.includes('bílá')
  ) {
    lastCommandExecutedTimestamp = Date.now();
    handlers.onSetThemeMode('classic');
    speakTextWithEchoBuffer('Přepínám do světlého klasického vzhledu');
    return { text: transcript, actionName: 'Světlý režim', success: true };
  }

  if (
    clean.includes('tmavý') ||
    clean.includes('tmavé') ||
    clean.includes('noční') ||
    clean.includes('shadowguard') ||
    clean.includes('strážce') ||
    clean.includes('stín')
  ) {
    lastCommandExecutedTimestamp = Date.now();
    handlers.onSetThemeMode('shadowguard');
    speakTextWithEchoBuffer('Přepínám do tmavého režimu ShadowGuard');
    return { text: transcript, actionName: 'Tmavý režim', success: true };
  }

  if (clean.includes('kyberpunk') || clean.includes('cyber') || clean.includes('neón')) {
    lastCommandExecutedTimestamp = Date.now();
    handlers.onSetThemeMode('cyberpunk');
    speakTextWithEchoBuffer('Přepínám do kyberpunkového režimu');
    return { text: transcript, actionName: 'Kyberpunk režim', success: true };
  }

  if (clean.includes('kontrast') || clean.includes('žlutý')) {
    lastCommandExecutedTimestamp = Date.now();
    handlers.onSetThemeMode('highContrast');
    speakTextWithEchoBuffer('Přepínám do vysokého kontrastu');
    return { text: transcript, actionName: 'Vysoký kontrast', success: true };
  }

  if (clean.includes('zvětšit písmo') || clean.includes('velké písmo') || clean.includes('zvětši písmo')) {
    lastCommandExecutedTimestamp = Date.now();
    handlers.onSetFontSize('xlarge');
    speakTextWithEchoBuffer('Zvětšuji velikost písma');
    return { text: transcript, actionName: 'Zvětšení písma', success: true };
  }

  if (clean.includes('menší písmo') || clean.includes('normální písmo') || clean.includes('zmenšit písmo')) {
    lastCommandExecutedTimestamp = Date.now();
    handlers.onSetFontSize('normal');
    speakTextWithEchoBuffer('Nastavuji normální písmo');
    return { text: transcript, actionName: 'Normální písmo', success: true };
  }

  // 4. Voice Reading Controls & History Reading
  if (
    clean.includes('poslední inzerát') ||
    clean.includes('poslední z historie') ||
    clean.includes('přečti poslední') ||
    clean.includes('poslední prověření') ||
    clean.includes('co naposledy') ||
    clean.includes('naposledy prověřený')
  ) {
    lastCommandExecutedTimestamp = Date.now();
    if (handlers.onReadLastHistoryItem) {
      handlers.onReadLastHistoryItem();
    }
    return { text: transcript, actionName: 'Přečíst poslední inzerát', success: true };
  }

  if (clean.includes('smazat historii') || clean.includes('vymazat historii') || clean.includes('vymaž historii')) {
    lastCommandExecutedTimestamp = Date.now();
    if (handlers.onClearHistory) {
      handlers.onClearHistory();
    }
    return { text: transcript, actionName: 'Vymazat historii', success: true };
  }

  if (clean.includes('zapnout čtení') || clean.includes('zapni čtení') || clean.includes('číst automaticky')) {
    lastCommandExecutedTimestamp = Date.now();
    handlers.onSetAutoRead(true);
    speakTextWithEchoBuffer('Zapínám automatické hlasové čtení výsledků');
    return { text: transcript, actionName: 'Zapnout čtení', success: true };
  }

  if (clean.includes('vypnout čtení') || clean.includes('vypni čtení')) {
    lastCommandExecutedTimestamp = Date.now();
    handlers.onSetAutoRead(false);
    speakTextWithEchoBuffer('Vypínám automatické čtení');
    return { text: transcript, actionName: 'Vypnout čtení', success: true };
  }

  if (clean.includes('zastavit') || clean.includes('stop') || clean.includes('ticho') || clean.includes('zmlkni')) {
    lastCommandExecutedTimestamp = Date.now();
    stopSpeech();
    return { text: transcript, actionName: 'Zastavit hlas', success: true };
  }

  if (clean.includes('přečti') || clean.includes('přečíst') || clean.includes('přečíst výsledek') || clean.includes('přečti výsledek')) {
    lastCommandExecutedTimestamp = Date.now();
    if (handlers.onReadCurrentResult) {
      handlers.onReadCurrentResult();
    }
    return { text: transcript, actionName: 'Přečtení výsledku', success: true };
  }

  return { text: transcript, actionName: 'Nerozpoznaný příkaz', success: false };
}

