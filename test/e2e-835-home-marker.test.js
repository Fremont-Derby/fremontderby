import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('home intro includes e2e deploy marker for #835', () => {
  const src = readFileSync(new URL('../src/publicPages.js', import.meta.url), 'utf8');
  assert.match(src, /data-e2e-deploy="835"/);
  assert.match(src, /E2E deploy · #835/);
});
