import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  getPlayerMatchScoreComparisonCommand,
  recordPlayerMatchScoreRackCommand,
} from '../src/dualScoringCommands.js';
import { createDualScoringRepository } from '../src/dualScoringRepository.js';
import { renderScorePickerPage } from '../src/scorePickerPage.js';
import { renderScorecardPage } from '../src/scorecardPage.js';

const migration = readFileSync(
  new URL('../supabase/migrations/20260811120500_explicit_scoring_team_context.sql', import.meta.url),
  'utf8',
);

test('dual scoring commands require explicit scoring team context', async () => {
  const repository = { getPlayerMatchScoreComparison: async (input) => input };
  await assert.rejects(
    () => getPlayerMatchScoreComparisonCommand({ actorUserId: 'user', playerMatchId: 'match' }, repository),
    /scoringTeamId is required/,
  );
  assert.deepEqual(
    await getPlayerMatchScoreComparisonCommand({ actorUserId: 'user', playerMatchId: 'match', scoringTeamId: 'team-a' }, repository),
    { actorUserId: 'user', playerMatchId: 'match', scoringTeamId: 'team-a' },
  );
});

test('rack command preserves selected scoring team', async () => {
  let input;
  const repository = { recordPlayerMatchScoreRack: async (value) => { input = value; return value; } };
  await recordPlayerMatchScoreRackCommand({
    actorUserId: 'user', playerMatchId: 'match', scoringTeamId: 'team-b', winnerSide: 'A',
  }, repository);
  assert.equal(input.scoringTeamId, 'team-b');
});

test('repository sends target_scoring_team_id to Supabase RPC', async () => {
  let requestBody;
  const repository = createDualScoringRepository(
    { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'service' },
    { fetch: async (_url, init) => {
      requestBody = JSON.parse(init.body);
      return new Response(JSON.stringify([{ ok: true }]), { status: 200 });
    } },
  );
  await repository.getPlayerMatchScoreComparison({ actorUserId: 'user', playerMatchId: 'match', scoringTeamId: 'team-a' });
  assert.equal(requestBody.target_scoring_team_id, 'team-a');
  assert.equal(requestBody.scoring_team_id, undefined);
});

test('picker and live scorecard preserve an explicit team choice', () => {
  const picker = renderScorePickerPage();
  const live = renderScorecardPage();
  assert.match(picker, /scoring_team_id/);
  assert.match(picker, /scoring_team_name/);
  assert.match(picker, /If you belong to both teams/);
  assert.match(live, /params\.get\('team'\)/);
  assert.match(live, /scoringTeamId=/);
  assert.match(live, /Switch match \/ scoring team/);
  assert.match(live, /Scoring for/);
});

test('migration removes ambiguous RPCs and authorizes the chosen team only', () => {
  assert.match(migration, /match_tracker_for_scoring_team/);
  assert.match(migration, /Actor is not an active member of the scoring team/);
  assert.match(migration, /Scoring team is not part of this player match/);
  assert.match(migration, /drop function if exists public\.record_player_match_score_rack\(uuid, uuid, text\)/);
  assert.match(migration, /target_scoring_team_id uuid/);
  assert.match(migration, /team_score_rack_record/);
  assert.match(migration, /team_score_confirm/);
  assert.match(migration, /scoring_team_name text/);
  assert.match(migration, /tm\.team_id in\(pm\.team_a_id,pm\.team_b_id\)/);
});
