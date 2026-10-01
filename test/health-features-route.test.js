import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

test('health/features route is wired in index router', () => {
  const src = readFileSync(new URL('../src/index.js', import.meta.url), 'utf8');
  assert.match(src, /pathname === "\/health\/features"/);
  assert.match(src, /teamPractice/);
  assert.match(src, /migration_pending/);
});
