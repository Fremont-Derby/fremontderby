import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

test('operations repository prefers an active season', () => {
  const source = readFileSync(new URL('../src/adminOperationsRepository.js', import.meta.url), 'utf8');
  const helper = readFileSync(new URL('../src/adminOperationsSeasonPick.js', import.meta.url), 'utf8');
  assert.match(source, /fetchOperationsSeason/);
  assert.match(helper, /status=eq\.active/);
  assert.match(helper, /activeSeasons/);
});
