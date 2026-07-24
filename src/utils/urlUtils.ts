/**
 * Utility to clean long URLs (e.g. Facebook Marketplace tracking params, UTM tags)
 * to keep SMS and share messages concise and within character limits.
 */
export function cleanUrlForSharing(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return trimmed;
  }

  try {
    const urlObj = new URL(trimmed);

    // If Facebook Marketplace, strip tracking queries keep pathname
    if (urlObj.hostname.includes('facebook.com') && urlObj.pathname.includes('/marketplace/item/')) {
      return `${urlObj.origin}${urlObj.pathname}`;
    }

    // Strip common tracking query parameters
    const paramsToKeep = new URLSearchParams();
    urlObj.searchParams.forEach((val, key) => {
      const lowerKey = key.toLowerCase();
      if (
        !lowerKey.startsWith('utm_') &&
        !lowerKey.startsWith('fbclid') &&
        !lowerKey.startsWith('gclid') &&
        !lowerKey.startsWith('ref') &&
        !lowerKey.startsWith('referral') &&
        !lowerKey.startsWith('tracking') &&
        !lowerKey.startsWith('qid') &&
        !lowerKey.startsWith('mf_story_key')
      ) {
        paramsToKeep.append(key, val);
      }
    });

    const queryString = paramsToKeep.toString();
    const cleanResult = `${urlObj.origin}${urlObj.pathname}${queryString ? '?' + queryString : ''}`;

    // If still longer than 120 chars, truncate pathname/query
    if (cleanResult.length > 120) {
      return cleanResult.substring(0, 117) + '...';
    }

    return cleanResult;
  } catch (e) {
    // Fallback if URL parsing fails
    if (trimmed.length > 100) {
      return trimmed.substring(0, 97) + '...';
    }
    return trimmed;
  }
}
