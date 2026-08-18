import test from 'node:test';
import assert from 'node:assert/strict';
import { PUBLIC_HTML_PATHS, PUBLIC_JSON_PATHS } from '../scripts/public-surface-contract.mjs';

test('PUBLIC_JSON_PATHS is frozen health pair', () => {
  assert.equal(Object.isFrozen(PUBLIC_JSON_PATHS), true);
  assert.deepEqual([...PUBLIC_JSON_PATHS], ['/health', '/health/environment']);
});

test('PUBLIC_HTML_PATHS is frozen and includes core surfaces', () => {
  assert.equal(Object.isFrozen(PUBLIC_HTML_PATHS), true);
  assert.ok(PUBLIC_HTML_PATHS.includes('/'));
  assert.ok(PUBLIC_HTML_PATHS.includes('/standings'));
  assert.ok(PUBLIC_HTML_PATHS.includes('/schedule'));
  assert.ok(PUBLIC_HTML_PATHS.includes('/teams'));
  assert.ok(PUBLIC_HTML_PATHS.includes('/scorecard'));
  assert.ok(PUBLIC_HTML_PATHS.includes('/admin'));
  assert.ok(PUBLIC_HTML_PATHS.includes('/demo'));
});
