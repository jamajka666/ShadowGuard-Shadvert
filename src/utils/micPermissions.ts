/**
 * Microphone & Web Speech API permissions diagnostic utility
 * Ensures proper handling for Android, Linux, HTTPS contexts, and Web Speech API limitations.
 */

export interface MicDiagnostics {
  isSecureContext: boolean;
  hasSpeechRecognitionSupport: boolean;
  hasMediaDevicesSupport: boolean;
  permissionState: 'granted' | 'denied' | 'prompt' | 'unknown' | 'unsupported';
  errorMessage?: string;
  isIframe: boolean;
}

/**
 * Evaluates browser environment and mic permissions
 */
export async function checkMicDiagnostics(): Promise<MicDiagnostics> {
  const isSecureContext =
    typeof window !== 'undefined' &&
    (window.isSecureContext ||
      window.location.protocol === 'https:' ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1');

  const SpeechRecognition =
    typeof window !== 'undefined' &&
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const hasSpeechRecognitionSupport = !!SpeechRecognition;
  const hasMediaDevicesSupport =
    typeof navigator !== 'undefined' && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

  const isIframe = typeof window !== 'undefined' && window.self !== window.top;

  let permissionState: MicDiagnostics['permissionState'] = 'unknown';

  if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
    try {
      const status = await navigator.permissions.query({ name: 'microphone' as any });
      permissionState = status.state as any; // 'granted' | 'denied' | 'prompt'
    } catch (err) {
      // Permission query for 'microphone' is not supported in all browsers (e.g. Firefox)
      permissionState = 'unknown';
    }
  }

  let errorMessage: string | undefined = undefined;

  if (!isSecureContext) {
    errorMessage = 'Prohlížeč vyžaduje zabezpečené spojení (HTTPS) pro použití mikrofonu.';
  } else if (!hasSpeechRecognitionSupport) {
    errorMessage = 'Váš prohlížeč nepodporuje rozpoznávání reči (Web Speech API). Doporučujeme Google Chrome nebo MS Edge.';
  } else if (permissionState === 'denied') {
    errorMessage = 'Přístup k mikrofonu je v prohlížeči nebo v systému zablokován.';
  }

  return {
    isSecureContext,
    hasSpeechRecognitionSupport,
    hasMediaDevicesSupport,
    permissionState,
    errorMessage,
    isIframe,
  };
}

/**
 * Triggers an explicit getUserMedia call upon user gesture (e.g. button click)
 * to request mic permission from the browser.
 */
export async function requestMicrophoneAccess(): Promise<{
  success: boolean;
  errorType?: 'not-allowed' | 'not-found' | 'insecure' | 'unknown';
  message?: string;
}> {
  const isSecure =
    typeof window !== 'undefined' &&
    (window.isSecureContext ||
      window.location.protocol === 'https:' ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1');

  if (!isSecure) {
    return {
      success: false,
      errorType: 'insecure',
      message: 'Mikrofon vyžaduje zabezpečený protokol HTTPS. Připojte se přes HTTPS.',
    };
  }

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return {
      success: false,
      errorType: 'unknown',
      message: 'Navigátor v tomto prohlížeči neposkytuje rozhraní mediaDevices.',
    };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    // Immediately stop tracks after confirming permission
    stream.getTracks().forEach((track) => track.stop());

    return {
      success: true,
      message: 'Mikrofon byl úspěšně připojen a oprávnění uděleno!',
    };
  } catch (err: any) {
    console.warn('[requestMicrophoneAccess] Error:', err);
    const name = err?.name || '';

    if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
      return {
        success: false,
        errorType: 'not-allowed',
        message: 'Povolení k mikrofonu bylo zamítnuto uživatelem nebo pravidly prohlížeče.',
      };
    } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
      return {
        success: false,
        errorType: 'not-found',
        message: 'V systému nebyl nalezen žádný mikrofon. Připojte mikrofon na Android/Linux.',
      };
    } else {
      return {
        success: false,
        errorType: 'unknown',
        message: `Chyba při přístupu k mikrofonu: ${err.message || name || 'Neznámý problém'}`,
      };
    }
  }
}

/**
 * Diagnostic steps for resolving mic access on Android and Linux
 */
export const MIC_TROUBLESHOOTING_GUIDE = {
  android: [
    'Otevřete v mobilním Chrome / Edge ikonu "Zámek" 🔒 vlevo vedle webové adresy.',
    'Klepněte na "Oprávnění webu" (Site settings) -> "Mikrofon" a zvolte "Povolit".',
    'Pokud problém přetrvává, otevřete Nastavení telefonu Android -> Aplikace -> Chrome -> Oprávnění -> Mikrofon -> Povolit.',
    'Ujistěte se, že web běží na zabezpečené adrese HTTPS.',
  ],
  linux: [
    'V prohlížeči (Chrome / Chromium / Brave / Firefox) klikněte na ikonu zámku 🔒 nebo nastavení v adresním řádku.',
    'Povolte přístup k mikrofonu pro tento web.',
    'Zkontrolujte nastavení zvuku v Linuxu (Pavucontrol / PulseAudio / PipeWire), zda je vstupní mikrofon zapnut a není ztlumen.',
    'V prohlížečích na Linuxu se doporučuje používat Google Chrome nebo Microsoft Edge pro nativní podporu Web Speech API.',
  ],
  iframeNotice: 'Pokud aplikaci prohlížíte v náhledu (iFrame), ubezpečte se, že kontejner má povolen příznak camera/microphone, případně otevřete aplikaci na samostatné záložce v novém okně.',
};

/**
 * Cleans up and deduplicates speech recognition transcript buffers
 * to eliminate Web Speech API echo duplicates (e.g. "koupímkoupímkoupím auto").
 */
export function formatSpeechResults(event: any): string {
  if (!event || !event.results) return '';

  let finalStr = '';
  let interimStr = '';

  for (let i = 0; i < event.results.length; i++) {
    const result = event.results[i];
    if (!result || !result[0]) continue;
    const transcript = result[0].transcript.trim();
    if (!transcript) continue;

    if (result.isFinal) {
      finalStr += (finalStr ? ' ' : '') + transcript;
    } else {
      // Overwrite interimStr with latest interim result to avoid interim accumulation echo
      interimStr = transcript;
    }
  }

  const combined = (finalStr ? finalStr + ' ' : '') + interimStr;
  return deduplicateSpeechEchoes(combined);
}

/**
 * Removes accidental repeated adjacent words or repeated phrase loops.
 */
export function deduplicateSpeechEchoes(text: string): string {
  if (!text) return '';

  // Standardize spaces
  const cleanSpace = text.replace(/\s+/g, ' ').trim();
  if (!cleanSpace) return '';

  const words = cleanSpace.split(' ');
  const cleanWords: string[] = [];

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (!w) continue;
    // Skip if identical to immediately preceding word (case-insensitive)
    if (i > 0 && w.toLowerCase() === words[i - 1].toLowerCase()) {
      continue;
    }
    cleanWords.push(w);
  }

  let result = cleanWords.join(' ');

  // Deduplicate repeated multi-word phrase loops (e.g. "koupím auto koupím auto" -> "koupím auto")
  const phrasePattern = /(\b.+?\b)(?:\s+\1)+/gi;
  result = result.replace(phrasePattern, '$1');

  return result;
}

