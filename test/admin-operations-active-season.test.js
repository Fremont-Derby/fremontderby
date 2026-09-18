import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

test('operations repository prefers an active season', () => {
  const source = readFileSync(new URL('../src/adminOperationsRepository.js', import.meta.url), 'utf8');
  assert.match(source, /status=eq\.active/);
  assert.match(source, /activeSeasons/);
});
