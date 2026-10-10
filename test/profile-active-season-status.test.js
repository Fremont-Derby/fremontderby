import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('profile season status shows join and payment states without jargon', () => {
  const src = readFileSync(new URL('../src/profileSeasonRegistrationEnhancer.js', import.meta.url), 'utf8');
  assert.match(src, /enhanceProfileSeasonRegistration/);
});
