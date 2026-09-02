import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('secret put prefers versions API and does not fail deploy', () => {
  const src = readFileSync(new URL('../scripts/put-wrangler-secret.mjs', import.meta.url), 'utf8');
  assert.match(src, /classic secret put/);
  assert.match(src, /not falling back to versions secret put/);
});

test('deploy workflow secret steps are non-blocking', () => {
  const src = readFileSync(new URL('../.github/workflows/deploy-release-lanes.yml', import.meta.url), 'utf8');
  assert.match(src, /Put lane service role secret before deploy[\s\S]*continue-on-error: true/);
});

test('schedule renderRound uses signature short-circuit', () => {
  const src = readFileSync(new URL('../src/schedulePage.js', import.meta.url), 'utf8');
  assert.match(src, /roundSignature/);
  assert.match(src, /lastRoundSignature/);
});
