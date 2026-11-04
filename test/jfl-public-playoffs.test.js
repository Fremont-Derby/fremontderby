import assert from 'node:assert/strict';
import test from 'node:test';

import { publicPlayoffRounds, renderJflPublicPlayoffs, routeJflPublicPlayoffs } from '../src/jflPublicPlayoffs.js';
import worker from '../src/personaRouterEntry.js';

test('postseason projection keeps official results and anchor without private IDs', () => {
  const rounds = publicPlayoffRounds([
    { stage: 'regular', matches: [{ teamAName: 'Ignore' }] },
    { stage: 'championship', scheduledOn: '2026-04-02', status: 'finalized', matches: [{
      teamMatchId: 'private-id', teamAName: 'Breakers', teamBName: 'Pockets', status: 'finalized',
      teamAScore: 2, teamBScore: 3, paymentStatus: 'private',
      anchorTiebreaker: { playerAName: 'Alex', playerBName: 'Sam', scoreA: 3, scoreB: 4, status: 'finalized', playerId: 'private-id' },
    }] },
    { stage: 'semifinal', matches: [{ teamAName: 'Breakers', teamBName: 'Chalk', status: 'scheduled', teamAScore: 0, teamBScore: 0 }] },
  ]);
  assert.equal(rounds.length, 2);
  assert.equal(rounds[0].stage, 'semifinal');
  assert.equal(rounds[0].matches[0].winner, null);
  assert.equal(rounds[0].matches[0].scoreA, null);
  assert.equal(rounds[1].matches[0].winner, 'Pockets');
  assert.deepEqual(rounds[1].matches[0].anchor, { playerA: 'Alex', playerB: 'Sam', scoreA: 3, scoreB: 4, status: 'finalized' });
  assert.doesNotMatch(JSON.stringify(rounds), /private-id|paymentStatus|playerId/);
  assert.deepEqual(publicPlayoffRounds([]), []);
});

test('JFL playoffs route is public, navigable, and scoped to JFL', async () => {
  const response = await worker.fetch(new Request('https://jfl.fremontderby.com/playoffs'), { ENVIRONMENT: 'jfl' });
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<h1>Playoffs<\/h1>/);
  assert.match(html, /\/api\/seasons\/.*\/schedule/);
  assert.match(html, /data-nav-key="playoffs"/);
  assert.match(renderJflPublicPlayoffs(), /Anchor tiebreaker/);
  assert.equal(routeJflPublicPlayoffs(new Request('https://jfl.fremontderby.com/playoffs', { method: 'POST' }), { ENVIRONMENT: 'jfl' }).status, 405);
  assert.equal(routeJflPublicPlayoffs(new Request('https://fremontderby.com/playoffs'), { ENVIRONMENT: 'production' }), null);
});
