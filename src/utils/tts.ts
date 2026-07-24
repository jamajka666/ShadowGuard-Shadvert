/**
 * Text-to-Speech helper for Czech language voice readout
 */

let czechVoice: SpeechSynthesisVoice | null = null;
let voicesReady: Promise<SpeechSynthesisVoice | null> | null = null;

function pickCzechVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices.length) return null;
  const score = (v: SpeechSynthesisVoice) => {
    let s = 0;
    const lang = (v.lang || '').toLowerCase();
    const name = (v.name || '').toLowerCase();
    if (lang.startsWith('cs') || lang.startsWith('cz')) s += 10;
    if (name.includes('czech') || name.includes('čeština') || name.includes('cesky')) s += 8;
    if (name.includes('google')) s += 3;
    if (name.includes('microsoft')) s += 2;
    if (v.localService) s += 1;
    return s;
  };
  const sorted = [...voices].sort((a, b) => score(b) - score(a));
  return score(sorted[0]) > 0 ? sorted[0] : voices[0];
}

const initVoices = (): Promise<SpeechSynthesisVoice | null> => {
  if (!('speechSynthesis' in window)) {
    return Promise.resolve(null);
  }
  if (czechVoice) return Promise.resolve(czechVoice);
  if (voicesReady) return voicesReady;

  voicesReady = new Promise((resolve) => {
    const finish = () => {
      const voices = window.speechSynthesis.getVoices();
      czechVoice = pickCzechVoice(voices);
      resolve(czechVoice);
    };

    const existing = window.speechSynthesis.getVoices();
    if (existing.length > 0) {
      finish();
      return;
    }

    const onChange = () => {
      window.speechSynthesis.onvoiceschanged = null;
      finish();
    };
    window.speechSynthesis.onvoiceschanged = onChange;
    // Fallback if voiceschanged never fires (some Linux browsers)
    setTimeout(() => {
      window.speechSynthesis.onvoiceschanged = null;
      finish();
    }, 800);
  });

  return voicesReady;
};

export async function speakText(
  text: string,
  onEnd?: () => void,
  onError?: () => void
): Promise<boolean> {
  if (!('speechSynthesis' in window)) {
    console.warn('SpeechSynthesis not supported');
    onError?.();
    return false;
  }

  window.speechSynthesis.cancel();
  await initVoices();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'cs-CZ';
  utterance.rate = 0.88;
  utterance.pitch = 1.0;

  if (czechVoice) {
    utterance.voice = czechVoice;
  }

  utterance.onend = () => onEnd?.();
  utterance.onerror = (e) => {
    console.warn('SpeechSynthesis error:', e);
    onError?.();
  };

  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopSpeech() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export function isSpeaking(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking;
}
