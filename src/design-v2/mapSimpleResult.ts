import type { AdCheckResult, SafetyLevel } from '../types';
import type { SimpleResultViewModel } from './simpleResultTypes';
import { statusTokens } from './tokens';

const FALLBACK_VERDICT: Record<SafetyLevel, string> = {
  DUVERYHODNE: 'Tento inzerát vypadá v pořádku.',
  OPATRNOSTI: 'Buďte opatrní.',
  PODVOD: 'Toto vypadá jako podvod.',
};

const FALLBACK_ADVICE: Record<SafetyLevel, string> = {
  DUVERYHODNE:
    'Můžete pokračovat. I tak doporučujeme osobní předání, pokud je to možné.',
  OPATRNOSTI:
    'Neposílejte peníze předem. Trvejte na osobním předání nebo ověřené platbě.',
  PODVOD:
    'Na odkaz neklikajte a nic neplaťte. Pokud už jste něco zadali, kontaktujte banku.',
};

const FALLBACK_REASONS: Record<SafetyLevel, string[]> = {
  DUVERYHODNE: [
    'Doména působí důvěryhodně',
    'Nenašli jsme podezřelé odkazy',
    'Nejde o známý podvodný vzor',
  ],
  OPATRNOSTI: [
    'Některé údaje chybí nebo působí nejasně',
    'Cena je výrazně výhodnější než obvykle',
    'Doména je relativně nová',
  ],
  PODVOD: [
    'Jde o známý podvodný vzor',
    'Odkaz vede na podezřelou doménu',
    'Požaduje údaje o kartě nebo platbu předem',
  ],
};

function cleanLine(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

/**
 * Map existing API result → Simple card model.
 * Prefers human fields; never exposes SSL/scores/jargon on the card.
 */
export function mapSimpleResult(result: AdCheckResult): SimpleResultViewModel {
  const status = result.safetyLevel;
  const tokens = statusTokens[status];

  const mainVerdict = cleanLine(result.headline) || FALLBACK_VERDICT[status];

  const fromRisk = (result.riskFactors || [])
    .map((f) => cleanLine(f.title || f.description || ''))
    .filter(Boolean);
  const fromPositive = (result.positiveFactors || [])
    .map((f) => cleanLine(f.title || f.description || ''))
    .filter(Boolean);

  let reasons: string[] =
    status === 'DUVERYHODNE'
      ? [...fromPositive, ...fromRisk]
      : [...fromRisk, ...fromPositive];

  reasons = reasons.slice(0, 4);
  if (reasons.length < 2) {
    reasons = FALLBACK_REASONS[status];
  }

  const adviceParts = (result.actionAdvice || []).map(cleanLine).filter(Boolean);
  let advice =
    adviceParts.length > 0
      ? adviceParts.slice(0, 2).join(' ')
      : cleanLine(result.summaryForSenior || '');

  if (!advice) {
    advice = FALLBACK_ADVICE[status];
  }

  return {
    status,
    badgeLabel: tokens.label,
    mainVerdict,
    reasons,
    advice,
  };
}

/** Static examples for sandbox / docs (no API). */
export function exampleSimpleResults(): SimpleResultViewModel[] {
  return (['DUVERYHODNE', 'OPATRNOSTI', 'PODVOD'] as SafetyLevel[]).map((status) => ({
    status,
    badgeLabel: statusTokens[status].label,
    mainVerdict: FALLBACK_VERDICT[status],
    reasons: FALLBACK_REASONS[status],
    advice: FALLBACK_ADVICE[status],
  }));
}
