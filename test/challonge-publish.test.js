import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCandidateATournament,
  challongeConfigured,
  publishPlayerMatchCandidateA,
} from '../src/challongePublish.js';

test('build candidate A payload is stable and non-private', () => {
  const plan = buildCandidateATournament({
    playerMatchId: 'abc-123-def',
    playerAName: 'Ada',
    playerBName: 'Ben',
    racksA: 5,
    racksB: 2,
    discipline: '8-ball',
  });
  assert.equal(plan.tournament.tournament_type, 'single elimination');
  assert.equal(plan.tournament.private, false);
  assert.match(plan.tournament.description, /derby_player_match_id=abc-123-def/);
  assert.equal(plan.participants.length, 2);
  assert.equal(plan.score.racksA, 5);
});

test('not configured returns plan without calling network', async () => {
  const result = await publishPlayerMatchCandidateA(
    {},
    { playerMatchId: 'm1', playerAName: 'A', playerBName: 'B', racksA: 1, racksB: 0 },
    {
      fetchImpl: async () => {
        throw new Error('network should not be used');
      },
    },
  );
  assert.equal(result.status, 'not_configured');
  assert.ok(result.plan);
});

test('dryRun never hits network even with key', async () => {
  const result = await publishPlayerMatchCandidateA(
    { CHALLONGE_API_KEY: 'test-key' },
    { playerMatchId: 'm2', playerAName: 'A', playerBName: 'B', racksA: 3, racksB: 1 },
    {
      dryRun: true,
      fetchImpl: async () => {
        throw new Error('network should not be used');
      },
    },
  );
  assert.equal(result.status, 'dry_run');
});

test('challongeConfigured', () => {
  assert.equal(challongeConfigured({}), false);
  assert.equal(challongeConfigured({ CHALLONGE_API_KEY: 'x' }), true);
});
