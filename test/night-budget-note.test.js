import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
test('operations names the league-night time budget', () => {
  const source = fs.readFileSync(new URL('../src/adminOperationsPage.js', import.meta.url), 'utf8');
  assert.match(source, /data-night-budget/);
  assert.match(source, /retry once/);
});
