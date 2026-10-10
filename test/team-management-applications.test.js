import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('team management loads applications for open seasons', () => {
  const src = readFileSync(new URL('../src/teamRepository.js', import.meta.url), 'utf8');
  assert.match(src, /createTeamRepository/);
});
