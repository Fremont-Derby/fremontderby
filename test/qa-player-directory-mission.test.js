import test from 'node:test';
import assert from 'node:assert/strict';
import { PLAYER_DIRECTORY_MISSION, buildPlayerDirectoryFixture } from '../src/qaPlayerDirectoryContract.js';
import { renderPlayersDirectoryPage } from '../src/playersDirectoryPage.js';

test('directory mission stays on the public players page', () => {
  assert.equal(PLAYER_DIRECTORY_MISSION.missionId, 'player.find-in-directory');
  assert.ok(PLAYER_DIRECTORY_MISSION.productRoutes.includes('/players'));
});

test('same seed rebuilds the intended name and query', () => {
  const a = buildPlayerDirectoryFixture('dir-1');
  const b = buildPlayerDirectoryFixture('dir-1');
  assert.equal(a.intended.name, b.intended.name);
  assert.match(a.intended.query, /\?player=/);
  assert.ok(a.distractors.every((row) => row.name !== a.intended.name));
});

test('live directory page can mark the requested player and hides ids', () => {
  const html = renderPlayersDirectoryPage();
  assert.match(html, /data-requested-player/);
  assert.match(html, /get\('player'\)/);
  assert.doesNotMatch(html, /player_id/);
});
