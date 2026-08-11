import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  setPlayerMatchOpeningDisciplineCommand,
} from '../src/dualScoringCommands.js';
import { createDualScoringHttpHandlers } from '../src/dualScoringHttp.js';
import { createDualScoringRepository } from '../src/dualScoringRepository.js';
import { renderScorecardPage } from '../src/scorecardPage.js';

const scoreContext = {
  actorUserId: 'user-1',
  playerMatchId: 'match-1',
  scoringTeamId: 'team-a',
};

test('opening-discipline command normalizes 8/9 shorthand and rejects invalid games', async () => {
  const calls = [];
  const repository = {
    async setPlayerMatchOpeningDiscipline(input) {
      calls.push(input);
      return { selected_opening_discipline: input.openingDiscipline };
    },
  };

  const result = await setPlayerMatchOpeningDisciplineCommand(
    { ...scoreContext, openingDiscipline: '9' },
    repository,
  );

  assert.equal(result.selected_opening_discipline, '9-ball');
  assert.deepEqual(calls, [{ ...scoreContext, openingDiscipline: '9-ball' }]);

  await assert.rejects(
    setPlayerMatchOpeningDisciplineCommand(
      { ...scoreContext, openingDiscipline: '10-ball' },
      repository,
    ),
    /openingDiscipline must be 8-ball or 9-ball/,
  );
});

test('repository persists shared opening discipline through trusted RPC context', async () => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    return new Response(JSON.stringify([{
      selected_opening_discipline: '9-ball',
      selected_current_discipline: '9-ball',
      opening_block_length: 3,
    }]), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  const repository = createDualScoringRepository({
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'server-only-key',
  }, { fetch: fetchImpl });

  const result = await repository.setPlayerMatchOpeningDiscipline({
    ...scoreContext,
    openingDiscipline: '9-ball',
  });

  assert.equal(result.selected_opening_discipline, '9-ball');
  assert.match(calls[0].url, /\/rest\/v1\/rpc\/set_player_match_opening_discipline$/);
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    actor_user_id: 'user-1',
    target_player_match_id: 'match-1',
    target_scoring_team_id: 'team-a',
    opening_discipline: '9-ball',
  });
});

test('score-rack HTTP path accepts opening order without recording a rack', async () => {
  const calls = [];
  const repository = {
    async setPlayerMatchOpeningDiscipline(input) {
      calls.push(['set', input]);
      return { selected_opening_discipline: input.openingDiscipline };
    },
    async recordPlayerMatchScoreRack(input) {
      calls.push(['record', input]);
      return { rack_number: 1 };
    },
  };
  const handlers = createDualScoringHttpHandlers({
    authenticate: async () => ({ id: 'user-1' }),
    createRepository: () => repository,
  });
  const request = new Request('https://example.test?scoringTeamId=team-a', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ openingDiscipline: '8-ball' }),
  });

  const response = await handlers.record(request, {}, 'match-1');

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    setup: { selected_opening_discipline: '8-ball' },
  });
  assert.deepEqual(calls, [[
    'set',
    { ...scoreContext, openingDiscipline: '8-ball' },
  ]]);
});

test('opening order lock is surfaced as a conflict after rack 1 exists', async () => {
  const handlers = createDualScoringHttpHandlers({
    authenticate: async () => ({ id: 'user-1' }),
    createRepository: () => ({
      async setPlayerMatchOpeningDiscipline() {
        throw new Error('Opening discipline is locked after rack 1 is recorded');
      },
    }),
  });
  const request = new Request('https://example.test?scoringTeamId=team-a', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ openingDiscipline: '9-ball' }),
  });

  const response = await handlers.record(request, {}, 'match-1');
  assert.equal(response.status, 409);
  assert.match((await response.json()).error, /locked after rack 1/);
});

test('scorecard renders an accessible persisted 8-first / 9-first selector', () => {
  const html = renderScorecardPage();

  assert.match(html, /Which game first\?/);
  assert.match(html, /data-opening="8-ball"[^>]*>8 first</);
  assert.match(html, /data-opening="9-ball"[^>]*>9 first</);
  assert.match(html, /aria-pressed="false"/);
  assert.match(html, /renderOpeningChoice/);
  assert.match(html, /opening_discipline/);
  assert.match(html, /Order locked after rack 1/);
  assert.match(html, /chooseOpeningDiscipline/);
  assert.match(html, /openingDiscipline/);
});

test('migration authorizes the shared choice, locks it after scoring, and audits changes', () => {
  const sql = readFileSync(new URL(
    '../supabase/migrations/20260811231500_choose_player_match_opening_discipline.sql',
    import.meta.url,
  ), 'utf8');

  assert.match(sql, /set_player_match_opening_discipline/);
  assert.match(sql, /private\.match_tracker_for_scoring_team/);
  assert.match(sql, /opening_discipline not in \('8-ball', '9-ball'\)/);
  assert.match(sql, /private\.player_match_score_submissions/);
  assert.match(sql, /public\.player_match_racks/);
  assert.match(sql, /Opening discipline is locked after rack 1 is recorded/);
  assert.match(sql, /set opening_discipline = set_player_match_opening_discipline\.opening_discipline/);
  assert.match(sql, /current_discipline = set_player_match_opening_discipline\.opening_discipline/);
  assert.match(sql, /player_match\.set_opening_discipline/);
  assert.match(sql, /revoke all on function public\.set_player_match_opening_discipline/);
  assert.match(sql, /grant execute on function public\.set_player_match_opening_discipline[\s\S]*to service_role/);
});
