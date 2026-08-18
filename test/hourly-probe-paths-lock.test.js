import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../scripts/hourly-live-probe.mjs', import.meta.url), 'utf8');

test('hourly-live-probe includes critical health paths', () => {
  assert.match(source, /'\/health'/);
  assert.match(source, /'\/health\/environment'/);
});

test('hourly-live-probe includes public HTML surfaces', () => {
  assert.match(source, /'\/'/);
  assert.match(source, /'\/schedule'/);
  assert.match(source, /'\/teams'/);
});

test('hourly-live-probe requires at least one PROBE host', () => {
  assert.match(source, /No PROBE_\* hosts configured/);
});
