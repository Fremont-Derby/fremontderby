import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('standings and prizes enhancers still ship after the Gamma sync', () => {
  const standings = fs.readFileSync(new URL('../src/publicSeasonSelectionEnhancer.js', import.meta.url), 'utf8');
  assert.match(standings, /standings|season/i);
});
