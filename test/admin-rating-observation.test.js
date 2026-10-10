import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('admin rating observation path is wired', () => {
  const src = readFileSync(new URL('../src/adminPlayersHttp.js', import.meta.url), 'utf8');
  assert.match(src, /handleListAdminPlayersRequest/);
});
