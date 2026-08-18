import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const scripts = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).scripts;

test('labels:check runs collaboration-labels --check', () => {
  assert.equal(scripts['labels:check'], 'node scripts/collaboration-labels.mjs --check');
});

test('gamma refresh scripts target gamma-prod-refresh.mjs', () => {
  assert.equal(scripts['gamma:refresh:dry'], 'node scripts/gamma-prod-refresh.mjs');
  assert.equal(
    scripts['gamma:refresh'],
    'GAMMA_REFRESH_EXECUTE=1 node scripts/gamma-prod-refresh.mjs',
  );
});
