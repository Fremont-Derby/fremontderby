import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

test('operations overview prefers an active season', () => {
  const source = fs.readFileSync(new URL('../src/adminOperationsRepository.js', import.meta.url), 'utf8');
  assert.match(source, /status=eq\.active/);
});
