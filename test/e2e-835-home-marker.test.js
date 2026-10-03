import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('home intro does not keep the e2e deploy marker', () => {
  const src = readFileSync(new URL('../src/publicPages.js', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /data-e2e-deploy="835-gamma"/);
  assert.doesNotMatch(src, /E2E gamma→main/);
});
