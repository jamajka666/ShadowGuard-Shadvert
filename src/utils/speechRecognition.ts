/**
 * Shared Web Speech API engine for Czech voice commands and dictation.
 * Avoids common pitfalls: held MediaStream + recognition conflict,
 * aggressive restart loops, interim-only command firing, bad error messages.
 */

export type SpeechErrorCode =
  | 'not-allowed'
  | 'service-not-allowed'
  | 'audio-capture'
  | 'network'
  | 'no-speech'
  | 'aborted'
  | 'not-supported'
  | 'insecure'
  | 'busy'
  | 'unknown';

export interface SpeechResultPayload {
  transcript: string;
  interim: string;
  final: string;
  isFinal: boolean;
  rawEvent: SpeechRecognitionEventLike;
}

export interface SpeechRecognizerOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  /** Prefer firing command callbacks only on final results */
  preferFinal?: boolean;
  /** Auto-restart after onend while user wants listening (non-fatal errors only) */
  autoRestart?: boolean;
  restartDelayMs?: number;
  onResult?: (payload: SpeechResultPayload) => void;
  onError?: (code: SpeechErrorCode, message: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

export interface SpeechRecognizerHandle {
  start: () => Promise<void>;
  stop: () => void;
  abort: () => void;
  isActive: () => boolean;
  setDesiredListening: (on: boolean) => void;
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string; confidence?: number };
    length: number;
  }>;
  resultIndex: number;
}

type SpeechRecognitionCtor = new () => {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: ((ev: Event) => void) | null;
  onend: ((ev: Event) => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
};

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function isSecureMicContext(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.isSecureContext ||
    window.location.protocol === 'https:' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  );
}

export function isSpeechSupported(): boolean {
  return !!getSpeechRecognitionCtor();
}

export function mapSpeechError(error: string): { code: SpeechErrorCode; message: string } {
  switch (error) {
    case 'not-allowed':
    case 'service-not-allowed':
      return {
        code: error as SpeechErrorCode,
        message:
          'Mikrofon je zablokovaný. V Chrome klepněte na zámek 🔒 vedle adresy → Oprávnění → Mikrofon → Povolit. Web musí běžet přes HTTPS.',
      };
    case 'audio-capture':
      return {
        code: 'audio-capture',
        message: 'Systém nenašel aktivní mikrofon. Zkontrolujte oprávnění Androidu a zda mikrofon není používán jinou aplikací.',
      };
    case 'network':
      return {
        code: 'network',
        message:
          'Připojení k rozpoznávači řeči Google selhalo (Chrome posílá hlas do cloudu). Zkontrolujte internet a zkuste znovu. Offline režim hlas nepodporuje.',
      };
    case 'no-speech':
      return {
        code: 'no-speech',
        message: 'Nerozeznal jsem žádnou řeč. Mluvte blíže k mikrofonu a zkuste znovu.',
      };
    case 'aborted':
      return {
        code: 'aborted',
        message: 'Naslouchání bylo přerušeno.',
      };
    default:
      return {
        code: 'unknown',
        message: `Hlasové rozpoznávání selhalo (${error || 'neznámá chyba'}).`,
      };
  }
}

/**
 * Request mic permission and immediately release tracks so SpeechRecognition
 * can open the mic itself (holding both streams causes audio-capture on Android).
 */
export async function ensureMicPermission(): Promise<{
  ok: boolean;
  code?: SpeechErrorCode;
  message?: string;
}> {
  if (!isSecureMicContext()) {
    return {
      ok: false,
      code: 'insecure',
      message: 'Mikrofon vyžaduje HTTPS (nebo localhost). Otevřete aplikaci přes https://shadowguard-shadvert.site',
    };
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    return {
      ok: false,
      code: 'not-supported',
      message: 'Prohlížeč nepodporuje přístup k mikrofonu.',
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
    stream.getTracks().forEach((t) => t.stop());
    return { ok: true };
  } catch (err: unknown) {
    const name = (err as { name?: string })?.name || '';
    if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
      return {
        ok: false,
        code: 'not-allowed',
        message: 'Povolení k mikrofonu bylo zamítnuto. Povolte mikrofon v nastavení prohlížeče.',
      };
    }
    if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
      return {
        ok: false,
        code: 'audio-capture',
        message: 'Nenalezen žádný mikrofon.',
      };
    }
    return {
      ok: false,
      code: 'unknown',
      message: `Chyba mikrofonu: ${(err as Error)?.message || name || 'neznámá'}`,
    };
  }
}

function parseResults(event: SpeechRecognitionEventLike): { final: string; interim: string; transcript: string; isFinal: boolean } {
  let finalStr = '';
  let interimStr = '';
  let sawFinal = false;

  for (let i = 0; i < event.results.length; i++) {
    const result = event.results[i];
    if (!result?.[0]) continue;
    const t = (result[0].transcript || '').trim();
    if (!t) continue;
    if (result.isFinal) {
      finalStr += (finalStr ? ' ' : '') + t;
      sawFinal = true;
    } else {
      interimStr = t;
    }
  }

  const transcript = (finalStr + (interimStr ? (finalStr ? ' ' : '') + interimStr : '')).trim();
  return { final: finalStr, interim: interimStr, transcript, isFinal: sawFinal };
}

