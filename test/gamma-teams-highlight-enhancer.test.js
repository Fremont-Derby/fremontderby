import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('teams enhancer injects ?team= highlight hook', () => {
  const src = readFileSync(new URL('../src/teamsCanonicalActionsEnhancer.js', import.meta.url), 'utf8');
  assert.match(src, /enhanceTeamsCanonicalActions/);
  assert.match(src, /href="\/availability"/);
  assert.match(src, /href="\/schedule"/);
  assert.match(src, /href="\/trades"/);
});
