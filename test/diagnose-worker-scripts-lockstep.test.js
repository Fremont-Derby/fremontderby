import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('diagnose-worker-domains probes permanent worker script names', () => {
  const source = readFileSync('scripts/diagnose-worker-domains.mjs', 'utf8');
  for (const script of [
    'fremontderby',
    'fremontderby-prod',
    'fremontderby-dru',
    'fremontderby-jfl',
    'fremontderby-gamma',
  ]) {
    assert.match(source, new RegExp(script));
  }
});
