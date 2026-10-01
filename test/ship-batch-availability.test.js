import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeApiPathname } from '../src/pathAliases.js';

test('free-agent availability accepts POST', () => {
  const src = readFileSync(new URL('../src/index.js', import.meta.url), 'utf8');
  assert.match(src, /freeAgentAvailabilityMatch[\s\S]*?POST/);
  assert.match(src, /free_agent\.availability_set/);
  assert.match(src, /yes.*available/);
});

test('notification mark-as-read aliases', () => {
  assert.equal(
    normalizeApiPathname('/api/me/notifications/mark-as-read-all'),
    '/api/me/notifications/read-all',
  );
  assert.equal(
    normalizeApiPathname('/api/me/notifications/abc/mark-as-read'),
    '/api/me/notifications/abc/read',
  );
});
