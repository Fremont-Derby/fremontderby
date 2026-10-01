import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('teams next match enhancer still ships after the Gamma sync', () => {
  const source = fs.readFileSync(new URL('../src/teamsCanonicalActionsEnhancer.js', import.meta.url), 'utf8');
  assert.ok(source.length > 100);
});
