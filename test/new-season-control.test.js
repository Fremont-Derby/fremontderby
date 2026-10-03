import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('season setup can start a new season', () => {
  const src = readFileSync(new URL('../src/seasonSetupPage.js', import.meta.url), 'utf8');
  assert.match(src, /data-new-season/);
  assert.match(src, /New season/);
  assert.match(src, /removeItem\('fd.setupSeasonId'\)/);
});
