import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sql = await readFile(
  new URL('../supabase/migrations/20261004035418_jfl_scorekeeper_claim_handoff.sql', import.meta.url),
  'utf8',
);

test('scorekeeper claim is exclusive per player match and team side', () => {
  assert.match(sql, /primary key \(player_match_id, scoring_team_id\)/i);
  assert.match(sql, /owner_user_id uuid references auth\.users/i);
  assert.match(sql, /Scorekeeping is already claimed; request takeover/i);
});

test('takeover requires an eligible same-team actor and auto-transfers after 15 seconds', () => {
  assert.match(sql, /match_tracker_for_scoring_team\(actor_user_id,target_match,target_scoring_team_id\)/i);
  assert.match(sql, /player_competition_restrictions/i);
  assert.match(sql, /pending_expires_at=now\(\)\+interval '15 seconds'/i);
  assert.match(sql, /scorekeeper_takeover_auto_transfer/i);
  assert.match(sql, /Another scorekeeping takeover request is already pending/i);
});

test('current scorekeeper can release or deny and all RPCs remain service-role only', () => {
  assert.match(sql, /decision not in \('release','deny'\)/i);
  assert.match(sql, /Only the current scorekeeper can respond to takeover/i);
  for (const signature of [
    'jfl.get_player_match_score_claim\\(uuid,uuid,uuid\\)',
    'jfl.claim_player_match_score\\(uuid,uuid,uuid\\)',
    'jfl.request_player_match_score_takeover\\(uuid,uuid,uuid\\)',
    'jfl.respond_player_match_score_takeover\\(uuid,uuid,uuid,text\\)',
    'jfl.release_player_match_score_claim\\(uuid,uuid,uuid\\)',
  ]) {
    assert.match(sql, new RegExp('revoke all on function '+signature+' from public,anon,authenticated', 'i'));
    assert.match(sql, new RegExp('grant execute on function '+signature+' to service_role', 'i'));
  }
});

test('claim ownership does not redefine the authoritative score tracker', () => {
  assert.match(sql, /player_match_score_claims/i);
  assert.doesNotMatch(sql, /player_match_score_submissions/);
  assert.doesNotMatch(sql, /record_player_match_score_rack\(/i);
});
