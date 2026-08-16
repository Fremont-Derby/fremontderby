import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('admin audit empty recovery and score nav', () => {
  const src = readFileSync(new URL('../src/adminAuditPage.js', import.meta.url), 'utf8');
  assert.match(src, /href="\/scorecard"/);
  assert.match(src, /No audit events yet/);
  assert.match(src, /ready_check/);
  assert.match(src, /\/trades/);
});
