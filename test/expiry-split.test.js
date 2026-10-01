import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
test('stats says expiry stays off the public read', () => {
  const source = fs.readFileSync(new URL('../src/adminPlayerStatsPage.js', import.meta.url), 'utf8');
  assert.match(source, /data-expiry-split/);
});
