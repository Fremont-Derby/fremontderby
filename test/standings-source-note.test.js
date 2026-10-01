import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
test('standings name where the facts come from', () => {
  const source = fs.readFileSync(new URL('../src/standingsPage.js', import.meta.url), 'utf8');
  assert.match(source, /data-standings-source/);
  assert.match(source, /finalized match results/);
});
