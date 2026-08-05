import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveUiMode } from '../src/design-v2/simpleModeFlag.ts';

describe('resolveUiMode (closed beta flag)', () => {
  it('defaults to first-creation', () => {
    assert.equal(resolveUiMode('', '/', null), 'first-creation');
    assert.equal(resolveUiMode('', '/', ''), 'first-creation');
  });

  it('activates via ?mode=simple', () => {
    assert.equal(resolveUiMode('?mode=simple', '/', null), 'simple');
    assert.equal(resolveUiMode('mode=jednoduchy', '/', null), 'simple');
    assert.equal(resolveUiMode('?simple=1', '/', null), 'simple');
  });

  it('activates via /simple path', () => {
    assert.equal(resolveUiMode('', '/simple', null), 'simple');
    assert.equal(resolveUiMode('', '/simple/', null), 'simple');
  });

  it('respects stored preference when no URL override', () => {
    assert.equal(resolveUiMode('', '/', 'simple'), 'simple');
  });

  it('explicit classic exits even if stored simple', () => {
    assert.equal(resolveUiMode('?mode=classic', '/', 'simple'), 'first-creation');
    assert.equal(resolveUiMode('?simple=0', '/', 'simple'), 'first-creation');
  });

  it('does not treat /design-v2 as simple app mode', () => {
    assert.equal(resolveUiMode('', '/design-v2', null), 'first-creation');
  });
});
