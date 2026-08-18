import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('smoke-release uses x-fremont-release-smoke header', () => {
  const source = readFileSync('scripts/smoke-release.mjs', 'utf8');
  assert.match(source, /const smokeHeaderName = 'x-fremont-release-smoke'/);
  assert.match(source, /headers\[smokeHeaderName\] = bypassToken/);
});

test('smoke-release requires expectedVersionTag', () => {
  const source = readFileSync('scripts/smoke-release.mjs', 'utf8');
  assert.match(source, /if \(!expectedVersionTag\) throw new Error\('expectedVersionTag is required'\)/);
});
