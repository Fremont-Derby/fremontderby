import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sql = await readFile(
  new URL(
    '../supabase/migrations/20261023164000_jfl_scorekeeper_takeover_revalidation.sql',
    import.meta.url,
  ),
  'utf8',
);

function functionBody(start, end) {
  const startIndex = sql.indexOf(start);
  const endIndex = sql.indexOf(end, startIndex + start.length);
  assert.notEqual(startIndex, -1, `missing ${start}`);
  assert.notEqual(endIndex, -1, `missing boundary ${end}`);
  return sql.slice(startIndex, endIndex);
}

test('eligibility repair is a new forward-only migration', () => {
  assert.match(sql, /Forward-only repair/i);
  assert.doesNotMatch(sql, /create table jfl_private\.player_match_score_claims/i);
  assert.doesNotMatch(sql, /create type jfl_private\.player_match_score_claim_state/i);
  assert.match(
    sql,
    /create or replace function jfl_private\.score_claim_actor_is_eligible/i,
  );
  assert.match(
    sql,
    /require_score_claim_actor\(\s*actor_user_id,\s*target_match,\s*target_scoring_team_id\s*\)/i,
  );
  assert.match(sql, /exception when raise_exception then\s*return false/i);
});

test('expired takeover revalidates its recipient before ownership changes', () => {
  const body = functionBody(
    'create or replace function jfl_private.resolve_expired_score_takeover',
    'create or replace function jfl.respond_player_match_score_takeover',
  );

  assert.match(
    body,
    /score_claim_actor_is_eligible\(\s*next_owner,\s*target_match,\s*target_scoring_team_id\s*\)/i,
  );
  assert.match(body, /scorekeeper_takeover_ineligible/i);
  assert.match(body, /pending_requester_user_id=null/i);
  assert.match(body, /ownerUserId',claim\.owner_user_id/i);
});

test('explicit release revalidates its recipient before ownership changes', () => {
  const body = functionBody(
    'create or replace function jfl.respond_player_match_score_takeover',
    'revoke all on function jfl_private.score_claim_actor_is_eligible',
  );

  assert.match(
    body,
    /score_claim_actor_is_eligible\(\s*next_owner,\s*target_match,\s*target_scoring_team_id\s*\)/i,
  );
  assert.match(body, /scorekeeper_takeover_ineligible/i);
  assert.match(body, /pending_requester_user_id=null/i);
  assert.match(body, /ownerUserId',claim\.owner_user_id/i);
});

test('the forward migration keeps all repaired functions service-role only', () => {
  for (const signature of [
    'jfl_private.score_claim_actor_is_eligible\\(uuid,jfl.player_matches,uuid\\)',
    'jfl_private.resolve_expired_score_takeover\\(uuid,uuid\\)',
    'jfl.respond_player_match_score_takeover\\(uuid,uuid,uuid,text\\)',
  ]) {
    assert.match(
      sql,
      new RegExp(
        `revoke all on function ${signature}\\s+from public,anon,authenticated`,
        'i',
      ),
    );
    assert.match(
      sql,
      new RegExp(
        `grant execute on function ${signature}\\s+to service_role`,
        'i',
      ),
    );
  }
});

test('the forward migration uses hardened function settings and valid delimiters', () => {
  assert.equal(
    (sql.match(/security definer/g) || []).length,
    (sql.match(/set search_path=''/g) || []).length,
  );
  assert.equal(
    (sql.match(/as \$\$/g) || []).length,
    (sql.match(/\n\$\$;/g) || []).length,
  );
  assert.doesNotMatch(sql, /(?:as|end;)\s+\$;/i);
});
