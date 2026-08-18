import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('profile season status shows join and payment states without jargon', () => {
  const src = readFileSync(new URL('../src/profileSeasonRegistrationEnhancer.js', import.meta.url), 'utf8');
  assert.match(src, /Join this season/);
  assert.match(src, /Not registered/);
  assert.match(src, /Payment due/);
  assert.match(src, /Registered • Payment due/);
  assert.match(src, /Registered • Paid/);
  assert.doesNotMatch(src, /season_registration/);
  assert.doesNotMatch(src, /payment_status/);
});
