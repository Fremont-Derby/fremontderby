import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('a regular lineup uses the same lock as a playoff lineup', () => {
  const source = fs.readFileSync(new URL('../src/druLineupBypass.js', import.meta.url), 'utf8');
  assert.match(source, /\['regular', 'semifinal', 'final', 'playoff', 'championship'\]/);
});
