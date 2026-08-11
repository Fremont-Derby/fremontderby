import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { setPlayerMatchOpeningDisciplineCommand } from '../src/dualScoringCommands.js';
import { createDualScoringRepository } from '../src/dualScoringRepository.js';
import { renderScorecardPage } from '../src/scorecardPage.js';

const migrationPath = new URL(
  '../supabase/migrations/20260811231500_choose_player_match_opening_discipline.sql',
  import.meta.url,
);

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

test('opening discipline migration is team-authorized, audited, locked after rack 1, and service-role only', async () => {
  const sql = await readFile(migrationPath, 'utf8');
  assert.match(sql, /set_player_match_opening_discipline/);
  assert.match(sql, /private\.match_tracker_for_scoring_team/);
  assert.match(sql, /opening_discipline not in \('8-ball', '9-ball'\)/);
  assert.match(sql, /Opening discipline is locked after rack 1 is recorded/);
  assert.match(sql, /player_match\.set_opening_discipline/);
  assert.match(sql, /current_discipline = set_player_match_opening_discipline\.opening_discipline/);
  assert.match(sql, /revoke all on function public\.set_player_match_opening_discipline[\s\S]*from public, anon, authenticated/);
  assert.match(sql, /grant execute on function public\.set_player_match_opening_discipline[\s\S]*to service_role/);
});

test('opening discipline command normalizes compact choices and keeps scoring-team context', async () => {
  const calls = [];
  const repository = {
    async setPlayerMatchOpeningDiscipline(input) {
      calls.push(input);
      return { selected_opening_discipline: input.openingDiscipline };
    },
  };

  const result = await setPlayerMatchOpeningDisciplineCommand({
    actorUserId: 'user-1',
    playerMatchId: 'match-1',
    scoringTeamId: 'team-1',
    openingDiscipline: '9',
  }, repository);

  assert.equal(result.selected_opening_discipline, '9-ball');
  assert.deepEqual(calls, [{
    actorUserId: 'user-1',
    playerMatchId: 'match-1',
    scoringTeamId: 'team-1',
    openingDiscipline: '9-ball',
  }]);
});

test('dual scoring repository persists the shared opening discipline with the server credential', async () => {
  const calls = [];
  const repository = createDualScoringRepository({
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'server-secret',
  }, {
    fetch: async (url, init) => {
      calls.push({ url, init });
      return jsonResponse([{
        player_match_id: 'match-1',
        selected_opening_discipline: '8-ball',
        selected_current_discipline: '8-ball',
        opening_block_length: 3,
      }]);
    },
  });

  await repository.setPlayerMatchOpeningDiscipline({
    actorUserId: 'user-1',
    playerMatchId: 'match-1',
    scoringTeamId: 'team-1',
    openingDiscipline: '8-ball',
  });

  assert.match(calls[0].url, /set_player_match_opening_discipline$/);
  assert.equal(calls[0].init.headers.authorization, 'Bearer server-secret');
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    actor_user_id: 'user-1',
    target_player_match_id: 'match-1',
    target_scoring_team_id: 'team-1',
    opening_discipline: '8-ball',
  });
});

test('live scorecard exposes an accessible 8-first / 9-first control and locks it from shared rack history', () => {
  const html = renderScorecardPage();
  assert.match(html, /Which game first\?/);
  assert.match(html, />8 first</);
  assert.match(html, />9 first</);
  assert.match(html, /aria-pressed/);
  assert.match(html, /opening_discipline/);
  assert.match(html, /ownRacks\.length>0\|\|opponentRacks\.length>0/);
  assert.match(html, /Order locked after rack 1/);
  assert.match(html, /openingDiscipline,scoringTeamId/);
  assert.match(html, /Racks 1–3 use this game/);
});
