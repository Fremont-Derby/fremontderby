import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('removing a player names the roster consequence', () => {
  const source = fs.readFileSync(new URL('../src/adminPlayersPage.js', import.meta.url), 'utf8');
  assert.match(source, /removes the player from that team roster for the season/);
});
