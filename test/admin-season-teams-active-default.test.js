import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('season teams page still ships after the Gamma sync', () => {
  const source = fs.readFileSync(new URL('../src/adminSeasonTeamsPage.js', import.meta.url), 'utf8');
  assert.match(source, /season/i);
  assert.doesNotMatch(source, /BETA_AUTH_BYPASS/);
});
