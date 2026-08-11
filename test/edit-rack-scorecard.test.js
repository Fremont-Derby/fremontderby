import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { updatePlayerMatchScoreRackCommand } from '../src/dualScoringCommands.js';
import { createDualScoringHttpHandlers } from '../src/dualScoringHttp.js';
import { createDualScoringRepository } from '../src/dualScoringRepository.js';
import { renderScorecardPage } from '../src/scorecardPage.js';

const migrationPath = new URL(
  '../supabase/migrations/20260811233000_edit_player_match_score_rack.sql',
  import.meta.url,
);

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

test('rack edit command normalizes a specific rack number and preserves scoring-team context', async () => {
  const calls = [];
  const repository = {
    async updatePlayerMatchScoreRack(input) {
      calls.push(input);
      return input;
    },
  };

  const result = await updatePlayerMatchScoreRackCommand({
    actorUserId: 'user-1',
    playerMatchId: 'match-1',
    scoringTeamId: 'team-a',
    rackNumber: '2',
    winnerSide: 'B',
  }, repository);

  assert.equal(result.rackNumber, 2);
  assert.deepEqual(calls, [{
    actorUserId: 'user-1',
    playerMatchId: 'match-1',
    scoringTeamId: 'team-a',
    rackNumber: 2,
    winnerSide: 'B',
  }]);

  await assert.rejects(
    updatePlayerMatchScoreRackCommand({
      actorUserId: 'user-1', playerMatchId: 'match-1', scoringTeamId: 'team-a', rackNumber: 0, winnerSide: 'A',
    }, repository),
    /rackNumber must be a positive integer/,
  );
});

test('repository calls the surgical rack RPC with one target rack', async () => {
  const calls = [];
  const repository = createDualScoringRepository({
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'server-secret',
  }, {
    fetch: async (url, init) => {
      calls.push({ url, init });
      return jsonResponse([{
        player_match_id: 'match-1',
        rack_number: 2,
        previous_winner_side: 'A',
        winner_side: 'B',
      }]);
    },
  });

  const result = await repository.updatePlayerMatchScoreRack({
    actorUserId: 'user-1',
    playerMatchId: 'match-1',
    scoringTeamId: 'team-a',
    rackNumber: 2,
    winnerSide: 'B',
  });

  assert.equal(result.rack_number, 2);
  assert.match(calls[0].url, /update_player_match_score_rack$/);
  assert.equal(calls[0].init.headers.authorization, 'Bearer server-secret');
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    actor_user_id: 'user-1',
    target_player_match_id: 'match-1',
    target_scoring_team_id: 'team-a',
    target_rack_number: 2,
    rack_winner_side: 'B',
  });
});

test('existing score-racks HTTP endpoint routes rackNumber to edit instead of append', async () => {
  const calls = [];
  const handlers = createDualScoringHttpHandlers({
    authenticate: async () => ({ id: 'user-1' }),
    createRepository: () => ({
      async updatePlayerMatchScoreRack(input) {
        calls.push(['update', input]);
        return { rack_number: input.rackNumber, winner_side: input.winnerSide };
      },
      async recordPlayerMatchScoreRack(input) {
        calls.push(['record', input]);
        return { rack_number: 6 };
      },
    }),
  });
  const request = new Request('https://example.test?scoringTeamId=team-a', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ rackNumber: 2, winnerSide: 'B' }),
  });

  const response = await handlers.record(request, {}, 'match-1');
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    rack: { rack_number: 2, winner_side: 'B' },
  });
  assert.deepEqual(calls, [[
    'update',
    {
      actorUserId: 'user-1',
      playerMatchId: 'match-1',
      scoringTeamId: 'team-a',
      rackNumber: 2,
      winnerSide: 'B',
    },
  ]]);
});

test('migration edits only one team-owned rack, preserves later racks, clears confirmation, and audits old/new history', async () => {
  const sql = await readFile(migrationPath, 'utf8');

  assert.match(sql, /update_player_match_score_rack/);
  assert.match(sql, /private\.match_tracker_for_scoring_team/);
  assert.match(sql, /jsonb_set\(/);
  assert.match(sql, /array\[\(target_rack_number - 1\)::text, 'winnerSide'\]/);
  assert.match(sql, /where id = submission\.id/);
  assert.match(sql, /confirmed_at = null/);
  assert.match(sql, /player_match\.team_score_rack_edit/);
  assert.match(sql, /'rackNumber', target_rack_number/);
  assert.match(sql, /'winnerSide', previous_winner/);
  assert.match(sql, /'winnerSide', rack_winner_side/);
  assert.match(sql, /'racks', submission\.racks/);
  assert.match(sql, /'racks', next_racks/);
  assert.match(sql, /revoke all on function public\.update_player_match_score_rack[\s\S]*from public, anon, authenticated/);
  assert.match(sql, /grant execute on function public\.update_player_match_score_rack[\s\S]*to service_role/);
});

test('live rack ledger exposes edit controls only for the owned row and preserves ledger position after correction', () => {
  const html = renderScorecardPage();

  assert.match(html, /data-edit-panel/);
  assert.match(html, /data-edit-rack/);
  assert.match(html, /data-edit-result="W"/);
  assert.match(html, /data-edit-result="L"/);
  assert.match(html, /currentComparison\.tracker_player_id===playerId/);
  assert.match(html, /Change only your team’s submission/);
  assert.match(html, /Later racks stay exactly as entered/);
  assert.match(html, /ledgerRestoreLeft=ledgerScroll\.scrollLeft/);
  assert.match(html, /rackNumber,winnerSide:winner,scoringTeamId/);
  assert.match(html, /currentComparison\.own_confirmed_at/);
});

test('rack mismatch and pending states identify the exact column without relying on color alone', () => {
  const html = renderScorecardPage();

  assert.match(html, /rack-head\[data-state=mismatch\]/);
  assert.match(html, /rack-status\[data-state=mismatch\]/);
  assert.match(html, /state==='mismatch'\?'⚠'/);
  assert.match(html, /state==='pending'\?'…'/);
  assert.match(html, /aria-label','Rack '\+number\+' '\+state/);
});

test('approved single Add Rack action reveals winner choices instead of keeping both primary controls exposed', () => {
  const html = renderScorecardPage();

  assert.match(html, /data-add-rack/);
  assert.match(html, /Add Rack 1/);
  assert.match(html, /winner-picker/);
  assert.match(html, /winnerPicker\.dataset\.open=winnerPicker\.dataset\.open==='true'\?'false':'true'/);
  assert.match(html, /winnerPicker\.dataset\.open='false'/);
});
