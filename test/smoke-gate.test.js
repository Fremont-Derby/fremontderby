import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
test('seasons says a gate waits on a data check', () => {
  const source = fs.readFileSync(new URL('../src/adminSeasonsPage.js', import.meta.url), 'utf8');
  assert.match(source, /data-smoke-gate/);
});
