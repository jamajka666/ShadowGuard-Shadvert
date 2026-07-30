import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isBlockedIp, assertSafePublicHost } from '../src/utils/ssrfGuard.ts';

describe('ssrfGuard isBlockedIp', () => {
  it('blocks loopback and RFC1918', () => {
    assert.equal(isBlockedIp('127.0.0.1'), true);
    assert.equal(isBlockedIp('10.1.2.3'), true);
    assert.equal(isBlockedIp('192.168.0.10'), true);
    assert.equal(isBlockedIp('172.16.5.5'), true);
    assert.equal(isBlockedIp('169.254.169.254'), true);
    assert.equal(isBlockedIp('::1'), true);
  });

  it('allows common public DNS IPs', () => {
    assert.equal(isBlockedIp('8.8.8.8'), false);
    assert.equal(isBlockedIp('1.1.1.1'), false);
  });
});

describe('ssrfGuard assertSafePublicHost', () => {
  it('rejects localhost and private literals', async () => {
    const a = await assertSafePublicHost('localhost');
    assert.equal(a.ok, false);
    const b = await assertSafePublicHost('127.0.0.1');
    assert.equal(b.ok, false);
    const c = await assertSafePublicHost('192.168.1.1');
    assert.equal(c.ok, false);
  });

  it('allows example.com with public addresses', async () => {
    const r = await assertSafePublicHost('example.com');
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.ok(r.addresses.length > 0);
      for (const ip of r.addresses) {
        assert.equal(isBlockedIp(ip), false, `unexpected private ${ip}`);
      }
    }
  });
});
