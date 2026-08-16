import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeApiPathname } from '../src/pathAliases.js';

test('score hub labels check in', () => {
  const src = readFileSync(new URL('../src/scorePickerPage.js', import.meta.url), 'utf8');
  assert.match(src, />Check in<\/a>/);
  assert.doesNotMatch(src, />Availability<\/a>/);
});

test('check-in path aliases', () => {
  assert.equal(normalizeApiPathname('/api/me/check-in'), '/api/me/availability');
  assert.equal(normalizeApiPathname('/api/me/checkin'), '/api/me/availability');
  assert.equal(normalizeApiPathname('/api/me/lineup'), '/api/me/teams');
});
