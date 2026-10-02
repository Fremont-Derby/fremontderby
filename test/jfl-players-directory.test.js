import assert from 'node:assert/strict';
import test from 'node:test';

import { publicDirectoryRows, renderJflPlayersDirectory, routeJflPlayersDirectory } from '../src/jflPlayersDirectory.js';
import worker from '../src/personaRouterEntry.js';

test('player directory projects public standings and team context without private fields', () => {
  const rows = publicDirectoryRows([
    { player_id: 'player-1', display_name: 'Alex Cue', standings_rank: 2, wins: 3, losses: 1, matches_played: 4, phone: 'private', payment_status: 'unpaid' },
    { player_id: 'player-2', display_name: 'Sam Break', standings_rank: null, wins: 0, losses: 0, matches_played: 0 },
  ], [{ team_name: 'Side Pockets', roster: [{ playerId: 'player-1', displayName: 'Alex Cue', privatePhone: 'private' }] }]);
  assert.deepEqual(rows, [
    { name: 'Alex Cue', team: 'Side Pockets', rank: 2, wins: 3, losses: 1, matches: 4 },
    { name: 'Sam Break', team: 'Free agent / no team listed', rank: null, wins: 0, losses: 0, matches: 0 },
  ]);
  assert.doesNotMatch(JSON.stringify(rows), /private|payment|player-1|player-2/);
});

test('JFL players route is real, public, navigable, and leaves Trades retired', async () => {
  const response = await worker.fetch(
    new Request('https://jfl.fremontderby.com/players'),
    { ENVIRONMENT: 'jfl' },
  );
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<h1>Players<\/h1>/);
  assert.match(html, /data-search/);
  assert.match(html, /individual-standings/);
  assert.match(html, /team-standings/);
  assert.match(html, /View results/);
  assert.doesNotMatch(renderJflPlayersDirectory(), /href="\/trades"|\/api\/admin\/players/);
  const denied = routeJflPlayersDirectory(new Request('https://jfl.fremontderby.com/players', { method: 'POST' }), { ENVIRONMENT: 'jfl' });
  assert.equal(denied.status, 405);
  assert.equal(routeJflPlayersDirectory(new Request('https://fremontderby.com/players'), { ENVIRONMENT: 'production' }), null);
});
