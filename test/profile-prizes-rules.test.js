import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeApiPathname } from '../src/pathAliases.js';

test('profile shortcuts include prizes and rules', () => {
  const src = readFileSync(new URL('../src/profilePage.js', import.meta.url), 'utf8');
  const i = src.indexOf('profile-shortcuts');
  const chunk = src.slice(i, i + 3000);
  assert.match(chunk, /href="\/prizes"/);
  assert.match(chunk, /href="\/rules"/);
});

test('prize path aliases', () => {
  assert.equal(normalizeApiPathname('/api/me/prizes'), '/api/prizes');
  assert.equal(normalizeApiPathname('/api/prize-pool'), '/api/prizes');
});
