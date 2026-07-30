/**
 * SSRF guard for outbound domain/SSL checks (SGW-005 P1-1).
 * Blocks private/reserved IPs, localhost, link-local, and metadata hosts
 * before the server opens TLS or trusts DNS results for inspection.
 */
import dns from 'dns';
import net from 'net';

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'metadata',
  'metadata.google.internal',
  'metadata.goog',
  'kubernetes.default',
  'kubernetes.default.svc',
]);

const BLOCKED_SUFFIXES = [
  '.localhost',
  '.local',
  '.internal',
  '.intranet',
  '.corp',
  '.home',
  '.lan',
  '.localdomain',
];

export type SafeHostResult =
  | { ok: true; hostname: string; addresses: string[] }
  | { ok: false; reason: string };

function normalizeHostname(raw: string): string {
  let h = raw.trim().toLowerCase();
  // strip brackets from IPv6 literals
  if (h.startsWith('[') && h.endsWith(']')) {
    h = h.slice(1, -1);
  }
  // trailing dot (FQDN)
  while (h.endsWith('.')) h = h.slice(0, -1);
  // strip credentials if someone passed user@host
  if (h.includes('@')) {
    h = h.split('@').pop() || h;
  }
  // strip port
  if (net.isIPv6(h)) {
    // leave as-is
  } else if (h.includes(':') && !h.match(/^\d+\.\d+\.\d+\.\d+$/)) {
    // hostname:port
    const maybePort = h.split(':').pop();
    if (maybePort && /^\d+$/.test(maybePort)) {
      h = h.slice(0, h.lastIndexOf(':'));
    }
  }
  return h;
}

/** True if address must not be contacted from this server. */
export function isBlockedIp(ip: string): boolean {
  const addr = ip.trim().toLowerCase();
  if (!addr) return true;

  // IPv4-mapped IPv6 ::ffff:a.b.c.d
  const v4mapped = addr.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i);
  if (v4mapped) return isBlockedIp(v4mapped[1]);

  if (net.isIPv4(addr)) {
    const parts = addr.split('.').map((p) => Number(p));
    if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return true;
    const [a, b] = parts;
    if (a === 0) return true; // 0.0.0.0/8
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 127) return true; // loopback
    if (a === 169 && b === 254) return true; // link-local / cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16/12
    if (a === 192 && b === 168) return true; // 192.168/16
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT 100.64/10
    if (a === 192 && b === 0 && parts[2] === 0) return true; // 192.0.0.0/24 IETF
    if (a === 192 && b === 0 && parts[2] === 2) return true; // TEST-NET-1
    if (a === 198 && (b === 18 || b === 19)) return true; // benchmark
    if (a === 198 && b === 51 && parts[2] === 100) return true; // TEST-NET-2
    if (a === 203 && b === 0 && parts[2] === 113) return true; // TEST-NET-3
    if (a >= 224) return true; // multicast + reserved
    return false;
  }

  if (net.isIPv6(addr)) {
    if (addr === '::1' || addr === '::') return true;
    // unique local fc00::/7
    if (addr.startsWith('fc') || addr.startsWith('fd')) return true;
    // link-local fe80::/10
    if (addr.startsWith('fe8') || addr.startsWith('fe9') || addr.startsWith('fea') || addr.startsWith('feb')) {
      return true;
    }
    return false;
  }

  // not a parseable IP
  return true;
}

function isBlockedHostname(hostname: string): string | null {
  if (!hostname || hostname.length < 1 || hostname.length > 253) {
    return 'Neplatná nebo příliš dlouhá doména';
  }
  if (hostname.includes(' ') || hostname.includes('/') || hostname.includes('\\')) {
    return 'Neplatný tvar domény';
  }
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    return 'Tato adresa není pro kontrolu povolena';
  }
  for (const suf of BLOCKED_SUFFIXES) {
    if (hostname === suf.slice(1) || hostname.endsWith(suf)) {
      return 'Interní nebo lokální doména není pro kontrolu povolena';
    }
  }
  // bare private IP as hostname
  if (net.isIP(hostname) && isBlockedIp(hostname)) {
    return 'Soukromá nebo rezervovaná IP adresa není pro kontrolu povolena';
  }
  return null;
}

/**
 * Resolve hostname and ensure at least one public address; refuse if any
 * resolved address is private/reserved (prevents DNS rebinding to internal).
 */
export async function assertSafePublicHost(rawHostname: string): Promise<SafeHostResult> {
  const hostname = normalizeHostname(rawHostname);
  const hostBlock = isBlockedHostname(hostname);
  if (hostBlock) {
    return { ok: false, reason: hostBlock };
  }

  // If literal public IP — allow only that single address
  if (net.isIP(hostname)) {
    if (isBlockedIp(hostname)) {
      return { ok: false, reason: 'Soukromá nebo rezervovaná IP adresa není pro kontrolu povolena' };
    }
    return { ok: true, hostname, addresses: [hostname] };
  }

  try {
    const records = await dns.promises.lookup(hostname, { all: true, verbatim: true });
    if (!records.length) {
      return { ok: false, reason: 'Doménu se nepodařilo přeložit v DNS' };
    }
    const addresses = records.map((r) => r.address);
    const blocked = addresses.filter((a) => isBlockedIp(a));
    if (blocked.length > 0) {
      return {
        ok: false,
        reason: 'Doména ukazuje na neveřejnou (interní) adresu — kontrola odmítnuta',
      };
    }
    // Prefer IPv4 for TLS connect simplicity when available
    const ordered = [
      ...addresses.filter((a) => net.isIPv4(a)),
      ...addresses.filter((a) => net.isIPv6(a)),
    ];
    return { ok: true, hostname, addresses: ordered };
  } catch {
    return { ok: false, reason: 'Doménu se nepodařilo přeložit v DNS' };
  }
}
