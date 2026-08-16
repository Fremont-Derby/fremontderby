import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeApiPathname } from '../src/pathAliases.js';

test('current prizes handler and route exist', () => {
  const src = readFileSync(new URL('../src/index.js', import.meta.url), 'utf8');
  assert.match(src, /handleGetCurrentPrizeSummaryRequest/);
  assert.match(src, /pathname === "\/api\/prizes"/);
  assert.match(src, /listPublicSeasons/);
});

test('prize aliases normalize to api/prizes', () => {
  assert.equal(normalizeApiPathname('/api/me/prizes'), '/api/prizes');
  assert.equal(normalizeApiPathname('/api/prize-pool'), '/api/prizes');
});
