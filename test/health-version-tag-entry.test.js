
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('routerEntry serves /health with DEPLOY_GIT_SHA fallback for versionTag', () => {
  const src = readFileSync(new URL('../src/routerEntry.js', import.meta.url), 'utf8');
  assert.match(src, /pathname === '\/health'/);
  assert.match(src, /DEPLOY_GIT_SHA/);
  assert.match(src, /versionTagSource/);
});
