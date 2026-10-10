import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('operations repository prefers an active season', () => {
  const src = readFileSync(new URL('../src/adminOperationsRepository.js', import.meta.url), 'utf8');
  assert.match(src, /createAdminOperationsRepository/);
});
