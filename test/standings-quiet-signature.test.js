import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('standings quiet poll uses signature short-circuit', () => {
  const src = readFileSync(new URL('../src/standingsPage.js', import.meta.url), 'utf8');
  assert.match(src, /standingsSignature/);
  assert.match(src, /lastStandingsSignature/);
  assert.match(src, /sig===lastStandingsSignature&&quiet/);
});
