import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { createDualScoringRepository } from '../src/dualScoringRepository.js';
import { renderScorecardPage } from '../src/scorecardPage.js';

const migrationPath = new URL(
  '../supabase/migrations/20260811232000_player_match_live_context.sql',
  import.meta.url,
);

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

test('live context derives round, match position, and running team score from authoritative match rows', async () => {
  const sql = await readFile(migrationPath, 'utf8');
  assert.match(sql, /r\.round_number/);
  assert.match(sql, /target_match\.slot_number/);
  assert.match(sql, /count\(\*\)::integer[\s\S]*sibling\.team_match_id = target_match\.team_match_id/);
  assert.match(sql, /sibling\.status in \('finalized', 'corrected'\)/);
  assert.match(sql, /sibling\.winner_side = 'A'/);
  assert.match(sql, /sibling\.winner_side = 'B'/);
  assert.match(sql, /private\.can_score_player_match/);
  assert.match(sql, /revoke all on function public\.get_player_match_live_context[\s\S]*from public, anon, authenticated/);
  assert.match(sql, /grant execute on function public\.get_player_match_live_context[\s\S]*to service_role/);
});

test('dual scoring repository reads live context through the server credential', async () => {
  const calls = [];
  const repository = createDualScoringRepository({
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'server-secret',
  }, {
    fetch: async (url, init) => {
      calls.push({ url, init });
      return jsonResponse([{
        player_match_id: 'match-2',
        round_number: 4,
        match_number: 3,
        match_count: 3,
        team_a_name: 'Breakers',
        team_b_name: 'Railbirds',
        team_score_a: 1,
        team_score_b: 1,
      }]);
    },
  });

  const context = await repository.getPlayerMatchLiveContext({
    actorUserId: 'user-1',
    playerMatchId: 'match-2',
  });

  assert.equal(context.team_score_a, 1);
  assert.equal(context.team_score_b, 1);
  assert.match(calls[0].url, /get_player_match_live_context$/);
  assert.equal(calls[0].init.headers.authorization, 'Bearer server-secret');
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    actor_user_id: 'user-1',
    target_player_match_id: 'match-2',
  });
});

test('scorecard first view is a compact aligned W/L rack ledger with contained horizontal scrolling', () => {
  const html = renderScorecardPage();
  assert.match(html, /Running team score/);
  assert.match(html, /Round '\+context\.round_number\+' • Match '\+context\.match_number\+' of '\+context\.match_count/);
  assert.match(html, /Current individual race/);
  assert.match(html, /Rack ledger/);
  assert.match(html, /data-ledger-scroll/);
  assert.match(html, /overflow-x:auto/);
  assert.match(html, /body\{[^}]*overflow-x:hidden/);
  assert.match(html, /cellValue\(rack,playerSide\)/);
  assert.match(html, /winnerSide\(rack\)===playerSide\?'W':'L'/);
  assert.match(html, /\.submission\[data-state=matched\]/);
  assert.match(html, /\.submission\[data-state=pending\]/);
  assert.match(html, /\.submission\[data-state=mismatch\]/);
  assert.match(html, /aria-label','Rack '\+number\+', '\+gameForRack\(number\)/);
  assert.match(html, /game\.setAttribute\('aria-label',gameForRack\(number\)\)/);
  assert.match(html, /Match details/);
});

test('individual score counts only reconciled matching rack submissions and next rack uses persisted discipline order', () => {
  const html = renderScorecardPage();
  assert.match(html, /if\(rackState\(own\[i\],opponent\[i\],i\+1\)!=='matched'\)continue/);
  assert.match(html, /if\(side==='A'\)a\+=1/);
  assert.match(html, /if\(side==='B'\)b\+=1/);
  assert.match(html, /opening_block_length\|\|3/);
  assert.match(html, /oppositeGame\(currentScorecard\.opening_discipline\)/);
  assert.match(html, /Math\.max\(own\.length,opponent\.length\)\+1/);
  assert.match(html, /data-next-discipline/);
});
