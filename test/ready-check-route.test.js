import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeApiPathname } from '../src/pathAliases.js';

test('POST /api/ready-checks is routed to start', () => {
  const src = readFileSync(new URL('../src/router.js', import.meta.url), 'utf8');
  assert.match(src, /pathname === '\/api\/ready-checks'/);
  assert.match(src, /readyCheckHttpHandlers\.start/);
});

test('schedule match card has lineup link', () => {
  const src = readFileSync(new URL('../src/schedulePage.js', import.meta.url), 'utf8');
  assert.match(src, /lineup\.href/);
  assert.match(src, /actions\.append\(score,lineup,messages\)/);
});