export function createSpeechRecognizer(options: SpeechRecognizerOptions = {}): SpeechRecognizerHandle {
  const Ctor = getSpeechRecognitionCtor();
  let recognition: InstanceType<SpeechRecognitionCtor> | null = null;
  let desiredListening = false;
  let starting = false;
  let restartTimer: ReturnType<typeof setTimeout> | null = null;
  let active = false;

  const clearRestart = () => {
    if (restartTimer) {
      clearTimeout(restartTimer);
      restartTimer = null;
    }
  };

  const destroyRecognition = (mode: 'stop' | 'abort' = 'stop') => {
    clearRestart();
    if (!recognition) return;
    const rec = recognition;
    recognition = null;
    rec.onstart = null;
    rec.onend = null;
    rec.onerror = null;
    rec.onresult = null;
    try {
      if (mode === 'abort') rec.abort();
      else rec.stop();
    } catch {
      /* ignore */
    }
    active = false;
  };

  const wire = () => {
    if (!Ctor) return null;
    const rec = new Ctor();
    rec.lang = options.lang || 'cs-CZ';
    rec.continuous = options.continuous ?? false;
    rec.interimResults = options.interimResults ?? true;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      starting = false;
      active = true;
      options.onStart?.();
    };

    rec.onresult = (event) => {
      // Ignore while TTS is speaking (echo protection)
      if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking) {
        return;
      }
      const parsed = parseResults(event);
      if (options.preferFinal && !parsed.isFinal && !parsed.final) {
        // Still report interim for UI
        options.onResult?.({
          transcript: parsed.transcript,
          interim: parsed.interim,
          final: parsed.final,
          isFinal: false,
          rawEvent: event,
        });
        return;
      }
      options.onResult?.({
        transcript: parsed.transcript,
        interim: parsed.interim,
        final: parsed.final,
        isFinal: parsed.isFinal,
        rawEvent: event,
      });
    };

    rec.onerror = (event) => {
      const { code, message } = mapSpeechError(event.error || 'unknown');
      // no-speech and aborted are soft when auto-restarting
      if (code === 'no-speech' || code === 'aborted') {
        if (!desiredListening) {
          options.onError?.(code, message);
        }
        return;
      }
      if (code === 'not-allowed' || code === 'service-not-allowed' || code === 'audio-capture') {
        desiredListening = false;
      }
      options.onError?.(code, message);
    };

    rec.onend = () => {
      active = false;
      starting = false;
      options.onEnd?.();

      const shouldRestart =
        desiredListening &&
        (options.autoRestart ?? false) &&
        !document.hidden;

      if (shouldRestart) {
        clearRestart();
        restartTimer = setTimeout(() => {
          if (desiredListening) {
            void startInternal(true);
          }
        }, options.restartDelayMs ?? 500);
      }
    };

    return rec;
  };

  const startInternal = async (isRestart = false) => {
    if (!Ctor) {
      options.onError?.('not-supported', 'Váš prohlížeč nepodporuje Web Speech API. Použijte Google Chrome nebo Microsoft Edge.');
      return;
    }
    if (!isSecureMicContext()) {
      options.onError?.(
        'insecure',
        'Hlas vyžaduje HTTPS. Otevřete https://shadowguard-shadvert.site (ne HTTP IP adresu).'
      );
      return;
    }
    if (starting || (active && !isRestart)) {
      return;
    }

    // Pause if TTS is speaking — wait briefly
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      await new Promise((r) => setTimeout(r, 200));
    }

    starting = true;
    destroyRecognition('abort');

    if (!isRestart) {
      const mic = await ensureMicPermission();
      if (!mic.ok) {
        starting = false;
        desiredListening = false;
        options.onError?.(mic.code || 'unknown', mic.message || 'Mikrofon nedostupný');
        return;
      }
    }

    recognition = wire();
    if (!recognition) {
      starting = false;
      options.onError?.('not-supported', 'SpeechRecognition není k dispozici.');
      return;
    }

    try {
      recognition.start();
    } catch (err) {
      starting = false;
      active = false;
      // InvalidStateError if already started — try once more after abort
      destroyRecognition('abort');
      try {
        recognition = wire();
        recognition?.start();
        starting = true;
      } catch {
        desiredListening = false;
        options.onError?.('busy', 'Nelze spustit rozpoznávání řeči. Zkuste znovu za chvíli.');
      }
    }
  };

  return {
    start: async () => {
      desiredListening = true;
      await startInternal(false);
    },
    stop: () => {
      desiredListening = false;
      destroyRecognition('stop');
    },
    abort: () => {
      desiredListening = false;
      destroyRecognition('abort');
    },
    isActive: () => active,
    setDesiredListening: (on: boolean) => {
      desiredListening = on;
    },
  };
}

/** Deduplicate adjacent word/phrase echoes from Web Speech API */
export function dedupeSpeechText(text: string): string {
  if (!text) return '';
  const cleanSpace = text.replace(/\s+/g, ' ').trim();
  const words = cleanSpace.split(' ');
  const out: string[] = [];
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (!w) continue;
    if (i > 0 && w.toLowerCase() === words[i - 1].toLowerCase()) continue;
    out.push(w);
  }
  let result = out.join(' ');
  result = result.replace(/(\b.+?\b)(?:\s+\1)+/gi, '$1');
  return result;
}
